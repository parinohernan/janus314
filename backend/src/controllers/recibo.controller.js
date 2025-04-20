const ReciboCabeza = require('../models/reciboCabeza.model');
const ReciboItem = require('../models/reciboItem.model');
const ReciboValor = require('../models/reciboValor.model');
const Cliente = require('../models/cliente.model');
const Usuario = require('../models/usuario.model');
const Vendedor = require('../models/vendedor.model');
const NotaCreditoCabeza = require('../models/notaCreditoCabeza.model');
const NotaDebitoCabeza = require('../models/notaDebitoCabeza.model');
const FacturaCabeza = require('../models/facturaCabeza.model');
const NumerosControlController = require('../controllers/numerosControl.controller');

const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Obtener todos los recibos (con filtros y paginación)
exports.getAllRecibos = async (req, res) => {
  try {
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

    const count = await ReciboCabeza.count({ where: whereClause });

    const recibos = await ReciboCabeza.findAll({
      where: whereClause,
      order: [
        ['Fecha', sortOrder],
        ['DocumentoSucursal', sortOrder],
        ['DocumentoNumero', sortOrder]
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Cliente,
          as: 'ClienteRelacion',
          attributes: ['Descripcion', 'NombreFantasia']
        },
        {
          model: Usuario,
          as: 'UsuarioRelacion',
          attributes: ['Descripcion']
        },
        {
          model: Vendedor,
          as: 'VendedorRelacion',
          attributes: ['Descripcion']
        }
      ]
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
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener los recibos' });
  }
};

// Obtener un recibo por ID
exports.getReciboById = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;
    console.log("tipo, sucursal, numero", tipo, sucursal, numero);
    
    // Obtener encabezado
    const recibo = await ReciboCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      },
      include: [
        {
          model: Cliente,
          as: 'ClienteRelacion',
          attributes: ['Descripcion', 'NombreFantasia', 'Cuit']
        },
        {
          model: Usuario,
          as: 'UsuarioRelacion',
          attributes: ['Descripcion']
        },
        {
          model: Vendedor,
          as: 'VendedorRelacion',
          attributes: ['Descripcion']
        }
      ]
    });

    if (!recibo) {
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }

    // Obtener items manualmente (documentos de deuda)
    const items = await ReciboItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }
    });

    // Obtener valores manualmente (documentos de pago)
    const valores = await ReciboValor.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }
    });
    // obtener los documentos de credito
    const documentosCredito = await ReciboCredito.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }
    });

    // Combinar los datos
    const reciboCompleto = {
      ...recibo.toJSON(),
      Items: items,
      Valores: valores,
      DocumentosCredito: documentosCredito
    };

    return res.status(200).json(reciboCompleto);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener el recibo' });
  }
};

// Crear un nuevo recibo
exports.createRecibo = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
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
    } = req.body;

    // Validar datos requeridos
    if (!DocumentoTipo || !DocumentoSucursal || !DocumentoNumero || !Fecha || !CodigoCliente) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    // 1. Actualizar documentos de deuda (facturas o notas de débito)
    await actualizarDocumentosDeuda(DocumentosDeuda, t);

    // 2. Actualizar documentos de crédito
    await actualizarDocumentosCredito(DocumentosCredito, t);

    // 3. Grabar el recibo y las formas de pago
    const recibo = await grabarReciboYFormasPago(
      DocumentoTipo,
      DocumentoSucursal,
      DocumentoNumero,
      Fecha,
      CodigoCliente,
      Observaciones,
      FormasPago,
      ImporteTotal,
      t
    );

    // 4. Actualizar número de control
    try {
      await NumerosControlController.actualizarNumeroDirecto(
        DocumentoTipo,
        DocumentoSucursal,
        ImporteTotal
      );

    } catch (errorNumero) {
      // Si hay error en la actualización del número, hacemos rollback
      await t.rollback();
      return res.status(500).json({
        success: false,
        message: "Error al actualizar el número de control",
        error: errorNumero.message,
      });
    }

    // 5. Actualizar la deuda del cliente
    try {
      // Calcular el total de las formas de pago
      const totalFormasPago = FormasPago.reduce((total, formaPago) => total + formaPago.Importe, 0);
      
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
    } catch (errorCliente) {
      // Si hay error en la actualización del cliente, hacemos rollback
      await t.rollback();
      return res.status(500).json({
        success: false,
        message: "Error al actualizar la deuda del cliente",
        error: errorCliente.message,
      });
    }

    // Confirmar transacción
    await t.commit();

    return res.status(201).json({
      success: true,
      message: 'Recibo creado correctamente',
      data: recibo
    });
  } catch (error) {
    // Revertir transacción en caso de error
    await t.rollback();
    
    console.error('Error al crear recibo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear el recibo',
      error: error.message
    });
  }
};

// Función para actualizar documentos de deuda
async function actualizarDocumentosDeuda(documentosDeuda, transaction) {
  if (!documentosDeuda || documentosDeuda.length === 0) {
    return;
  }

  for (const doc of documentosDeuda) {
    const { DocumentoTipo, DocumentoSucursal, DocumentoNumero, Importe } = doc;
    // Obtener el documento de deuda según su tipo
    let documentoDeuda;
    
    if (DocumentoTipo === 'PRF' || DocumentoTipo === 'FCA'|| DocumentoTipo === 'FCB' || DocumentoTipo === 'FCC') {
      // Es una factura
      documentoDeuda = await FacturaCabeza.findOne({
        where: {
          DocumentoTipo: DocumentoTipo,
          DocumentoSucursal: DocumentoSucursal,
          DocumentoNumero: DocumentoNumero
        },
        transaction
      });
      
      if (!documentoDeuda) {
        throw new Error(`Factura no encontrada: ${DocumentoTipo}-${DocumentoSucursal}-${DocumentoNumero}`);
      }
      
      // Verificar que el importe no exceda el saldo pendiente
      const saldoPendiente = documentoDeuda.ImporteTotal - (documentoDeuda.ImportePagado || 0);
      if (Importe > saldoPendiente) {
        throw new Error(`El importe a pagar (${Importe}) excede el saldo pendiente (${saldoPendiente}) de la factura ${DocumentoTipo}-${DocumentoSucursal}-${DocumentoNumero}`);
      }
      
      // Actualizar el importe pagado
      await documentoDeuda.update(
        { 
          ImportePagado: (documentoDeuda.ImportePagado || 0) + Importe 
        },
        { transaction }
      );
    } else if (DocumentoTipo === 'NDF' || DocumentoTipo === 'NDA' || DocumentoTipo === 'NDC' || DocumentoTipo === 'NDB') {
      // Es una nota de débito
      documentoDeuda = await NotaDebitoCabeza.findOne({
        where: {
          DocumentoTipo: DocumentoTipo,
          DocumentoSucursal: DocumentoSucursal,
          DocumentoNumero: DocumentoNumero
        },
        transaction
      });
      
      if (!documentoDeuda) {
        throw new Error(`Nota de débito no encontrada: ${DocumentoTipo}-${DocumentoSucursal}-${DocumentoNumero}`);
      }
      
      // Verificar que el importe no exceda el saldo pendiente
      const saldoPendiente = documentoDeuda.ImporteTotal - (documentoDeuda.ImportePagado || 0);
      if (Importe > saldoPendiente) {
        throw new Error(`El importe a pagar (${Importe}) excede el saldo pendiente (${saldoPendiente}) de la nota de débito ${DocumentoTipo}-${DocumentoSucursal}-${DocumentoNumero}`);
      }
      
      // Actualizar el importe pagado
      await documentoDeuda.update(
        { 
          ImportePagado: (documentoDeuda.ImportePagado || 0) + Importe 
        },
        { transaction }
      );
    } else {
      throw new Error(`Tipo de documento no soportado: ${DocumentoTipo}`);
    }
  }
}

// Función para actualizar documentos de crédito
async function actualizarDocumentosCredito(documentosCredito, transaction) {
  if (!documentosCredito || documentosCredito.length === 0) {
    return;
  }

  for (const doc of documentosCredito) {
    const { Documento, Importe } = doc;
    
    // Obtener el documento de crédito
    const documentoCredito = await NotaCreditoCabeza.findOne({
      //Documento = NCF-0006-00000080

      where: {
        DocumentoTipo: doc.Documento.split('-')[0],
        DocumentoSucursal: doc.Documento.split('-')[1],
        DocumentoNumero: doc.Documento.split('-')[2]
      },
      transaction
    });
    console.log("documentoCredito", documentoCredito.toJSON());
    
    if (!documentoCredito) {
      throw new Error(`Nota de crédito no encontrada: ${Documento}`);
    }
    
    // Verificar que el importe no exceda el saldo disponible
    const saldoDisponible = documentoCredito.ImporteTotal - (documentoCredito.ImporteUtilizado || 0);
    if (Importe > saldoDisponible) {
      throw new Error(`El importe a usar (${Importe}) excede el saldo disponible (${saldoDisponible}) de la nota de crédito ${Documento}`);
    }
    
    // Actualizar el importe utilizado
    await documentoCredito.update(
      { 
        ImporteUtilizado: (documentoCredito.ImporteUtilizado || 0) + Importe 
      },
      { transaction }
    );
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
  transaction
) {
   // Crear el recibo
  const recibo = await ReciboCabeza.create({
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

      const { Codigo, Descripcion, Banco, Numero, Fecha, Importe , chequeCodigo} = formaPago;
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
    
    const recibo = await ReciboCabeza.findOne({
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
    
    const recibo = await ReciboCabeza.findOne({
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
    
    if (!codigocliente) {
      return res.status(400).json({ message: 'Se requiere el código del cliente' });
    }
    
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
        FacturaCabeza f
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
    NotaDebitoCabeza n
  WHERE 
    n.ClienteCodigo = :codigocliente
    AND n.ImporteTotal - COALESCE(n.ImportePagado, 0) > 0 
    ORDER BY 
      n.Fecha ASC
    `;
    // obtener las facturas impagas
    const facturas = await sequelize.query(query, {
      replacements: { codigocliente },
      type: sequelize.QueryTypes.SELECT
    });
    // obtener las notas de debito impagas
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
    
    if (!codigocliente) {
      return res.status(400).json({ 
        success: false, 
        message: 'El código de cliente es requerido' 
      });
    }
    
    // Consulta para obtener notas de crédito con saldo disponible
    const query = `
      SELECT 
        'NCF' as documento,
        nc.DocumentoSucursal as sucursal,
        nc.DocumentoNumero as numero,
        nc.Fecha as fecha,
        nc.ImporteTotal as total,
        COALESCE(nc.ImporteUtilizado, 0) as importeUtilizado,
        (nc.ImporteTotal - COALESCE(nc.ImporteUtilizado, 0)) as saldo
      FROM 
        NotaCreditoCabeza nc
      WHERE 
        nc.codigocliente = :codigocliente
        AND nc.ImporteTotal > COALESCE(nc.ImporteUtilizado, 0)
      ORDER BY 
        nc.Fecha DESC
    `;
    
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