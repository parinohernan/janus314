const { Op } = require('sequelize');

exports.listar = async (req, res) => {
  try {
    const { ProveedoresNotaCreditoCabeza, Proveedor } = req.models;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const proveedorCodigo = req.query.proveedorCodigo || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;

    const whereClause = {};
    if (proveedorCodigo) whereClause.CodigoProveedor = proveedorCodigo;
    if (fechaDesde || fechaHasta) {
      whereClause.Fecha = {};
      if (fechaDesde) whereClause.Fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.Fecha[Op.lte] = fechaHasta;
    }

    const { count, rows } = await ProveedoresNotaCreditoCabeza.findAndCountAll({
      where: whereClause,
      attributes: [
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'Fecha',
        'CodigoProveedor',
        'ImporteTotal',
        'ImporteUtilizado',
        'FechaAnulacion'
      ],
      include: [{ model: Proveedor, as: 'ProveedorRelacion', attributes: ['Codigo', 'Descripcion'] }],
      order: [['Fecha', 'DESC'], ['DocumentoNumero', 'DESC']],
      limit,
      offset
    });

    res.json({
      items: rows,
      meta: {
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error listar NC proveedores:', error);
    res.status(500).json({ message: 'Error al listar notas de crédito', error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { ProveedoresNotaCreditoCabeza, ProveedoresNotaCreditoItem, Proveedor } = req.models;
    const { tipo, sucursal, numero } = req.params;

    const nc = await ProveedoresNotaCreditoCabeza.findOne({
      where: { DocumentoTipo: tipo, DocumentoSucursal: sucursal, DocumentoNumero: numero },
      include: [{ model: Proveedor, as: 'ProveedorRelacion', attributes: ['Codigo', 'Descripcion'] }]
    });
    if (!nc) return res.status(404).json({ message: 'Nota de crédito no encontrada' });

    const items = await ProveedoresNotaCreditoItem.findAll({
      where: { DocumentoTipo: tipo, DocumentoSucursal: sucursal, DocumentoNumero: numero }
    });

    res.json({ ...nc.toJSON(), Items: items.map((i) => i.toJSON()) });
  } catch (error) {
    console.error('Error obtener NC proveedor:', error);
    res.status(500).json({ message: 'Error al obtener la nota de crédito', error: error.message });
  }
};
