const CategoriaIva = require("../models/categoriaIva.model");
const { Op } = require("sequelize");

// Obtener todas las categorías de IVA
exports.getAllCategoriasIva = async (req, res) => {
  try {
    const { search = "", field = "Descripcion", order = "ASC" } = req.query;

    // Configurar opciones de búsqueda
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { Codigo: { [Op.like]: `%${search}%` } },
        { Descripcion: { [Op.like]: `%${search}%` } },
      ];
    }

    // Validar campo de ordenamiento para evitar inyección SQL
    const validFields = ["Codigo", "Descripcion", "Porcentaje1", "Porcentaje2"];
    const sortField = validFields.includes(field) ? field : "Descripcion";
    const sortOrder = order === "DESC" ? "DESC" : "ASC";

    // Obtener total de registros
    const count = await CategoriaIva.count({ where: whereClause });

    // Obtener registros
    const categoriasIva = await CategoriaIva.findAll({
      where: whereClause,
      order: [[sortField, sortOrder]],
    });

    // Enviar respuesta con metadata
    return res.status(200).json({
      totalItems: count,
      items: categoriasIva,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al obtener las categorías de IVA" });
  }
};

// Obtener una categoría de IVA por código
exports.getCategoriaIvaById = async (req, res) => {
  try {
    const categoriaIva = await CategoriaIva.findByPk(req.params.id);

    if (!categoriaIva) {
      return res
        .status(404)
        .json({ message: "Categoría de IVA no encontrada" });
    }

    return res.status(200).json(categoriaIva);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al obtener la categoría de IVA" });
  }
};

// Crear categoría de IVA
exports.createCategoriaIva = async (req, res) => {
  try {
    const { Codigo, Descripcion, Porcentaje1, Porcentaje2, Documento } =
      req.body;

    // Validar campos obligatorios
    if (!Codigo || !Descripcion) {
      return res.status(400).json({
        message: "Los campos Código y Descripción son obligatorios",
      });
    }

    // Verificar si ya existe una categoría de IVA con ese código
    const categoriaExistente = await CategoriaIva.findByPk(Codigo);
    if (categoriaExistente) {
      return res.status(400).json({
        message: "Ya existe una categoría de IVA con ese código",
      });
    }

    // Crear la categoría de IVA
    const nuevaCategoriaIva = await CategoriaIva.create({
      Codigo,
      Descripcion,
      Porcentaje1,
      Porcentaje2,
      Documento,
    });

    return res.status(201).json(nuevaCategoriaIva);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al crear la categoría de IVA" });
  }
};

// Actualizar categoría de IVA
exports.updateCategoriaIva = async (req, res) => {
  try {
    const { Descripcion, Porcentaje1, Porcentaje2, Documento } = req.body;

    // Validar campos obligatorios
    if (!Descripcion) {
      return res.status(400).json({
        message: "El campo Descripción es obligatorio",
      });
    }

    // Buscar la categoría de IVA a actualizar
    const categoriaIva = await CategoriaIva.findByPk(req.params.id);
    if (!categoriaIva) {
      return res
        .status(404)
        .json({ message: "Categoría de IVA no encontrada" });
    }

    // Actualizar los campos
    await categoriaIva.update({
      Descripcion,
      Porcentaje1,
      Porcentaje2,
      Documento,
    });

    return res.status(200).json(categoriaIva);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al actualizar la categoría de IVA" });
  }
};

// Eliminar categoría de IVA
exports.deleteCategoriaIva = async (req, res) => {
  try {
    const categoriaIva = await CategoriaIva.findByPk(req.params.id);

    if (!categoriaIva) {
      return res
        .status(404)
        .json({ message: "Categoría de IVA no encontrada" });
    }

    await categoriaIva.destroy();

    return res
      .status(200)
      .json({ message: "Categoría de IVA eliminada correctamente" });
  } catch (error) {
    console.error(error);

    // Verificar si es un error de restricción de clave foránea
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        message:
          "No se puede eliminar esta categoría de IVA porque está siendo utilizada por otros registros",
      });
    }

    return res
      .status(500)
      .json({ message: "Error al eliminar la categoría de IVA" });
  }
};
