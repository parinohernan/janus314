const Provincia = require("../models/provincia.model");
const { Op } = require("sequelize");

// Obtener todas las provincias (con filtros y paginación)
exports.getAllProvincias = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      field = "Descripcion",
      order = "ASC",
    } = req.query;

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Configurar opciones de búsqueda
    const whereClause = {};
    if (search) {
      // Permitir búsqueda en múltiples campos
      whereClause[Op.or] = [
        { Codigo: { [Op.like]: `%${search}%` } },
        { Descripcion: { [Op.like]: `%${search}%` } },
      ];
    }

    // Validar campo de ordenamiento para evitar inyección SQL
    const validFields = ["Codigo", "Descripcion"];
    const sortField = validFields.includes(field) ? field : "Descripcion";
    const sortOrder = order === "DESC" ? "DESC" : "ASC";

    // Obtener total de registros para metadata de paginación
    const count = await Provincia.count({ where: whereClause });

    // Obtener registros paginados
    const provincias = await Provincia.findAll({
      where: whereClause,
      order: [[sortField, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Enviar respuesta con metadata de paginación
    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      items: provincias,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener las provincias" });
  }
};

// Obtener una provincia por Código
exports.getProvinciaById = async (req, res) => {
  try {
    const provincia = await Provincia.findByPk(req.params.id);
    if (!provincia) {
      return res.status(404).json({ message: "Provincia no encontrada" });
    }
    return res.status(200).json(provincia);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener la provincia" });
  }
};

// Crear nueva provincia
exports.createProvincia = async (req, res) => {
  try {
    const { Codigo, Descripcion } = req.body;

    if (!Codigo) {
      return res.status(400).json({ message: "El código es obligatorio" });
    }

    const nuevaProvincia = await Provincia.create({
      Codigo,
      Descripcion,
    });

    return res.status(201).json(nuevaProvincia);
  } catch (error) {
    console.error(error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Ya existe una provincia con ese código" });
    }

    return res.status(500).json({ message: "Error al crear la provincia" });
  }
};

// Actualizar provincia
exports.updateProvincia = async (req, res) => {
  try {
    const { Descripcion } = req.body;
    const provincia = await Provincia.findByPk(req.params.id);

    if (!provincia) {
      return res.status(404).json({ message: "Provincia no encontrada" });
    }

    await provincia.update({ Descripcion });
    return res.status(200).json(provincia);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al actualizar la provincia" });
  }
};

// Eliminar provincia
exports.deleteProvincia = async (req, res) => {
  try {
    const provincia = await Provincia.findByPk(req.params.id);

    if (!provincia) {
      return res.status(404).json({ message: "Provincia no encontrada" });
    }

    await provincia.destroy(); // Eliminación física en lugar de baja lógica
    return res
      .status(200)
      .json({ message: "Provincia eliminada correctamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar la provincia" });
  }
};
