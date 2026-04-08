const NumerosControlController = require('../controllers/numerosControl.controller');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const jwt = require('jsonwebtoken');

async function rollbackTransactionQuietly(transaction) {
  if (!transaction) return;
  try {
    await transaction.rollback();
  } catch (_) {
    // Transacción ya confirmada, revertida o inválida
  }
}

// Obtener todos los recibos (con filtros y paginación)
exports.getAllRecibos = async (req, res) => {
  try {
    const { ReciboCabeza, Cliente } = req.models;
    const {
      page,
      limit = 10,
      search = '',
      field = 'Fecha',
      order = 'DESC',
      clienteCodigo = '',
      fechaDesde = '',
      fechaHasta = ''
    } = req.query;
    
    // Si no se proporciona page, usar 1 por defecto
    const pageValue = page ? parseInt(page) : 1;
    
    console.log('🔍 Backend - Query recibido:', req.query);
    console.log('🔍 Backend - limit:', limit);

    // Si no se proporciona limit o se especifica all=true, obtener todos los registros
    const shouldGetAll = !limit || limit === 'undefined' || limit === 'null' || req.query.all === 'true';
    const limitValue = shouldGetAll ? null : parseInt(limit);
    const offset = shouldGetAll ? 0 : (pageValue - 1) * limitValue;
    const whereClause = {};
    
    console.log('🔍 Backend - shouldGetAll:', shouldGetAll);
    console.log('🔍 Backend - limitValue:', limitValue);
    
    if (clienteCodigo) {
      whereClause.ClienteCodigo = clienteCodigo;
    }
    
    if (fechaDesde || fechaHasta) {
      whereClause.Fecha = {};
      if (fechaDesde) whereClause.Fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.Fecha[Op.lte] = fechaHasta;
    }
    
    if (search) {
      whereClause.DocumentoNumero = { [Op.like]: `%${search}%` };
    }

    const validFields = ['Fecha', 'DocumentoNumero', 'ImporteTotal', 'ClienteCodigo'];
    const sortField = validFields.includes(field) ? field : 'Fecha';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    // Establecer la asociación temporalmente
    ReciboCabeza.belongsTo(Cliente, {
      foreignKey: 'ClienteCodigo',
      as: 'ClienteRelacion'
    });

    // Primero hacemos la consulta sin includes para el conteo
    const count = await ReciboCabeza.count({ where: whereClause });

    // Luego hacemos la consulta con includes para los datos
    const queryOptions = {
      where: whereClause,
      include: [{
        model: Cliente,
        as: 'ClienteRelacion',
        attributes: ['Descripcion', 'NombreFantasia']
      }],
      order: [
        [sortField, sortOrder],
        ['DocumentoSucursal', sortOrder],
        ['DocumentoNumero', sortOrder]
      ]
    };

    // Solo agregar limit y offset si no estamos obteniendo todos
    if (!shouldGetAll) {
      queryOptions.limit = limitValue;
      queryOptions.offset = offset;
    }

    const recibos = await ReciboCabeza.findAll(queryOptions);
    
    console.log('🔍 Backend - Query ejecutada:', {
      shouldGetAll,
      limitValue,
      offset,
      count,
      recibosCount: recibos.length
    });

    const totalPages = shouldGetAll ? 1 : Math.ceil(count / limitValue);

    return res.status(200).json({
      items: recibos,
      meta: {
        totalItems: count,
        itemsPerPage: shouldGetAll ? count : parseInt(limit),
        currentPage: shouldGetAll ? 1 : pageValue,
        totalPages: totalPages
      }
    });
  } catch (error) {
    console.error('Error en getAllRecibos:', error);
    return res.status(500).json({ 
      message: 'Error al obtener los recibos',
      error: error.message 
    });
  }
};

// Obtener un recibo por ID
exports.getReciboById = async (req, res) => {
  try {
    console.log('Iniciando getReciboById...');
    const { Recibo, Cliente, Usuario, Vendedor, ReciboItem, ReciboValor } = req.models;
    
    console.log('Modelos disponibles:', Object.keys(req.models));
    console.log('Estado de los modelos:', {
      tieneRecibo: !!Recibo,
      tieneCliente: !!Cliente,
      tieneUsuario: !!Usuario,
      tieneVendedor: !!Vendedor,
      tieneReciboItem: !!ReciboItem,
      tieneReciboValor: !!ReciboValor
    });
    
    // Verificar que tenemos todos los modelos necesarios
    if (!ReciboItem || !ReciboValor) {
      console.error('Modelos faltantes:', { 
        tieneReciboItem: !!ReciboItem, 
        tieneReciboValor: !!ReciboValor 
      });
      throw new Error('No se pudieron inicializar todos los modelos necesarios');
    }

    const { tipo, sucursal, numero } = req.params;
    console.log("___________tipo, sucursal, numero", tipo, sucursal, numero);
    
    // Obtener encabezado sin includes primero
    const recibo = await Recibo.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }
    });

    if (!recibo) {
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }

    console.log('Recibo encontrado:', recibo.toJSON());

    try {
      // Obtener las relaciones por separado
      const clientePromise = Cliente.findByPk(recibo.ClienteCodigo);
      const usuarioPromise = recibo.CodigoUsuario ? Usuario.findByPk(recibo.CodigoUsuario) : Promise.resolve(null);
      const vendedorPromise = recibo.VendedorCodigo ? Vendedor.findByPk(recibo.VendedorCodigo) : Promise.resolve(null);
      const itemsPromise = ReciboItem.findAll({
        where: {
          DocumentoTipo: tipo,
          DocumentoSucursal: sucursal,
          DocumentoNumero: numero
        }
      });
      const valoresPromise = ReciboValor.findAll({
        where: {
          DocumentoTipo: tipo,
          DocumentoSucursal: sucursal,
          DocumentoNumero: numero
        }
      });

      const [cliente, usuario, vendedor, items, valores] = await Promise.all([
        clientePromise,
        usuarioPromise,
        vendedorPromise,
        itemsPromise,
        valoresPromise
      ]);

      console.log('Datos relacionados obtenidos:', {
        tieneCliente: !!cliente,
        tieneUsuario: !!usuario,
        tieneVendedor: !!vendedor,
        cantidadItems: items.length,
        cantidadValores: valores.length
      });

      // Combinar los datos
      const reciboCompleto = {
        ...recibo.toJSON(),
        ClienteRelacion: cliente ? {
          Descripcion: cliente.Descripcion,
          NombreFantasia: cliente.NombreFantasia,
          Cuit: cliente.Cuit
        } : null,
        UsuarioRelacion: usuario ? {
          Descripcion: usuario.Descripcion
        } : null,
        VendedorRelacion: vendedor ? {
          Descripcion: vendedor.Descripcion
        } : null,
        Items: items,
        Valores: valores
      };

      return res.status(200).json(reciboCompleto);
    } catch (innerError) {
      console.error('Error obteniendo datos relacionados:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('Error en getReciboById:', error);
    return res.status(500).json({ 
      message: 'Error al obtener el recibo',
      error: error.message 
    });
  }
};

// Crear un nuevo recibo
exports.createRecibo = async (req, res) => {
  let t = null;
  try {
    const {
      Recibo,
      ReciboItem,
      ReciboValor,
      NotaCredito,
      NotaDebito,
      FacturaCabeza,
      Cliente,
      CajaCabeza,
      CajaMovimientos,
      TipoDePago
    } = req.models;

    const sequelize = Recibo.sequelize;
    t = await sequelize.transaction();

    console.log("___________DATOS DEL RECIBO A GRABAR", req.body);

    const {
      DocumentoTipo,
      DocumentoSucursal,
      DocumentoNumero,
      Fecha,
      CodigoCliente,
      Observaciones,
      DocumentosDeuda,
      DocumentosCredito,
      FormasPago,
      ImporteTotal,
      VendedorCodigo
    } = req.body;

    if (!DocumentoTipo || !DocumentoSucursal || !DocumentoNumero || !Fecha || !CodigoCliente || !VendedorCodigo) {
      await rollbackTransactionQuietly(t);
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      await rollbackTransactionQuietly(t);
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      await rollbackTransactionQuietly(t);
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    const vendedorCodigo = decodedToken.userId;

    if (!vendedorCodigo) {
      await rollbackTransactionQuietly(t);
      return res.status(401).json({
        success: false,
        message: 'Token inválido o sin información de vendedor'
      });
    }

    const cajaAbierta = await CajaCabeza.findOne({
      where: {
        VendedorId: vendedorCodigo,
        Cierre: null
      },
      transaction: t
    });

    if (!cajaAbierta) {
      await rollbackTransactionQuietly(t);
      return res.status(400).json({
        success: false,
        message: 'El vendedor no tiene una caja abierta'
      });
    }

    if (DocumentosDeuda && DocumentosDeuda.length > 0) {
      for (const doc of DocumentosDeuda) {
        let documento;

        if (doc.DocumentoTipo === 'NDF' || doc.DocumentoTipo === 'NDA' || doc.DocumentoTipo === 'NDC' || doc.DocumentoTipo === 'NDB') {
          documento = await NotaDebito.findOne({
            where: {
              DocumentoTipo: doc.DocumentoTipo,
              DocumentoSucursal: doc.DocumentoSucursal,
              DocumentoNumero: doc.DocumentoNumero
            },
            transaction: t
          });
        } else {
          documento = await FacturaCabeza.findOne({
            where: {
              DocumentoTipo: doc.DocumentoTipo,
              DocumentoSucursal: doc.DocumentoSucursal,
              DocumentoNumero: doc.DocumentoNumero
            },
            transaction: t
          });
        }

        if (!documento) {
          await rollbackTransactionQuietly(t);
          return res.status(400).json({
            success: false,
            message: `El documento ${doc.DocumentoTipo}-${doc.DocumentoSucursal}-${doc.DocumentoNumero} no existe`
          });
        }

        const saldoPendiente = documento.ImporteTotal - (documento.ImportePagado || 0);
        if (doc.Importe > saldoPendiente) {
          await rollbackTransactionQuietly(t);
          return res.status(400).json({
            success: false,
            message: `El importe a pagar (${doc.Importe}) excede el saldo pendiente (${saldoPendiente}) del documento ${doc.DocumentoTipo}-${doc.DocumentoSucursal}-${doc.DocumentoNumero}`
          });
        }
      }
    }

    const documentosDeudaMapeados = (DocumentosDeuda || []).map((doc) => ({
      DocDeudaDocumentoTipo: doc.DocumentoTipo,
      DocDeudaDocumentoSucursal: doc.DocumentoSucursal,
      DocDeudaDocumentoNumero: doc.DocumentoNumero,
      DocDeudaImporte: doc.Importe
    }));

    const documentosCreditoMapeados = (DocumentosCredito || [])
      .filter((doc) => doc && doc.Documento && typeof doc.Documento === 'string')
      .map((doc) => {
        const parts = doc.Documento.split('-');
        return {
          DocCreditoDocumentoTipo: parts[0],
          DocCreditoDocumentoSucursal: parts[1],
          DocCreditoDocumentoNumero: parts[2],
          DocCreditoImporte: doc.Importe
        };
      });

    const formasPagoList = Array.isArray(FormasPago) ? FormasPago : [];

    const codigosMetodoPagoValidos = new Set(
      (await TipoDePago.findAll({ attributes: ['Codigo'], transaction: t }))
        .map((r) => r.Codigo)
        .filter(Boolean)
    );
    const metodoPagoParaMovimientoCaja = (codigo) =>
      codigo && codigosMetodoPagoValidos.has(codigo) ? codigo : 'OT';

    try {
      const [numRows] = await sequelize.query(
        `SELECT NumeroProximo FROM t_numeroscontrol WHERE Codigo = ? AND Sucursal = ? FOR UPDATE`,
        {
          replacements: [DocumentoTipo, DocumentoSucursal],
          type: QueryTypes.SELECT,
          transaction: t
        }
      );

      if (!numRows || numRows.NumeroProximo === undefined || numRows.NumeroProximo === null) {
        throw new Error('Número de control no encontrado');
      }

      const esperadoNum = String(numRows.NumeroProximo).padStart(8, '0');
      const enviadoNum = String(DocumentoNumero).padStart(8, '0');
      if (esperadoNum !== enviadoNum) {
        await rollbackTransactionQuietly(t);
        t = null;
        return res.status(409).json({
          success: false,
          message:
            'El número de recibo ya no es válido (numeración desactualizada). Obtenga un número nuevo e intente de nuevo.'
        });
      }

      console.log("Paso 1: Creando recibo y formas de pago...");
      const recibo = await grabarReciboYFormasPago(
        DocumentoTipo,
        DocumentoSucursal,
        DocumentoNumero,
        Fecha,
        CodigoCliente,
        Observaciones,
        formasPagoList,
        ImporteTotal,
        VendedorCodigo,
        t,
        { Recibo, ReciboValor }
      );
      console.log("Recibo creado:", recibo.toJSON());

      console.log("Paso 2: Actualizando documentos de deuda...");
      await actualizarDocumentosDeuda(
        documentosDeudaMapeados,
        { DocumentoTipo, DocumentoSucursal, DocumentoNumero },
        t,
        { FacturaCabeza, NotaDebito, ReciboItem }
      );
      console.log("Documentos de deuda actualizados correctamente");

      console.log("Paso 3: Actualizando documentos de crédito...");
      await actualizarDocumentosCredito(
        documentosCreditoMapeados,
        { DocumentoTipo, DocumentoSucursal, DocumentoNumero },
        t,
        { NotaCredito, ReciboValor }
      );
      console.log("Documentos de crédito actualizados correctamente");

      console.log("Paso 4: Registrando movimientos en caja...");
      for (const formaPago of formasPagoList) {
        await CajaMovimientos.create(
          {
            CajaCabezaId: cajaAbierta.Codigo,
            Tipo: 'ingreso',
            Importe: formaPago.Importe,
            Concepto: `Recibo ${DocumentoTipo}-${DocumentoSucursal}-${DocumentoNumero}`,
            MetodoPago: metodoPagoParaMovimientoCaja(formaPago.Codigo),
            Referencia: formaPago.Numero || null,
            Banco: formaPago.Banco || null,
            ValorFecha: formaPago.Fecha || new Date(),
            DocumentoAsociado: `${DocumentoTipo}-${DocumentoSucursal}-${DocumentoNumero}`,
            TipoDocumento: 'REC',
            FechaHora: new Date(),
            UsuarioId: VendedorCodigo
          },
          { transaction: t }
        );
      }

      const totalFormasPago = formasPagoList.reduce((total, formaPago) => total + formaPago.Importe, 0);
      await cajaAbierta.update(
        {
          SaldoTeorico: parseFloat(cajaAbierta.SaldoTeorico || 0) + totalFormasPago
        },
        { transaction: t }
      );
      console.log("Movimientos de caja registrados correctamente");

      console.log("Paso 6: Actualizando número de control...");
      try {
        await NumerosControlController.actualizarNumeroDirecto(
          DocumentoTipo,
          DocumentoSucursal,
          ImporteTotal,
          t,
          req.models
        );
        console.log("Número de control actualizado correctamente");
      } catch (errorNumero) {
        console.error("Error al actualizar número de control:", errorNumero);
        await rollbackTransactionQuietly(t);
        t = null;
        return res.status(500).json({
          success: false,
          message: "Error al actualizar el número de control",
          error: errorNumero.message,
          stack: errorNumero.stack
        });
      }

      console.log("Paso 7: Actualizando deuda del cliente...");
      try {
        const cliente = await Cliente.findByPk(CodigoCliente, { transaction: t });

        if (!cliente) {
          throw new Error(`Cliente no encontrado: ${CodigoCliente}`);
        }

        await cliente.update(
          {
            ImporteDeuda: (cliente.ImporteDeuda || 0) - totalFormasPago
          },
          { transaction: t }
        );
        console.log("Deuda del cliente actualizada correctamente");
      } catch (errorCliente) {
        console.error("Error al actualizar deuda del cliente:", errorCliente);
        await rollbackTransactionQuietly(t);
        t = null;
        return res.status(500).json({
          success: false,
          message: "Error al actualizar la deuda del cliente",
          error: errorCliente.message,
          stack: errorCliente.stack
        });
      }

      console.log("Confirmando transacción...");
      await t.commit();
      t = null;
      console.log("Transacción confirmada exitosamente");

      return res.status(201).json({
        success: true,
        message: 'Recibo creado correctamente',
        data: recibo
      });
    } catch (error) {
      console.error("Error en el proceso de creación:", error);
      console.error("Stack trace:", error.stack);
      await rollbackTransactionQuietly(t);
      t = null;
      return res.status(500).json({
        success: false,
        message: 'Error al crear el recibo',
        error: error.message,
        stack: error.stack,
        details: error.toString()
      });
    }
  } catch (error) {
    await rollbackTransactionQuietly(t);
    console.error('Error al crear recibo:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Error al crear el recibo',
      error: error.message,
      stack: error.stack,
      details: error.toString()
    });
  }
};

// Función para actualizar documentos de deuda
async function actualizarDocumentosDeuda(documentosDeuda, {DocumentoTipo, DocumentoSucursal, DocumentoNumero}, transaction, models) {
  const { FacturaCabeza, NotaDebito, ReciboItem } = models;
  
  if (!documentosDeuda || documentosDeuda.length === 0) {
    return;
  }
  console.log("***********Recibo numero***********", DocumentoTipo, DocumentoSucursal, DocumentoNumero);
  console.log("Documentos de deuda a procesar:", documentosDeuda);

  for (const doc of documentosDeuda) {
    const { DocDeudaDocumentoTipo, DocDeudaDocumentoSucursal, DocDeudaDocumentoNumero, DocDeudaImporte } = doc;
    console.log("Procesando documento:", {
      tipo: DocDeudaDocumentoTipo,
      sucursal: DocDeudaDocumentoSucursal,
      numero: DocDeudaDocumentoNumero,
      importe: DocDeudaImporte
    });

    // Obtener el documento de deuda según su tipo
    let documentoDeuda;
    
    if (DocDeudaDocumentoTipo === 'PRF' || DocDeudaDocumentoTipo === 'FCA'|| DocDeudaDocumentoTipo === 'FCB' || DocDeudaDocumentoTipo === 'FCC') {
      // Es una factura
      documentoDeuda = await FacturaCabeza.findOne({
        where: {
          DocumentoTipo: DocDeudaDocumentoTipo,
          DocumentoSucursal: DocDeudaDocumentoSucursal,
          DocumentoNumero: DocDeudaDocumentoNumero
        },
        transaction
      });
      
      if (!documentoDeuda) {
        console.error("Factura no encontrada:", {
          tipo: DocDeudaDocumentoTipo,
          sucursal: DocDeudaDocumentoSucursal,
          numero: DocDeudaDocumentoNumero
        });
        throw new Error(`Factura no encontrada: ${DocDeudaDocumentoTipo}-${DocDeudaDocumentoSucursal}-${DocDeudaDocumentoNumero}`);
      }
      
      // Verificar que el importe no exceda el saldo pendiente
      const saldoPendiente = documentoDeuda.ImporteTotal - (documentoDeuda.ImportePagado || 0);
      console.log("Saldo pendiente de la factura:", saldoPendiente);
      
      if (DocDeudaImporte > saldoPendiente) {
        throw new Error(`El importe a pagar (${DocDeudaImporte}) excede el saldo pendiente (${saldoPendiente}) de la factura ${DocDeudaDocumentoTipo}-${DocDeudaDocumentoSucursal}-${DocDeudaDocumentoNumero}`);
      }
      
      // Actualizar el importe pagado
      await documentoDeuda.update(
        { 
          ImportePagado: (documentoDeuda.ImportePagado || 0) + DocDeudaImporte 
        },
        { transaction }
      );
      console.log("Factura actualizada correctamente");
    } else if (DocDeudaDocumentoTipo === 'NDF' || DocDeudaDocumentoTipo === 'NDA' || DocDeudaDocumentoTipo === 'NDC' || DocDeudaDocumentoTipo === 'NDB') {
      // Es una nota de débito
      documentoDeuda = await NotaDebito.findOne({
        where: {
          DocumentoTipo: DocDeudaDocumentoTipo,
          DocumentoSucursal: DocDeudaDocumentoSucursal,
          DocumentoNumero: DocDeudaDocumentoNumero
        },
        transaction
      });
      
      if (!documentoDeuda) {
        console.error("Nota de débito no encontrada:", {
          tipo: DocDeudaDocumentoTipo,
          sucursal: DocDeudaDocumentoSucursal,
          numero: DocDeudaDocumentoNumero
        });
        throw new Error(`Nota de débito no encontrada: ${DocDeudaDocumentoTipo}-${DocDeudaDocumentoSucursal}-${DocDeudaDocumentoNumero}`);
      }
      
      // Verificar que el importe no exceda el saldo pendiente
      const saldoPendiente = documentoDeuda.ImporteTotal - (documentoDeuda.ImportePagado || 0);
      console.log("Saldo pendiente de la nota de débito:", saldoPendiente);
      
      if (DocDeudaImporte > saldoPendiente) {
        throw new Error(`El importe a pagar (${DocDeudaImporte}) excede el saldo pendiente (${saldoPendiente}) de la nota de débito ${DocDeudaDocumentoTipo}-${DocDeudaDocumentoSucursal}-${DocDeudaDocumentoNumero}`);
      }
      
      // Actualizar el importe pagado
      await documentoDeuda.update(
        { 
          ImportePagado: (documentoDeuda.ImportePagado || 0) + DocDeudaImporte 
        },
        { transaction }
      );
      console.log("Nota de débito actualizada correctamente");
    } else {
      throw new Error(`Tipo de documento no soportado: ${DocDeudaDocumentoTipo}`);
    }
    
    // Grabar en la tabla recibositems
    try {
      console.log("Verificando si existe registro en recibositems");
      
      // Verificar si el registro ya existe
      const existingItem = await ReciboItem.findOne({
        where: {
          DocumentoTipo: DocumentoTipo,
          DocumentoSucursal: DocumentoSucursal,
          DocumentoNumero: DocumentoNumero,
          FacturaTipo: DocDeudaDocumentoTipo,
          FacturaSucursal: DocDeudaDocumentoSucursal,
          FacturaNumero: DocDeudaDocumentoNumero
        },
        transaction
      });
      
      if (existingItem) {
        console.log("Registro ya existe, actualizando importe pagado");
        // Si existe, actualizar el importe pagado
        await existingItem.update({
          ImportePagado: existingItem.ImportePagado + DocDeudaImporte
        }, { transaction });
      } else {
        console.log("Insertando nuevo registro en recibositems");
        // Si no existe, crear uno nuevo
        await ReciboItem.create({
          DocumentoTipo: DocumentoTipo,
          DocumentoSucursal: DocumentoSucursal,
          DocumentoNumero: DocumentoNumero,
          FacturaTipo: DocDeudaDocumentoTipo,
          FacturaSucursal: DocDeudaDocumentoSucursal,
          FacturaNumero: DocDeudaDocumentoNumero,
          ImportePagado: DocDeudaImporte
        }, { transaction });
      }
      console.log("Registro en recibositems actualizado correctamente");
    } catch (error) {
      console.error("Error al insertar/actualizar en recibositems:", error);
      throw error;
    }
  }
}

// Función para actualizar documentos de crédito
async function actualizarDocumentosCredito(documentosCredito, {DocumentoTipo, DocumentoSucursal, DocumentoNumero}, transaction, models) {
  const { NotaCredito, ReciboValor } = models;
  
  if (!documentosCredito || documentosCredito.length === 0) {
    return;
  }

  for (const doc of documentosCredito) {
    const { DocCreditoDocumentoTipo, DocCreditoDocumentoSucursal, DocCreditoDocumentoNumero, DocCreditoImporte } = doc;
    console.log("_________________doc", doc);
    // Obtener el documento de crédito
    const documentoCredito = await NotaCredito.findOne({
      where: {
        DocumentoTipo: DocCreditoDocumentoTipo,
        DocumentoSucursal: DocCreditoDocumentoSucursal,
        DocumentoNumero: DocCreditoDocumentoNumero
      },
      transaction
    });
    console.log("______________documentoCredito", documentoCredito);
    
    if (!documentoCredito) {
      throw new Error(`Nota de crédito no encontrada: ${DocCreditoDocumentoTipo}-${DocCreditoDocumentoSucursal}-${DocCreditoDocumentoNumero}`);
    }
    
    // Verificar que el importe no exceda el saldo disponible
    const saldoDisponible = documentoCredito.ImporteTotal - (documentoCredito.ImporteUtilizado || 0);
    if (DocCreditoImporte > saldoDisponible) {
      throw new Error(`El importe a usar (${DocCreditoImporte}) excede el saldo disponible (${saldoDisponible}) de la nota de crédito ${DocCreditoDocumentoTipo}-${DocCreditoDocumentoSucursal}-${DocCreditoDocumentoNumero}`);
    }
    
    // Actualizar el importe utilizado
    await documentoCredito.update(
      { 
        ImporteUtilizado: (documentoCredito.ImporteUtilizado || 0) + DocCreditoImporte 
      },
      { transaction }
    );
    
    // Grabar en la tabla recibosvalores
    try {
      console.log("Verificando si existe registro en recibosvalores", documentoCredito.toJSON());
      
      // Verificar si el registro ya existe
      const existingValor = await ReciboValor.findOne({
        where: {
          DocumentoTipo: DocumentoTipo,
          DocumentoSucursal: DocumentoSucursal,
          DocumentoNumero: DocumentoNumero,
          ValorCodigo: DocCreditoDocumentoTipo,
          ValorSucursal: DocCreditoDocumentoSucursal,
          ValorNumero: DocCreditoDocumentoNumero
        },
        transaction
      });
      
      if (existingValor) {
        console.log("Registro ya existe, actualizando importe");
        // Si existe, actualizar el importe
        await existingValor.update({
          ValorImporte: existingValor.ValorImporte + DocCreditoImporte
        }, { transaction });
      } else {
        console.log("Insertando nuevo registro en recibosvalores");
        // Si no existe, crear uno nuevo
        await ReciboValor.create({
          DocumentoTipo: DocumentoTipo,
          DocumentoSucursal: DocumentoSucursal,
          DocumentoNumero: DocumentoNumero,
          ValorCodigo: DocCreditoDocumentoTipo,
          ValorSucursal: DocCreditoDocumentoSucursal,
          ValorNumero: DocCreditoDocumentoNumero,
          ValorFecha: new Date(),
          ValorImporte: DocCreditoImporte
        }, { transaction });
      }
    } catch (error) {
      console.error("Error al insertar/actualizar en recibosvalores:", error);
      throw error;
    }
  }
}

// Función para grabar el recibo y las formas de pago
async function grabarReciboYFormasPago(
  DocumentoTipo,
  DocumentoSucursal,
  DocumentoNumero,
  Fecha,
  CodigoCliente,
  Observaciones,
  FormasPago,
  ImporteTotal,
  VendedorCodigo,
  transaction,
  models
) {
  const { Recibo, ReciboValor } = models;

  // Crear el recibo
  const recibo = await Recibo.create({
    DocumentoTipo,
    DocumentoSucursal,
    DocumentoNumero,
    Fecha,
    ClienteCodigo: CodigoCliente,
    Observaciones,
    ImporteTotal,
    VendedorCodigo,
    FechaAnulacion: null
  }, { transaction });

  console.log("_____________________formas de pago", FormasPago);
  // Grabar las formas de pago
  if (FormasPago && FormasPago.length > 0) {
    for (const formaPago of FormasPago) {
      const { Codigo, Descripcion, Banco, Numero, Fecha, Importe, chequeCodigo } = formaPago;
      console.log("formaPago", formaPago);
      await ReciboValor.create({
        DocumentoTipo,
        DocumentoSucursal,
        DocumentoNumero,
        ValorCodigo: Codigo,
        ValorDescripcion: Descripcion,
        ValorBanco: Banco,
        ValorNumero: Numero,
        ValorFecha: new Date(),
        ValorImporte: Importe,
        ChequeCodigo: chequeCodigo || null,
      }, { transaction });
    }
  }

  return recibo;
}

// Actualizar un recibo
exports.updateRecibo = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { tipo, sucursal, numero } = req.params;
    const { cabeza, items } = req.body;
    
    const recibo = await Recibo.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }
    });
    
    if (!recibo) {
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }
    
    if (recibo.FechaAnulacion) {
      return res.status(400).json({ message: 'No se puede modificar un recibo anulado' });
    }
    
    await recibo.update(cabeza, { transaction });
    
    if (items && items.length > 0) {
      await ReciboItem.destroy({
        where: {
          DocumentoTipo: tipo,
          DocumentoSucursal: sucursal,
          DocumentoNumero: numero
        },
        transaction
      });
      
      const itemsToCreate = items.map(item => ({
        ...item,
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }));
      
      await ReciboItem.bulkCreate(itemsToCreate, { transaction });
    }
    
    await transaction.commit();
    
    return res.status(200).json({
      message: 'Recibo actualizado correctamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar el recibo' });
  }
};

// Anular un recibo
exports.anularRecibo = async (req, res) => {
  try {
    console.log('Iniciando anulación de recibo');
    console.log('Headers:', req.headers);
    
    const { 
      Recibo, 
      ReciboValor, 
      ReciboItem, 
      Cliente, 
      FacturaCabeza, 
      NotaDebito, 
      NotaCredito,
      CajaCabeza,
      CajaMovimientos,
      TipoDePago
    } = req.models;

    // Obtener la instancia de sequelize desde cualquier modelo
    const sequelize = Recibo.sequelize;
  const transaction = await sequelize.transaction();
  
  try {
    const { tipo, sucursal, numero } = req.params;
      console.log('Parámetros:', { tipo, sucursal, numero });
      
      // Obtener el vendedor del token de autenticación
      const authHeader = req.headers.authorization;
      console.log('Header de autorización:', authHeader);
      
      if (!authHeader) {
        console.log('No se proporcionó token de autenticación');
        await transaction.rollback();
        return res.status(401).json({
          success: false,
          message: 'No se proporcionó token de autenticación'
        });
      }

      const token = authHeader.split(' ')[1];
      console.log('Token extraído:', token);
      
      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decodedToken);
        
        const vendedorCodigo = decodedToken.userId;
        console.log('Código de vendedor:', vendedorCodigo);

        if (!vendedorCodigo) {
          console.log('Token inválido o sin información de vendedor');
          await transaction.rollback();
          return res.status(401).json({
            success: false,
            message: 'Token inválido o sin información de vendedor'
          });
        }
    
    const recibo = await Recibo.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
          },
          transaction
    });
    
    if (!recibo) {
          console.log('Recibo no encontrado');
          await transaction.rollback();
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }
    
    if (recibo.FechaAnulacion) {
          console.log('El recibo ya está anulado');
          await transaction.rollback();
      return res.status(400).json({ message: 'El recibo ya está anulado' });
    }
    
    // Obtener los valores (formas de pago) del recibo
    const valores = await ReciboValor.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      },
      transaction
    });
    
        console.log('Valores encontrados:', valores);

        // Revertir el uso de notas de crédito
        for (const valor of valores) {
          if (['NCF', 'NCA', 'NCB', 'NCC'].includes(valor.ValorCodigo)) {
            console.log('Procesando nota de crédito:', valor.toJSON());
            
            const notaCredito = await NotaCredito.findOne({
              where: {
                DocumentoTipo: valor.ValorCodigo,
                DocumentoSucursal: valor.ValorSucursal,
                DocumentoNumero: valor.ValorNumero
              },
              transaction
            });

            if (notaCredito) {
              console.log('Actualizando nota de crédito:', {
                tipo: notaCredito.DocumentoTipo,
                sucursal: notaCredito.DocumentoSucursal,
                numero: notaCredito.DocumentoNumero,
                importeUtilizadoActual: notaCredito.ImporteUtilizado,
                importeARevertir: valor.ValorImporte,
                nuevoImporteUtilizado: parseFloat(notaCredito.ImporteUtilizado || 0) - parseFloat(valor.ValorImporte)
              });

              await notaCredito.update({
                ImporteUtilizado: parseFloat(notaCredito.ImporteUtilizado || 0) - parseFloat(valor.ValorImporte)
              }, { transaction });
            }
          }
        }

        // Obtener los items del recibo (facturas asociadas)
        const items = await ReciboItem.findAll({
          where: {
            DocumentoTipo: tipo,
            DocumentoSucursal: sucursal,
            DocumentoNumero: numero
          },
          transaction
        });

        console.log('Items encontrados:', items);

        // Revertir los pagos de las facturas
        for (const item of items) {
          console.log('Procesando item:', item.toJSON());
          
          if (['PRF', 'FCA', 'FCB', 'FCC'].includes(item.FacturaTipo)) {
            // Es una factura
            const factura = await FacturaCabeza.findOne({
              where: {
                DocumentoTipo: item.FacturaTipo,
                DocumentoSucursal: item.FacturaSucursal,
                DocumentoNumero: item.FacturaNumero
              },
              transaction
            });

            if (factura) {
              console.log('Actualizando factura:', {
                tipo: factura.DocumentoTipo,
                sucursal: factura.DocumentoSucursal,
                numero: factura.DocumentoNumero,
                importePagadoActual: factura.ImportePagado,
                importeARevertir: item.ImportePagado,
                nuevoImportePagado: parseFloat(factura.ImportePagado || 0) - parseFloat(item.ImportePagado)
              });

              await factura.update({
                ImportePagado: parseFloat(factura.ImportePagado || 0) - parseFloat(item.ImportePagado)
              }, { transaction });
            }
          } else if (['NDF', 'NDA', 'NDC', 'NDB'].includes(item.FacturaTipo)) {
            // Es una nota de débito
            const notaDebito = await NotaDebito.findOne({
              where: {
                DocumentoTipo: item.FacturaTipo,
                DocumentoSucursal: item.FacturaSucursal,
                DocumentoNumero: item.FacturaNumero
              },
              transaction
            });

            if (notaDebito) {
              console.log('Actualizando nota de débito:', {
                tipo: notaDebito.DocumentoTipo,
                sucursal: notaDebito.DocumentoSucursal,
                numero: notaDebito.DocumentoNumero,
                importePagadoActual: notaDebito.ImportePagado,
                importeARevertir: item.ImportePagado,
                nuevoImportePagado: parseFloat(notaDebito.ImportePagado || 0) - parseFloat(item.ImportePagado)
              });

              await notaDebito.update({
                ImportePagado: parseFloat(notaDebito.ImportePagado || 0) - parseFloat(item.ImportePagado)
              }, { transaction });
            }
          }
        }

        // Verificar si hay una caja abierta para el vendedor
        const cajaAbierta = await CajaCabeza.findOne({
      where: {
            VendedorId: vendedorCodigo,
            Cierre: null
      },
      transaction
    });
    
        if (!cajaAbierta) {
          console.log('No hay caja abierta para el vendedor');
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'No hay una caja abierta para el vendedor'
          });
        }

        const codigosMetodoPagoValidos = new Set(
          (await TipoDePago.findAll({ attributes: ['Codigo'], transaction })).map((r) => r.Codigo).filter(Boolean)
        );
        const metodoPagoParaMovimientoCaja = (codigo) =>
          codigo && codigosMetodoPagoValidos.has(codigo) ? codigo : 'OT';

        // 3. Generar movimientos de caja para cancelar los ingresos
        for (const valor of valores) {
          // Solo generar movimiento para formas de pago que no aplican saldo
          if (!['SAL', 'SALDO'].includes(valor.ValorCodigo)) {
            const movimiento = {
              CajaCabezaId: cajaAbierta.Codigo,
              Tipo: 'egreso',
              Importe: valor.ValorImporte,
              Concepto: `Anulación de recibo ${recibo.DocumentoSucursal}-${recibo.DocumentoNumero} - ${valor.ValorDescripcion || 'Sin descripción'}`,
              MetodoPago: metodoPagoParaMovimientoCaja(valor.ValorCodigo),
              Referencia: valor.ValorNumero || null,
              Banco: valor.ValorBanco || null,
              ValorFecha: valor.ValorFecha || new Date().toISOString().split('T')[0],
              DocumentoAsociado: recibo.DocumentoNumero,
              TipoDocumento: recibo.DocumentoTipo,
              UsuarioId: vendedorCodigo
            };

            console.log('Creando movimiento de caja:', movimiento);
            await CajaMovimientos.create(movimiento, { transaction });
          }
        }
        
        // Actualizar el saldo teórico de la caja
        const totalEgreso = valores.reduce((total, valor) => {
          if (!['SAL', 'SALDO'].includes(valor.ValorCodigo)) {
            return total + parseFloat(valor.ValorImporte);
          }
          return total;
        }, 0);

        console.log('Actualizando saldo de caja:', {
          cajaId: cajaAbierta.Codigo,
          saldoActual: cajaAbierta.SaldoTeorico,
          egreso: totalEgreso,
          nuevoSaldo: parseFloat(cajaAbierta.SaldoTeorico || 0) - totalEgreso
        });

        await cajaAbierta.update({
          SaldoTeorico: parseFloat(cajaAbierta.SaldoTeorico || 0) - totalEgreso
        }, { transaction });

        // 4. Actualizar la deuda del cliente
        console.log("Paso 4: Actualizando deuda del cliente...");
        try {
          // Obtener el cliente
          const cliente = await Cliente.findByPk(recibo.ClienteCodigo, { transaction });
          
          if (!cliente) {
            throw new Error(`Cliente no encontrado: ${recibo.ClienteCodigo}`);
          }
          
          // Calcular el total de formas de pago que afectan la deuda
          const totalFormasPago = valores.reduce((total, valor) => {
            if (!['SAL', 'SALDO'].includes(valor.ValorCodigo)) {
              return total + parseFloat(valor.ValorImporte);
            }
            return total;
          }, 0);
          
          // Recargar la deuda del cliente
          await cliente.update(
            { 
              ImporteDeuda: (cliente.ImporteDeuda || 0) + totalFormasPago 
            },
            { transaction }
          );
          console.log("Deuda del cliente actualizada correctamente");
        } catch (errorCliente) {
          console.error("Error al actualizar deuda del cliente:", errorCliente);
          await transaction.rollback();
          return res.status(500).json({
            success: false,
            message: "Error al actualizar la deuda del cliente",
            error: errorCliente.message,
            stack: errorCliente.stack
          });
        }

        // 5. Marcar el recibo como anulado
        await recibo.update({
          FechaAnulacion: new Date()
        }, { transaction });
    
    await transaction.commit();
        console.log('Recibo anulado exitosamente');
    
    return res.status(200).json({
      message: 'Recibo anulado correctamente'
    });
      } catch (jwtError) {
        console.error('Error verificando token:', jwtError);
        await transaction.rollback();
        return res.status(401).json({
          success: false,
          message: 'Token inválido o expirado'
        });
      }
  } catch (error) {
      console.error('Error en la transacción:', error);
    await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error al anular recibo:', error);
    return res.status(500).json({ 
      message: 'Error al anular el recibo',
      error: error.message 
    });
  }
};

// Obtener documentos de deuda (facturas impagas) de un cliente
exports.getDocumentosDeuda = async (req, res) => {
  try {
    const { codigocliente } = req.params;
    const { Cliente } = req.models;
    
    if (!codigocliente) {
      return res.status(400).json({ message: 'Se requiere el código del cliente' });
    }

    // Obtener la instancia de sequelize desde el modelo Cliente
    const sequelize = Cliente.sequelize;
    
    // Consulta SQL para obtener las facturas impagas del cliente (excluyendo anuladas)
    const query = `
      SELECT 
        f.DocumentoTipo,
        f.DocumentoSucursal,
        f.DocumentoNumero,
        f.Fecha,
        f.ImporteTotal,
        f.ImportePagado
      FROM 
        facturacabeza f
      WHERE 
        f.ClienteCodigo = :codigocliente
        AND f.ImporteTotal - COALESCE(f.ImportePagado, 0) > 0
        AND f.FechaAnulacion IS NULL
      ORDER BY 
        f.Fecha ASC
    `;
    
    //consulta para obtener las notas de debito impagas (excluyendo anuladas)
    const queryNotasDebito = `
      SELECT 
        n.DocumentoTipo,
        n.DocumentoSucursal,
        n.DocumentoNumero,
        n.Fecha,
        n.ImporteTotal,
        n.ImportePagado
      FROM 
        notadebitocabeza n
      WHERE 
        n.ClienteCodigo = :codigocliente
        AND n.ImporteTotal - COALESCE(n.ImportePagado, 0) > 0 
        AND n.FechaAnulacion IS NULL
      ORDER BY 
        n.Fecha ASC
    `;

    // obtener las facturas impagas usando la conexión de la empresa
    const facturas = await sequelize.query(query, {
      replacements: { codigocliente },
      type: sequelize.QueryTypes.SELECT
    });

    // obtener las notas de debito impagas usando la conexión de la empresa
    const notasDebito = await sequelize.query(queryNotasDebito, {
      replacements: { codigocliente },
      type: sequelize.QueryTypes.SELECT
    });

    // combinar las facturas y notas de debito
    const documentosDeuda = [...facturas, ...notasDebito];
    //ordenalas por fecha ascendente
    documentosDeuda.sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
    
    return res.status(200).json({
      success: true,
      data: documentosDeuda
    });
  } catch (error) {
    console.error('Error al obtener documentos de deuda:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener los documentos de deuda del cliente' 
    });
  }
};

// Obtener documentos de crédito (notas de crédito) de un cliente
exports.getDocumentosCredito = async (req, res) => {
  try {
    const { codigocliente } = req.params;
    const { Cliente } = req.models;
    
    if (!codigocliente) {
      return res.status(400).json({ 
        success: false, 
        message: 'El código de cliente es requerido' 
      });
    }

    // Obtener la instancia de sequelize desde el modelo Cliente
    const sequelize = Cliente.sequelize;
    
    // Consulta para obtener notas de crédito con saldo disponible (excluyendo anuladas)
    const query = `
      SELECT 
        nc.DocumentoTipo as documento,
        nc.DocumentoSucursal as sucursal,
        nc.DocumentoNumero as numero,
        nc.Fecha as fecha,
        nc.ImporteTotal as total,
        COALESCE(nc.ImporteUtilizado, 0) as importeUtilizado,
        (nc.ImporteTotal - COALESCE(nc.ImporteUtilizado, 0)) as saldo
      FROM 
        notacreditocabeza nc
      WHERE 
        nc.codigocliente = :codigocliente
        AND nc.ImporteTotal > COALESCE(nc.ImporteUtilizado, 0)
        AND nc.FechaAnulacion IS NULL
      ORDER BY 
        nc.Fecha DESC
    `;
    
    // Usar la conexión de la empresa para ejecutar la consulta
    const documentosCredito = await sequelize.query(query, {
      replacements: { codigocliente },
      type: sequelize.QueryTypes.SELECT
    });
    
    // Formatear los resultados
    const resultados = documentosCredito.map(doc => ({
      documento: `${doc.documento}-${doc.sucursal}-${doc.numero}`,
      fecha: doc.fecha,
      total: doc.total,
      importeUtilizado: doc.importeUtilizado,
      saldo: doc.saldo
    }));
    
    return res.status(200).json({
      success: true,
      data: resultados
    });
  } catch (error) {
    console.error('Error al obtener documentos de crédito:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener documentos de crédito',
      error: error.message 
    });
  }
};

exports.listarRecibos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;
    
    // Construir condiciones de filtrado
    const whereClause = {};
    
    if (fechaDesde && fechaHasta) {
      whereClause.Fecha = {
        [Op.between]: [fechaDesde, fechaHasta],
      };
    }
    
    const recibos = await Recibo.findAndCountAll({
      where: whereClause,
      limit,
      offset,
    });
    
    res.json({
      items: recibos.rows,
      meta: {
        totalItems: recibos.count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(recibos.count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener recibos",
      error: error.message,
    });
  }
}; 