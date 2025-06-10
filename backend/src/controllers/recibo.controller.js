const NumerosControlController = require('../controllers/numerosControl.controller');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Obtener todos los recibos (con filtros y paginación)
exports.getAllRecibos = async (req, res) => {
  try {
    const { ReciboCabeza, Cliente } = req.models;
    const {
      page = 1,
      limit = 10,
      search = '',
      field = 'Fecha',
      order = 'DESC',
      clienteCodigo = '',
      fechaDesde = '',
      fechaHasta = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};
    
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
    const recibos = await ReciboCabeza.findAll({
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
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      items: recibos,
      meta: {
        totalItems: count,
        itemsPerPage: parseInt(limit),
        currentPage: parseInt(page),
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
  try {
    const { Recibo, ReciboItem, ReciboValor, NotaCreditoCabeza, NotaDebitoCabeza, FacturaCabeza, Cliente, CajaCabeza, CajaMovimientos } = req.models;
    
    // Obtener la instancia de sequelize desde cualquier modelo
    const sequelize = Recibo.sequelize;
    const t = await sequelize.transaction();
    
    console.log("___________req.body", req.body);
    
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

    // Validar datos requeridos
    if (!DocumentoTipo || !DocumentoSucursal || !DocumentoNumero || !Fecha || !CodigoCliente || !VendedorCodigo) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    // Verificar que el vendedor tenga una caja abierta
    const cajaAbierta = await CajaCabeza.findOne({
      where: {
        VendedorId: VendedorCodigo,
        Estado: 'abierta'
      },
      transaction: t
    });

    if (!cajaAbierta) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'El vendedor no tiene una caja abierta'
      });
    }

    // Mapear los documentos de deuda para evitar conflictos de nombres
    const documentosDeudaMapeados = DocumentosDeuda.map(doc => ({
      DocDeudaDocumentoTipo: doc.DocumentoTipo,
      DocDeudaDocumentoSucursal: doc.DocumentoSucursal,
      DocDeudaDocumentoNumero: doc.DocumentoNumero,
      DocDeudaImporte: doc.Importe
    }));

    // Mapear los documentos de crédito para evitar conflictos de nombres
    const documentosCreditoMapeados = DocumentosCredito.map(doc => ({
      DocCreditoDocumentoTipo: doc.Documento.split('-')[0],
      DocCreditoDocumentoSucursal: doc.Documento.split('-')[1], 
      DocCreditoDocumentoNumero: doc.Documento.split('-')[2],
      DocCreditoImporte: doc.Importe
    }));

    try {
      // 1. Crear primero el recibo
      console.log("Paso 1: Creando recibo y formas de pago...");
      const recibo = await grabarReciboYFormasPago(
        DocumentoTipo,
        DocumentoSucursal,
        DocumentoNumero,
        Fecha,
        CodigoCliente,
        Observaciones,
        FormasPago,
        ImporteTotal,
        t,
        { Recibo, ReciboValor }
      );
      console.log("Recibo creado:", recibo.toJSON());

      // 2. Actualizar documentos de deuda (facturas o notas de débito)
      console.log("Paso 2: Actualizando documentos de deuda...");
      await actualizarDocumentosDeuda(
        documentosDeudaMapeados, 
        {DocumentoTipo, DocumentoSucursal, DocumentoNumero}, 
        t,
        { FacturaCabeza, NotaDebitoCabeza, ReciboItem }
      );
      console.log("Documentos de deuda actualizados correctamente");

      // 3. Actualizar documentos de crédito
      console.log("Paso 3: Actualizando documentos de crédito...");
      await actualizarDocumentosCredito(documentosCreditoMapeados, {DocumentoTipo, DocumentoSucursal, DocumentoNumero}, t);
      console.log("Documentos de crédito actualizados correctamente");

      // 4. Registrar movimientos en caja
      console.log("Paso 4: Registrando movimientos en caja...");
      for (const formaPago of FormasPago) {
        await CajaMovimientos.create({
          CajaCabezaId: cajaAbierta.Codigo,
          Tipo: 'ingreso',
          Importe: formaPago.Importe,
          Concepto: `Recibo ${DocumentoTipo}-${DocumentoSucursal}-${DocumentoNumero}`,
          MetodoPago: formaPago.Codigo,
          Referencia: formaPago.Numero || null,
          Banco: formaPago.Banco || null,
          ValorFecha: formaPago.Fecha || new Date(),
          DocumentoAsociado: `${DocumentoTipo}-${DocumentoSucursal}-${DocumentoNumero}`,
          TipoDocumento: 'REC',
          FechaHora: new Date(),
          UsuarioId: VendedorCodigo
        }, { transaction: t });
      }

      // 5. Actualizar saldo teórico de la caja
      const totalFormasPago = FormasPago.reduce((total, formaPago) => total + formaPago.Importe, 0);
      await cajaAbierta.update({
        SaldoTeorico: parseFloat(cajaAbierta.SaldoTeorico || 0) + totalFormasPago
      }, { transaction: t });
      console.log("Movimientos de caja registrados correctamente");

      // 6. Actualizar número de control
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
        await t.rollback();
        return res.status(500).json({
          success: false,
          message: "Error al actualizar el número de control",
          error: errorNumero.message,
          stack: errorNumero.stack
        });
      }

      // 7. Actualizar la deuda del cliente
      console.log("Paso 7: Actualizando deuda del cliente...");
      try {
        // Obtener el cliente
        const cliente = await Cliente.findByPk(CodigoCliente, { transaction: t });
        
        if (!cliente) {
          throw new Error(`Cliente no encontrado: ${CodigoCliente}`);
        }
        
        // Actualizar la deuda del cliente
        await cliente.update(
          { 
            ImporteDeuda: (cliente.ImporteDeuda || 0) - totalFormasPago 
          },
          { transaction: t }
        );
        console.log("Deuda del cliente actualizada correctamente");
      } catch (errorCliente) {
        console.error("Error al actualizar deuda del cliente:", errorCliente);
        await t.rollback();
        return res.status(500).json({
          success: false,
          message: "Error al actualizar la deuda del cliente",
          error: errorCliente.message,
          stack: errorCliente.stack
        });
      }

      // Confirmar transacción
      console.log("Confirmando transacción...");
      await t.commit();
      console.log("Transacción confirmada exitosamente");
      
      return res.status(201).json({
        success: true,
        message: 'Recibo creado correctamente',
        data: recibo
      });
    } catch (error) {
      // Revertir transacción en caso de error
      console.error("Error en el proceso de creación:", error);
      console.error("Stack trace:", error.stack);
      await t.rollback();
      throw error;
    }
  } catch (error) {
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
  const { FacturaCabeza, NotaDebitoCabeza, ReciboItem } = models;
  
  if (!documentosDeuda || documentosDeuda.length === 0) {
    return;
  }
  console.log("***********Recibo numero***********", DocumentoTipo, DocumentoSucursal, DocumentoNumero);
  for (const doc of documentosDeuda) {
    const { DocDeudaDocumentoTipo, DocDeudaDocumentoSucursal, DocDeudaDocumentoNumero, DocDeudaImporte } = doc;
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
        throw new Error(`Factura no encontrada: ${DocDeudaDocumentoTipo}-${DocDeudaDocumentoSucursal}-${DocDeudaDocumentoNumero}`);
      }
      
      // Verificar que el importe no exceda el saldo pendiente
      const saldoPendiente = documentoDeuda.ImporteTotal - (documentoDeuda.ImportePagado || 0);
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
    } else if (DocDeudaDocumentoTipo === 'NDF' || DocDeudaDocumentoTipo === 'NDA' || DocDeudaDocumentoTipo === 'NDC' || DocDeudaDocumentoTipo === 'NDB') {
      // Es una nota de débito
      documentoDeuda = await NotaDebitoCabeza.findOne({
        where: {
          DocumentoTipo: DocDeudaDocumentoTipo,
          DocumentoSucursal: DocDeudaDocumentoSucursal,
          DocumentoNumero: DocDeudaDocumentoNumero
        },
        transaction
      });
      
      if (!documentoDeuda) {
        throw new Error(`Nota de débito no encontrada: ${DocDeudaDocumentoTipo}-${DocDeudaDocumentoSucursal}-${DocDeudaDocumentoNumero}`);
      }
      
      // Verificar que el importe no exceda el saldo pendiente
      const saldoPendiente = documentoDeuda.ImporteTotal - (documentoDeuda.ImportePagado || 0);
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
    } catch (error) {
      console.error("Error al insertar/actualizar en recibositems:", error);
      throw error;
    }
  }
}

// Función para actualizar documentos de crédito
async function actualizarDocumentosCredito(documentosCredito, {DocumentoTipo, DocumentoSucursal, DocumentoNumero}, transaction) {
  if (!documentosCredito || documentosCredito.length === 0) {
    return;
  }

  for (const doc of documentosCredito) {
    const { DocCreditoDocumentoTipo, DocCreditoDocumentoSucursal, DocCreditoDocumentoNumero, DocCreditoImporte } = doc;
    console.log("_________________doc", doc);
    // Obtener el documento de crédito
    const documentoCredito = await NotaCreditoCabeza.findOne({
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
    Total: 0,
    ImporteTotal,
    ClienteCodigo: CodigoCliente,
    Estado: 'A' // Activo
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
  const transaction = await sequelize.transaction();
  
  try {
    const { tipo, sucursal, numero } = req.params;
    
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
    
    // Obtener los documentos de crédito utilizados
    const documentosCredito = await ReciboValor.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
        ValorCodigo: {
          [Op.in]: ['NCF', 'NCA', 'NCB', 'NCC'] // Filtrar todos los tipos de notas de crédito
        }
      },
      transaction
    });
    
    // Obtener los documentos de deuda asociados al recibo
    const documentosDeuda = await ReciboItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      },
      transaction
    });
    
    // Obtener el cliente
    const cliente = await Cliente.findByPk(recibo.ClienteCodigo, { transaction });
    
    if (!cliente) {
      throw new Error(`Cliente no encontrado: ${recibo.ClienteCodigo}`);
    }
    
    // 1. Actualizar el importe de deuda del cliente (sumar el total de valores)
    const totalValores = valores.reduce((total, valor) => total + valor.ValorImporte, 0);
    
    await cliente.update(
      { 
        ImporteDeuda: (cliente.ImporteDeuda || 0) + totalValores 
      },
      { transaction }
    );
    
    // 2. Actualizar los documentos de deuda (restar el importe pagado)
    for (const doc of documentosDeuda) {
      // Determinar el tipo de documento de deuda
      if (doc.FacturaTipo === 'PRF' || doc.FacturaTipo === 'FCA' || doc.FacturaTipo === 'FCB' || doc.FacturaTipo === 'FCC') {
        // Es una factura
        const factura = await FacturaCabeza.findOne({
          where: {
            DocumentoTipo: doc.FacturaTipo,
            DocumentoSucursal: doc.FacturaSucursal,
            DocumentoNumero: doc.FacturaNumero
          },
          transaction
        });
        
        if (factura) {
          await factura.update(
            { 
              ImportePagado: (factura.ImportePagado || 0) - doc.ImportePagado 
            },
            { transaction }
          );
        }
      } else if (doc.FacturaTipo === 'NDF' || doc.FacturaTipo === 'NDA' || doc.FacturaTipo === 'NDC' || doc.FacturaTipo === 'NDB') {
        // Es una nota de débito
        const notaDebito = await NotaDebitoCabeza.findOne({
          where: {
            DocumentoTipo: doc.FacturaTipo,
            DocumentoSucursal: doc.FacturaSucursal,
            DocumentoNumero: doc.FacturaNumero
          },
          transaction
        });
        
        if (notaDebito) {
          await notaDebito.update(
            { 
              ImportePagado: (notaDebito.ImportePagado || 0) - doc.ImportePagado 
            },
            { transaction }
          );
        }
      }
    }
    
    // 3. Actualizar el importe utilizado de las notas de crédito y el saldo no aplicado
    if (documentosCredito.length > 0) {
      // Calcular el total de notas de crédito
      const totalNotasCredito = documentosCredito.reduce((total, doc) => total + doc.ValorImporte, 0);
      
      // Actualizar el saldo no aplicado del cliente
      await cliente.update(
        { 
          SaldoNTCNoAplicado: (cliente.SaldoNTCNoAplicado || 0) + totalNotasCredito 
        },
        { transaction }
      );
      
      // Actualizar cada nota de crédito
      for (const doc of documentosCredito) {
        const notaCredito = await NotaCreditoCabeza.findOne({
          where: {
            DocumentoTipo: doc.ValorCodigo,
            DocumentoSucursal: doc.ValorSucursal,
            DocumentoNumero: doc.ValorNumero
          },
          transaction
        });
        
        if (notaCredito) {
          // Restar el importe utilizado
          await notaCredito.update(
            { 
              ImporteUtilizado: (notaCredito.ImporteUtilizado || 0) - doc.ValorImporte 
            },
            { transaction }
          );
        }
      }
    }
    
    // 4. Marcar el recibo como anulado
    await recibo.update({
      FechaAnulacion: new Date()
    }, { transaction });
    
    await transaction.commit();
    
    return res.status(200).json({
      message: 'Recibo anulado correctamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: 'Error al anular el recibo' });
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
    
    // Consulta SQL para obtener las facturas impagas del cliente
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
      ORDER BY 
        f.Fecha ASC
    `;
    
    //consulta para obtener las notas de debito impagas
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
    
    // Consulta para obtener notas de crédito con saldo disponible
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