const Rubro = require("../models/rubro.model");
const { Op } = require("sequelize");

// Obtener todos los rubros (con filtros y paginación)
exports.getAllRubros = async (req, res) => {
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
    const validFields = ["Codigo", "Descripcion", "RubroGrupoCodigo"];
    const sortField = validFields.includes(field) ? field : "Descripcion";
    const sortOrder = order === "DESC" ? "DESC" : "ASC";

    // Obtener total de registros para metadata de paginación
    const count = await Rubro.count({ where: whereClause });

    // Obtener registros paginados
    const rubros = await Rubro.findAll({
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
      items: rubros,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los rubros" });
  }
};

// Obtener un rubro por Código
exports.getRubroById = async (req, res) => {
  try {
    const rubro = await Rubro.findByPk(req.params.id);
    if (!rubro) {
      return res.status(404).json({ message: "Rubro no encontrado" });
    }
    return res.status(200).json(rubro);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener el rubro" });
  }
};

// Crear nuevo rubro
exports.createRubro = async (req, res) => {
  try {
    const { Codigo, Descripcion, RubroGrupoCodigo } = req.body;

    if (!Codigo) {
      return res.status(400).json({ message: "El código es obligatorio" });
    }

    const nuevoRubro = await Rubro.create({
      Codigo,
      Descripcion,
      RubroGrupoCodigo,
    });

    return res.status(201).json(nuevoRubro);
  } catch (error) {
    console.error(error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Ya existe un rubro con ese código" });
    }

    return res.status(500).json({ message: "Error al crear el rubro" });
  }
};

// Actualizar rubro
exports.updateRubro = async (req, res) => {
  try {
    const { Descripcion, RubroGrupoCodigo } = req.body;
    const rubro = await Rubro.findByPk(req.params.id);

    if (!rubro) {
      return res.status(404).json({ message: "Rubro no encontrado" });
    }

    await rubro.update({ Descripcion, RubroGrupoCodigo });
    return res.status(200).json(rubro);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar el rubro" });
  }
};

// Eliminar rubro
exports.deleteRubro = async (req, res) => {
  try {
    const rubro = await Rubro.findByPk(req.params.id);

    if (!rubro) {
      return res.status(404).json({ message: "Rubro no encontrado" });
    }

    await rubro.destroy(); // Eliminación física en lugar de baja lógica
    return res.status(200).json({ message: "Rubro eliminado correctamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar el rubro" });
  }
};
