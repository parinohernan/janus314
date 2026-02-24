const { Op } = require('sequelize');

exports.listar = async (req, res) => {
  try {
    const { ProveedoresNotaDebitoCabeza, Proveedor } = req.models;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const proveedorCodigo = req.query.proveedorCodigo || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;

    const whereClause = {};
    if (proveedorCodigo) whereClause.ProveedorCodigo = proveedorCodigo;
    if (fechaDesde || fechaHasta) {
      whereClause.Fecha = {};
      if (fechaDesde) whereClause.Fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.Fecha[Op.lte] = fechaHasta;
    }

    const { count, rows } = await ProveedoresNotaDebitoCabeza.findAndCountAll({
      where: whereClause,
      attributes: [
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'Fecha',
        'ProveedorCodigo',
        'ImporteTotal',
        'ImportePagado',
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
    console.error('Error listar ND proveedores:', error);
    res.status(500).json({ message: 'Error al listar notas de débito', error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { ProveedoresNotaDebitoCabeza, ProveedoresNotaDebitoItem, Proveedor } = req.models;
    const { tipo, sucursal, numero } = req.params;

    const nd = await ProveedoresNotaDebitoCabeza.findOne({
      where: { DocumentoTipo: tipo, DocumentoSucursal: sucursal, DocumentoNumero: numero },
      include: [{ model: Proveedor, as: 'ProveedorRelacion', attributes: ['Codigo', 'Descripcion'] }]
    });
    if (!nd) return res.status(404).json({ message: 'Nota de débito no encontrada' });

    const items = await ProveedoresNotaDebitoItem.findAll({
      where: { DocumentoTipo: tipo, DocumentoSucursal: sucursal, DocumentoNumero: numero }
    });

    res.json({ ...nd.toJSON(), Items: items.map((i) => i.toJSON()) });
  } catch (error) {
    console.error('Error obtener ND proveedor:', error);
    res.status(500).json({ message: 'Error al obtener la nota de débito', error: error.message });
  }
};
