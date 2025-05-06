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
    console.log("___________tipo, sucursal, numero", tipo, sucursal, numero);
    
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
    const documentosCredito = await ReciboValor.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
        ValorCodigo: 'NCF' // Filtrar solo los valores que son notas de crédito
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
  
  console.log("___________req.body", req.body);
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

    // 1. Crear primero el recibo
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

    // 2. Actualizar documentos de deuda (facturas o notas de débito)
    await actualizarDocumentosDeuda(documentosDeudaMapeados, {DocumentoTipo, DocumentoSucursal, DocumentoNumero}, t);

    // 3. Actualizar documentos de crédito
    await actualizarDocumentosCredito(documentosCreditoMapeados, {DocumentoTipo, DocumentoSucursal, DocumentoNumero}, t);

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
async function actualizarDocumentosDeuda(documentosDeuda, {DocumentoTipo, DocumentoSucursal, DocumentoNumero}, transaction) {
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
        nc.DocumentoTipo as documento,
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
    
    const recibos = await ReciboCabeza.findAndCountAll({
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