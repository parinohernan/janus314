const NumerosControlController = require('./numerosControl.controller');
const { Op } = require('sequelize');

exports.listarRecibos = async (req, res) => {
  try {
    const { ProveedoresReciboCabeza, Proveedor } = req.models;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const proveedorCodigo = req.query.proveedorCodigo || '';
    const fechaDesde = req.query.fechaDesde || '';
    const fechaHasta = req.query.fechaHasta || '';

    const whereClause = {};
    if (proveedorCodigo) whereClause.ProveedorCodigo = proveedorCodigo;
    if (fechaDesde || fechaHasta) {
      whereClause.Fecha = {};
      if (fechaDesde) whereClause.Fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.Fecha[Op.lte] = fechaHasta;
    }

    ProveedoresReciboCabeza.belongsTo(Proveedor, {
      foreignKey: 'ProveedorCodigo',
      as: 'ProveedorRelacion'
    });

    const count = await ProveedoresReciboCabeza.count({ where: whereClause });
    const recibos = await ProveedoresReciboCabeza.findAll({
      where: whereClause,
      include: [{
        model: Proveedor,
        as: 'ProveedorRelacion',
        attributes: ['Codigo', 'Descripcion']
      }],
      order: [['Fecha', 'DESC'], ['DocumentoNumero', 'DESC']],
      limit,
      offset
    });

    return res.status(200).json({
      items: recibos,
      meta: {
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error listar recibos proveedores:', error);
    return res.status(500).json({
      message: 'Error al obtener los recibos',
      error: error.message
    });
  }
};

exports.getReciboById = async (req, res) => {
  try {
    const {
      ProveedoresReciboCabeza,
      ProveedoresReciboItem,
      ProveedoresReciboValor,
      Proveedor
    } = req.models;
    const { tipo, sucursal, numero } = req.params;

    const recibo = await ProveedoresReciboCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      },
      include: [{ model: Proveedor, as: 'ProveedorRelacion', attributes: ['Codigo', 'Descripcion'] }]
    });

    if (!recibo) {
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }

    const [items, valores] = await Promise.all([
      ProveedoresReciboItem.findAll({
        where: {
          DocumentoTipo: tipo,
          DocumentoSucursal: sucursal,
          DocumentoNumero: numero
        }
      }),
      ProveedoresReciboValor.findAll({
        where: {
          DocumentoTipo: tipo,
          DocumentoSucursal: sucursal,
          DocumentoNumero: numero
        }
      })
    ]);

    return res.status(200).json({
      ...recibo.toJSON(),
      Items: items.map((i) => i.toJSON()),
      Valores: valores.map((v) => v.toJSON())
    });
  } catch (error) {
    console.error('Error get recibo proveedor:', error);
    return res.status(500).json({ message: 'Error al obtener el recibo', error: error.message });
  }
};

exports.getDocumentosDeuda = async (req, res) => {
  try {
    const { codigoproveedor } = req.params;
    const { Proveedor } = req.models;
    if (!codigoproveedor) {
      return res.status(400).json({ message: 'Se requiere el código del proveedor' });
    }
    const sequelize = Proveedor.sequelize;

    const queryCompras = `
      SELECT DocumentoTipo, DocumentoSucursal, DocumentoNumero, Fecha, ImporteTotal, ImportePagado
      FROM comprascabeza
      WHERE ProveedorCodigo = :cod
        AND (ImporteTotal - COALESCE(ImportePagado, 0)) > 0
        AND (FechaAnulacion IS NULL AND (Anulado IS NULL OR Anulado = 0))
      ORDER BY Fecha ASC
    `;
    const queryND = `
      SELECT DocumentoTipo, DocumentoSucursal, DocumentoNumero, Fecha, ImporteTotal, ImportePagado
      FROM proveedoresnotadebitocabeza
      WHERE ProveedorCodigo = :cod
        AND (ImporteTotal - COALESCE(ImportePagado, 0)) > 0
        AND FechaAnulacion IS NULL
      ORDER BY Fecha ASC
    `;
    const [compras, notasDebito] = await Promise.all([
      sequelize.query(queryCompras, { replacements: { cod: codigoproveedor }, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(queryND, { replacements: { cod: codigoproveedor }, type: sequelize.QueryTypes.SELECT })
    ]);
    const documentosDeuda = [...compras, ...notasDebito];
    documentosDeuda.sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));

    return res.status(200).json({ success: true, data: documentosDeuda });
  } catch (error) {
    console.error('Error getDocumentosDeuda proveedor:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener documentos de deuda' });
  }
};

exports.getDocumentosCredito = async (req, res) => {
  try {
    const { codigoproveedor } = req.params;
    const { Proveedor } = req.models;
    if (!codigoproveedor) {
      return res.status(400).json({ message: 'Se requiere el código del proveedor' });
    }
    const sequelize = Proveedor.sequelize;

    const query = `
      SELECT DocumentoTipo as documento, DocumentoSucursal as sucursal, DocumentoNumero as numero,
             Fecha as fecha, ImporteTotal as total, COALESCE(ImporteUtilizado, 0) as importeUtilizado,
             (ImporteTotal - COALESCE(ImporteUtilizado, 0)) as saldo
      FROM proveedoresnotacreditocabeza
      WHERE CodigoProveedor = :cod
        AND ImporteTotal > COALESCE(ImporteUtilizado, 0)
        AND FechaAnulacion IS NULL
      ORDER BY Fecha DESC
    `;
    const rows = await sequelize.query(query, {
      replacements: { cod: codigoproveedor },
      type: sequelize.QueryTypes.SELECT
    });
    const data = rows.map((doc) => ({
      documento: `${doc.documento}-${doc.sucursal}-${doc.numero}`,
      fecha: doc.fecha,
      total: doc.total,
      importeUtilizado: doc.importeUtilizado,
      saldo: doc.saldo
    }));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error getDocumentosCredito proveedor:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener documentos de crédito' });
  }
};

exports.createRecibo = async (req, res) => {
  const {
    ProveedoresReciboCabeza,
    ProveedoresReciboItem,
    ProveedoresReciboValor,
    ComprasCabeza,
    ProveedoresNotaDebitoCabeza,
    ProveedoresNotaCreditoCabeza,
    Proveedor,
    NumerosControl
  } = req.models;
  const sequelize = Proveedor.sequelize;
  const t = await sequelize.transaction();

  try {
    const {
      DocumentoTipo,
      DocumentoSucursal,
      DocumentoNumero,
      Fecha,
      ProveedorCodigo,
      DocumentosDeuda = [],
      DocumentosCredito = [],
      FormasPago = [],
      ImporteTotal,
      VendedorCodigo
    } = req.body;

    if (!DocumentoTipo || !DocumentoSucursal || !DocumentoNumero || !Fecha || !ProveedorCodigo) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
    }

    await ProveedoresReciboCabeza.create({
      DocumentoTipo,
      DocumentoSucursal,
      DocumentoNumero,
      Fecha,
      ProveedorCodigo,
      ImporteTotal: parseFloat(ImporteTotal) || 0,
      FechaAnulacion: null,
      VendedorCodigo: VendedorCodigo || null
    }, { transaction: t });

    for (const doc of DocumentosDeuda) {
      const { DocumentoTipo: dt, DocumentoSucursal: ds, DocumentoNumero: dn, Importe } = doc;
      const docObj = await ComprasCabeza.findOne({
        where: { DocumentoTipo: dt, DocumentoSucursal: ds, DocumentoNumero: dn },
        transaction: t
      }).then((r) => r && { model: 'Compras', doc: r }) ||
        await ProveedoresNotaDebitoCabeza.findOne({
          where: { DocumentoTipo: dt, DocumentoSucursal: ds, DocumentoNumero: dn },
          transaction: t
        }).then((r) => r && { model: 'ND', doc: r });

      if (!docObj) {
        await t.rollback();
        return res.status(400).json({ message: `Documento no encontrado: ${dt}-${ds}-${dn}` });
      }
      const saldo = (docObj.doc.ImporteTotal || 0) - (docObj.doc.ImportePagado || 0);
      if ((Importe || 0) > saldo) {
        await t.rollback();
        return res.status(400).json({ message: `Importe excede saldo en ${dt}-${ds}-${dn}` });
      }
      await docObj.doc.update({
        ImportePagado: (docObj.doc.ImportePagado || 0) + (Importe || 0)
      }, { transaction: t });
      await ProveedoresReciboItem.create({
        DocumentoTipo,
        DocumentoSucursal,
        DocumentoNumero,
        FacturaTipo: dt,
        FacturaSucursal: ds,
        FacturaNumero: dn,
        ProveedorCodigo,
        ImportePagado: Importe || 0
      }, { transaction: t });
    }

    for (const doc of DocumentosCredito) {
      const parts = doc.Documento ? doc.Documento.split('-') : [];
      const [dt, ds, dn] = parts;
      const importe = doc.Importe || 0;
      if (!dt || !ds || !dn) continue;
      const nc = await ProveedoresNotaCreditoCabeza.findOne({
        where: { DocumentoTipo: dt, DocumentoSucursal: ds, DocumentoNumero: dn },
        transaction: t
      });
      if (!nc) {
        await t.rollback();
        return res.status(400).json({ message: `Nota de crédito no encontrada: ${doc.Documento}` });
      }
      const saldo = (nc.ImporteTotal || 0) - (nc.ImporteUtilizado || 0);
      if (importe > saldo) {
        await t.rollback();
        return res.status(400).json({ message: `Importe excede saldo en NC ${doc.Documento}` });
      }
      await nc.update({
        ImporteUtilizado: (nc.ImporteUtilizado || 0) + importe
      }, { transaction: t });
      await ProveedoresReciboValor.create({
        DocumentoTipo,
        DocumentoSucursal,
        DocumentoNumero,
        ValorCodigo: dt,
        ValorSucursal: ds,
        ValorNumero: dn,
        ValorImporte: importe,
        ValorFecha: new Date(Fecha)
      }, { transaction: t });
    }

    for (const fp of FormasPago) {
      await ProveedoresReciboValor.create({
        DocumentoTipo,
        DocumentoSucursal,
        DocumentoNumero,
        ValorCodigo: fp.Codigo || 'EFE',
        ValorFecha: fp.Fecha ? new Date(fp.Fecha) : new Date(),
        ValorSucursal: fp.Sucursal || null,
        ValorNumero: fp.Numero || null,
        Valorbanco: fp.Banco || null,
        ValorImporte: parseFloat(fp.Importe) || 0,
        ChequeCodigo: fp.ChequeCodigo || null,
        ValorObservaciones: fp.Observaciones || null
      }, { transaction: t });
    }

    const prov = await Proveedor.findByPk(ProveedorCodigo, { transaction: t });
    if (prov) {
      await prov.update({
        ImporteDeuda: Math.max(0, (prov.ImporteDeuda || 0) - (parseFloat(ImporteTotal) || 0))
      }, { transaction: t });
    }

    try {
      await NumerosControlController.actualizarNumeroDirecto(
        DocumentoTipo,
        DocumentoSucursal,
        parseFloat(ImporteTotal) || 0,
        t,
        req.models
      );
    } catch (errNum) {
      await t.rollback();
      return res.status(500).json({ message: 'Error al actualizar número de control', error: errNum.message });
    }

    await t.commit();
    return res.status(201).json({
      success: true,
      message: 'Recibo de proveedor creado correctamente',
      data: { DocumentoTipo, DocumentoSucursal, DocumentoNumero }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error create recibo proveedor:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear el recibo',
      error: error.message
    });
  }
};

exports.anularRecibo = async (req, res) => {
  const {
    ProveedoresReciboCabeza,
    ProveedoresReciboItem,
    ProveedoresReciboValor,
    ComprasCabeza,
    ProveedoresNotaDebitoCabeza,
    ProveedoresNotaCreditoCabeza,
    Proveedor
  } = req.models;
  const sequelize = Proveedor.sequelize;
  const t = await sequelize.transaction();

  try {
    const { tipo, sucursal, numero } = req.params;
    const recibo = await ProveedoresReciboCabeza.findOne({
      where: { DocumentoTipo: tipo, DocumentoSucursal: sucursal, DocumentoNumero: numero },
      transaction: t
    });
    if (!recibo) {
      await t.rollback();
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }
    if (recibo.FechaAnulacion) {
      await t.rollback();
      return res.status(400).json({ message: 'El recibo ya está anulado' });
    }

    const items = await ProveedoresReciboItem.findAll({
      where: { DocumentoTipo: tipo, DocumentoSucursal: sucursal, DocumentoNumero: numero },
      transaction: t
    });
    const valores = await ProveedoresReciboValor.findAll({
      where: { DocumentoTipo: tipo, DocumentoSucursal: sucursal, DocumentoNumero: numero },
      transaction: t
    });

    for (const item of items) {
      const compra = await ComprasCabeza.findOne({
        where: {
          DocumentoTipo: item.FacturaTipo,
          DocumentoSucursal: item.FacturaSucursal,
          DocumentoNumero: item.FacturaNumero
        },
        transaction: t
      });
      if (compra) {
        await compra.update({
          ImportePagado: Math.max(0, (compra.ImportePagado || 0) - (item.ImportePagado || 0))
        }, { transaction: t });
      } else {
        const nd = await ProveedoresNotaDebitoCabeza.findOne({
          where: {
            DocumentoTipo: item.FacturaTipo,
            DocumentoSucursal: item.FacturaSucursal,
            DocumentoNumero: item.FacturaNumero
          },
          transaction: t
        });
        if (nd) {
          await nd.update({
            ImportePagado: Math.max(0, (nd.ImportePagado || 0) - (item.ImportePagado || 0))
          }, { transaction: t });
        }
      }
    }

    for (const v of valores) {
      if (v.ValorCodigo && ['NCA', 'NCB', 'NCC', 'NCF'].includes(v.ValorCodigo)) {
        const nc = await ProveedoresNotaCreditoCabeza.findOne({
          where: {
            DocumentoTipo: v.ValorCodigo,
            DocumentoSucursal: v.ValorSucursal,
            DocumentoNumero: v.ValorNumero
          },
          transaction: t
        });
        if (nc) {
          await nc.update({
            ImporteUtilizado: Math.max(0, (nc.ImporteUtilizado || 0) - (v.ValorImporte || 0))
          }, { transaction: t });
        }
      }
    }

    const totalRecibo = recibo.ImporteTotal || 0;
    const prov = await Proveedor.findByPk(recibo.ProveedorCodigo, { transaction: t });
    if (prov) {
      await prov.update({
        ImporteDeuda: (prov.ImporteDeuda || 0) + totalRecibo
      }, { transaction: t });
    }

    await recibo.update({ FechaAnulacion: new Date() }, { transaction: t });
    await t.commit();
    return res.status(200).json({ message: 'Recibo anulado correctamente' });
  } catch (error) {
    await t.rollback();
    console.error('Error anular recibo proveedor:', error);
    return res.status(500).json({ message: 'Error al anular el recibo', error: error.message });
  }
};
