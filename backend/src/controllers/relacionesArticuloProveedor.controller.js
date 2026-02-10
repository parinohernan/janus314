const { Op } = require('sequelize');

// Listar relaciones por proveedor (para armar la tabla del ingreso por remito)
exports.getByProveedor = async (req, res) => {
  try {
    const { RelacionArticuloProveedor, Articulo, Proveedor } = req.models;
    const { proveedorCodigo } = req.query;

    if (!proveedorCodigo) {
      return res.status(400).json({ message: 'proveedorCodigo es requerido' });
    }

    const relaciones = await RelacionArticuloProveedor.findAll({
      where: { ProveedorCodigo: proveedorCodigo },
      include: [
        { model: Articulo, as: 'ArticuloRelacion', attributes: ['Codigo', 'Descripcion'] },
        { model: Proveedor, as: 'ProveedorRelacion', attributes: ['Codigo', 'Descripcion'] }
      ],
      raw: false
    });

    const items = relaciones.map((r) => ({
      ProveedorCodigo: r.ProveedorCodigo,
      CodigoArticuloProveedor: r.CodigoArticuloProveedor,
      CodigoArticuloEmpresa: r.CodigoArticuloEmpresa,
      Relacion: r.Relacion,
      DescripcionProveedor: r.DescripcionProveedor,
      ArticuloEmpresa: r.ArticuloRelacion ? { Codigo: r.ArticuloRelacion.Codigo, Descripcion: r.ArticuloRelacion.Descripcion } : null
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener relaciones artículo proveedor' });
  }
};

// Crear o actualizar una relación (upsert por ProveedorCodigo + CodigoArticuloProveedor)
exports.upsert = async (req, res) => {
  try {
    const { RelacionArticuloProveedor } = req.models;
    const { ProveedorCodigo, CodigoArticuloProveedor, CodigoArticuloEmpresa, Relacion, DescripcionProveedor } = req.body;

    if (!ProveedorCodigo || !CodigoArticuloProveedor || !CodigoArticuloEmpresa) {
      return res.status(400).json({ message: 'ProveedorCodigo, CodigoArticuloProveedor y CodigoArticuloEmpresa son requeridos' });
    }

    const [relacion, created] = await RelacionArticuloProveedor.upsert(
      {
        ProveedorCodigo,
        CodigoArticuloProveedor,
        CodigoArticuloEmpresa,
        Relacion: Relacion != null ? parseFloat(Relacion) : 1,
        DescripcionProveedor: DescripcionProveedor || null
      },
      { returning: true }
    );

    return res.status(created ? 201 : 200).json(relacion);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al guardar la relación', error: error.message });
  }
};

// Eliminar una relación
exports.delete = async (req, res) => {
  try {
    const { RelacionArticuloProveedor } = req.models;
    const { proveedorCodigo, codigoArticuloProveedor } = req.params;

    if (!proveedorCodigo || !codigoArticuloProveedor) {
      return res.status(400).json({ message: 'proveedorCodigo y codigoArticuloProveedor son requeridos' });
    }

    const deleted = await RelacionArticuloProveedor.destroy({
      where: {
        ProveedorCodigo: proveedorCodigo,
        CodigoArticuloProveedor: codigoArticuloProveedor
      }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Relación no encontrada' });
    }
    return res.status(200).json({ message: 'Relación eliminada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al eliminar la relación' });
  }
};