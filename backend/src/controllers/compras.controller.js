const { Op } = require('sequelize');

exports.listarCompras = async (req, res) => {
  try {
    const { ComprasCabeza, Proveedor } = req.models;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const proveedorCodigo = req.query.proveedor || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;

    const whereClause = {};
    if (proveedorCodigo) whereClause.ProveedorCodigo = proveedorCodigo;
    if (fechaDesde && fechaHasta) {
      whereClause.Fecha = { [Op.between]: [fechaDesde, fechaHasta] };
    } else if (fechaDesde) {
      whereClause.Fecha = { [Op.gte]: fechaDesde };
    } else if (fechaHasta) {
      whereClause.Fecha = { [Op.lte]: fechaHasta };
    }

    const compras = await ComprasCabeza.findAndCountAll({
      where: whereClause,
      attributes: [
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'Fecha',
        'ProveedorCodigo',
        'ImporteTotal',
        'ImportePagado',
        'FechaAnulacion',
        'Anulado',
      ],
      include: [
        {
          model: Proveedor,
          as: 'ProveedorRelacion',
          attributes: ['Codigo', 'Descripcion'],
        },
      ],
      order: [
        ['Fecha', 'DESC'],
        ['DocumentoNumero', 'DESC'],
      ],
      limit,
      offset,
    });

    const items = compras.rows.map((c) => {
      const item = c.toJSON();
      const total = Number(item.ImporteTotal) || 0;
      const pagado = Number(item.ImportePagado) || 0;
      item.Saldo = total - pagado;
      if (item.Fecha) {
        const d = new Date(item.Fecha);
        item.FechaFormateada = d.toISOString().split('T')[0];
      }
      return item;
    });

    res.json({
      items,
      meta: {
        totalItems: compras.count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(compras.count / limit),
      },
    });
  } catch (error) {
    console.error('Error al listar compras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener compras',
      error: error.message,
    });
  }
};

exports.obtenerCompra = async (req, res) => {
  try {
    const { ComprasCabeza, ComprasItem, Proveedor, Articulo } = req.models;
    const { tipo, sucursal, numero } = req.params;

    const compra = await ComprasCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: Proveedor,
          as: 'ProveedorRelacion',
          attributes: ['Codigo', 'Descripcion', 'Cuit', 'Telefono'],
        },
      ],
    });

    if (!compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada',
      });
    }

    const cabeza = compra.toJSON();
    if (cabeza.Fecha) {
      const d = new Date(cabeza.Fecha);
      cabeza.FechaFormateada = d.toISOString().split('T')[0];
    }
    cabeza.Saldo = (Number(cabeza.ImporteTotal) || 0) - (Number(cabeza.ImportePagado) || 0);

    const items = await ComprasItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: Articulo,
          as: 'Articulo',
          required: false,
          attributes: ['Codigo', 'Descripcion'],
        },
      ],
    });

    return res.status(200).json({
      ...cabeza,
      Items: items.map((i) => i.toJSON()),
    });
  } catch (error) {
    console.error('Error al obtener compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la compra',
      error: error.message,
    });
  }
};

exports.crearCompra = async (req, res) => {
  const {
    ComprasCabeza,
    ComprasItem,
    Proveedor,
  } = req.models;
  const sequelize = Proveedor.sequelize;
  const t = await sequelize.transaction();

  try {
    const {
      DocumentoTipo,
      DocumentoSucursal,
      DocumentoNumero,
      Fecha,
      FechaDePago,
      ProveedorCodigo,
      TipoPago,
      ImporteBruto = 0,
      ImporteBonificado = 0,
      ImporteNeto = 0,
      ImporteAdicional = 0,
      ImporteIva1 = 0,
      ImporteIva2 = 0,
      Percepcion = 0,
      ImporteTotal = 0,
      ImportePagado = 0,
      Observacion,
      ObservacionAnula,
      RemitoNro,
      OrdenCompraNro,
      IngresosBrutos = 0,
      OtrosImpuestos1 = 0,
      OtrosImpuestos2 = 0,
      OtrosImpuestos3 = 0,
      Items = [],
    } = req.body;

    if (!ProveedorCodigo || !Fecha) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Proveedor y fecha son obligatorios' });
    }
    if (!DocumentoTipo || !DocumentoNumero || String(DocumentoNumero).trim() === '') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Tipo y número de comprobante son obligatorios (datos del comprobante del proveedor)' });
    }

    const prov = await Proveedor.findByPk(ProveedorCodigo, { transaction: t });
    if (!prov) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Proveedor no encontrado' });
    }

    const tipoDoc = String(DocumentoTipo).trim().substring(0, 3).toUpperCase();
    const sucursal = (DocumentoSucursal != null && String(DocumentoSucursal).trim() !== '')
      ? String(DocumentoSucursal).trim().substring(0, 4)
      : '01';
    const documentoNumero = String(DocumentoNumero).trim().substring(0, 8);

    const existe = await ComprasCabeza.findOne({
      where: {
        DocumentoTipo: tipoDoc,
        DocumentoSucursal: sucursal,
        DocumentoNumero: documentoNumero,
        ProveedorCodigo
      },
      transaction: t
    });
    if (existe) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Ya existe una factura de compra con ese tipo, sucursal y número para este proveedor'
      });
    }

    await ComprasCabeza.create(
      {
        DocumentoTipo: tipoDoc,
        DocumentoSucursal: sucursal,
        DocumentoNumero: documentoNumero,
        Fecha,
        FechaDePago: FechaDePago || null,
        ProveedorCodigo,
        TipoPago: TipoPago || null,
        ImporteBruto: parseFloat(ImporteBruto) || 0,
        ImporteBonificado: parseFloat(ImporteBonificado) || 0,
        ImporteNeto: parseFloat(ImporteNeto) || 0,
        ImporteAdicional: parseFloat(ImporteAdicional) || 0,
        ImporteIva1: parseFloat(ImporteIva1) || 0,
        ImporteIva2: parseFloat(ImporteIva2) || 0,
        Percepcion: parseFloat(Percepcion) || 0,
        ImporteTotal: parseFloat(ImporteTotal) || 0,
        ImportePagado: parseFloat(ImportePagado) || 0,
        Observacion: Observacion || null,
        ObservacionAnula: ObservacionAnula || null,
        RemitoNro: RemitoNro || null,
        OrdenCompraNro: OrdenCompraNro || null,
        FechaAnulacion: null,
        Anulado: 0,
        IngresosBrutos: parseFloat(IngresosBrutos) || 0,
        OtrosImpuestos1: parseFloat(OtrosImpuestos1) || 0,
        OtrosImpuestos2: parseFloat(OtrosImpuestos2) || 0,
        OtrosImpuestos3: parseFloat(OtrosImpuestos3) || 0,
      },
      { transaction: t }
    );

    for (const it of Items) {
      const { CodigoArticulo, Cantidad, PrecioCostoUnitario } = it;
      if (!CodigoArticulo) continue;
      await ComprasItem.create(
        {
          DocumentoTipo: tipoDoc,
          DocumentoSucursal: sucursal,
          DocumentoNumero: documentoNumero,
          ProveedorCodigo,
          CodigoArticulo,
          Cantidad: parseFloat(Cantidad) || 0,
          PrecioCostoUnitario: parseFloat(PrecioCostoUnitario) || 0,
        },
        { transaction: t }
      );
    }

    await prov.update(
      { ImporteDeuda: (parseFloat(prov.ImporteDeuda) || 0) + (parseFloat(ImporteTotal) || 0) },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({
      success: true,
      message: 'Factura de compra registrada',
      data: {
        DocumentoTipo: tipoDoc,
        DocumentoSucursal: sucursal,
        DocumentoNumero: documentoNumero,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error('Error crear compra:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar la factura de compra',
      error: error.message,
    });
  }
};
