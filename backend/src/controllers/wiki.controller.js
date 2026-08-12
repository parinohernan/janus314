const {
  WikiArticulo,
  Op,
  slugify
} = require('../models/wikiArticulo.model');

function esAdmin(req) {
  return req.userData?.userId === 'admin';
}

function mapArticulo(row, { incluirContenido = true } = {}) {
  if (!row) return null;
  const data = row.toJSON ? row.toJSON() : row;
  const base = {
    id: data.id,
    slug: data.slug,
    titulo: data.titulo,
    categoria: data.categoria,
    resumen: data.resumen,
    publicado: data.publicado,
    autor: data.autor,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
  if (incluirContenido) base.contenido = data.contenido;
  return base;
}

exports.listarArticulos = async (req, res) => {
  try {
    const { q, categoria } = req.query;
    const admin = esAdmin(req);

    const where = {};
    if (!admin) where.publicado = true;

    if (categoria) where.categoria = categoria;

    if (q) {
      where[Op.or] = [
        { titulo: { [Op.like]: `%${q}%` } },
        { resumen: { [Op.like]: `%${q}%` } },
        { contenido: { [Op.like]: `%${q}%` } },
        { categoria: { [Op.like]: `%${q}%` } }
      ];
    }

    const articulos = await WikiArticulo.findAll({
      where,
      attributes: [
        'id',
        'slug',
        'titulo',
        'categoria',
        'resumen',
        'publicado',
        'autor',
        'createdAt',
        'updatedAt'
      ],
      order: [
        ['categoria', 'ASC'],
        ['titulo', 'ASC']
      ]
    });

    const categorias = [
      ...new Set(articulos.map((a) => a.categoria).filter(Boolean))
    ].sort();

    res.json({
      success: true,
      data: {
        articulos: articulos.map((a) => mapArticulo(a, { incluirContenido: false })),
        categorias,
        puedeEditar: admin
      }
    });
  } catch (error) {
    console.error('Error al listar wiki:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar artículos de ayuda',
      error: error.message
    });
  }
};

exports.obtenerArticulo = async (req, res) => {
  try {
    const { slug } = req.params;
    const admin = esAdmin(req);

    const where = { slug };
    if (!admin) where.publicado = true;

    const articulo = await WikiArticulo.findOne({ where });
    if (!articulo) {
      return res.status(404).json({
        success: false,
        message: 'Artículo no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        articulo: mapArticulo(articulo),
        puedeEditar: admin
      }
    });
  } catch (error) {
    console.error('Error al obtener artículo wiki:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el artículo',
      error: error.message
    });
  }
};

exports.crearArticulo = async (req, res) => {
  try {
    const { titulo, categoria, resumen, contenido, publicado, slug: slugInput } = req.body;

    if (!titulo || !contenido) {
      return res.status(400).json({
        success: false,
        message: 'Título y contenido son obligatorios'
      });
    }

    let slug = slugify(slugInput || titulo);
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo generar un slug válido'
      });
    }

    const existe = await WikiArticulo.findOne({ where: { slug } });
    if (existe) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const articulo = await WikiArticulo.create({
      slug,
      titulo: titulo.trim(),
      categoria: (categoria || 'General').trim(),
      resumen: resumen?.trim() || null,
      contenido,
      publicado: publicado !== false,
      autor: req.userData?.userId || 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Artículo creado',
      data: mapArticulo(articulo)
    });
  } catch (error) {
    console.error('Error al crear artículo wiki:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el artículo',
      error: error.message
    });
  }
};

exports.actualizarArticulo = async (req, res) => {
  try {
    const { slug } = req.params;
    const articulo = await WikiArticulo.findOne({ where: { slug } });

    if (!articulo) {
      return res.status(404).json({
        success: false,
        message: 'Artículo no encontrado'
      });
    }

    const { titulo, categoria, resumen, contenido, publicado, slug: nuevoSlug } = req.body;

    if (titulo !== undefined) articulo.titulo = String(titulo).trim();
    if (categoria !== undefined) articulo.categoria = String(categoria || 'General').trim();
    if (resumen !== undefined) articulo.resumen = resumen ? String(resumen).trim() : null;
    if (contenido !== undefined) articulo.contenido = contenido;
    if (publicado !== undefined) articulo.publicado = !!publicado;

    if (nuevoSlug && slugify(nuevoSlug) && slugify(nuevoSlug) !== articulo.slug) {
      const candidate = slugify(nuevoSlug);
      const conflicto = await WikiArticulo.findOne({
        where: { slug: candidate, id: { [Op.ne]: articulo.id } }
      });
      if (conflicto) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro artículo con ese slug'
        });
      }
      articulo.slug = candidate;
    }

    await articulo.save();

    res.json({
      success: true,
      message: 'Artículo actualizado',
      data: mapArticulo(articulo)
    });
  } catch (error) {
    console.error('Error al actualizar artículo wiki:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el artículo',
      error: error.message
    });
  }
};

exports.eliminarArticulo = async (req, res) => {
  try {
    const { slug } = req.params;
    const articulo = await WikiArticulo.findOne({ where: { slug } });

    if (!articulo) {
      return res.status(404).json({
        success: false,
        message: 'Artículo no encontrado'
      });
    }

    await articulo.destroy();

    res.json({
      success: true,
      message: 'Artículo eliminado'
    });
  } catch (error) {
    console.error('Error al eliminar artículo wiki:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el artículo',
      error: error.message
    });
  }
};
