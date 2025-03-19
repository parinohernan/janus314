const TipoDePago = require("../models/tipoDePago.model");
const { Op } = require("sequelize");

// Obtener todos los tipos de pago (con filtros y paginación)
exports.getAllTiposDePago = async (req, res) => {
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
    const whereClause = { Activo: true }; // Filtrar solo los activos

    if (search) {
      // Permitir búsqueda en múltiples campos
      whereClause[Op.or] = [
        { Codigo: { [Op.like]: `%${search}%` } },
        { Descripcion: { [Op.like]: `%${search}%` } },
      ];
    }

    // Validar campo de ordenamiento para evitar inyección SQL
    const validFields = [
      "Codigo",
      "Descripcion",
      "recargoPorcentaje",
      "Activo",
      "aplicaSaldo",
    ];
    const sortField = validFields.includes(field) ? field : "Descripcion";
    const sortOrder = order === "DESC" ? "DESC" : "ASC";

    // Obtener total de registros para metadata de paginación
    const count = await TipoDePago.count({ where: whereClause });

    // Obtener registros paginados
    const tiposDePago = await TipoDePago.findAll({
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
      items: tiposDePago,
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Obtener un tipo de pago por Código
exports.getTipoDePagoById = async (req, res) => {
  try {
    const tipoDePago = await TipoDePago.findByPk(req.params.id);
    if (!tipoDePago) {
      return res.status(404).json({ message: "Tipo de pago no encontrado" });
    }
    return res.status(200).json(tipoDePago);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al obtener el tipo de pago" });
  }
};

// Crear nuevo tipo de pago
exports.createTipoDePago = async (req, res) => {
  try {
    const { Codigo, Descripcion, Activo, aplicaSaldo, recargoPorcentaje } =
      req.body;

    if (!Codigo) {
      return res.status(400).json({ message: "El código es obligatorio" });
    }

    const nuevoTipoDePago = await TipoDePago.create({
      Codigo,
      Descripcion,
      Activo,
      aplicaSaldo,
      recargoPorcentaje,
    });

    return res.status(201).json(nuevoTipoDePago);
  } catch (error) {
    console.error(error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Ya existe un tipo de pago con ese código" });
    }

    return res.status(500).json({ message: "Error al crear el tipo de pago" });
  }
};

// Actualizar tipo de pago
exports.updateTipoDePago = async (req, res) => {
  try {
    const { Descripcion, Activo, aplicaSaldo, recargoPorcentaje } = req.body;
    const tipoDePago = await TipoDePago.findByPk(req.params.id);

    if (!tipoDePago) {
      return res.status(404).json({ message: "Tipo de pago no encontrado" });
    }

    await tipoDePago.update({
      Descripcion,
      Activo,
      aplicaSaldo,
      recargoPorcentaje,
    });
    return res.status(200).json(tipoDePago);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al actualizar el tipo de pago" });
  }
};

// Eliminar tipo de pago
exports.deleteTipoDePago = async (req, res) => {
  try {
    const tipoDePago = await TipoDePago.findByPk(req.params.id);

    if (!tipoDePago) {
      return res.status(404).json({ message: "Tipo de pago no encontrado" });
    }

    await tipoDePago.destroy();
    return res
      .status(200)
      .json({ message: "Tipo de pago eliminado correctamente" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al eliminar el tipo de pago" });
  }
};
