const CodigoPostal = require("../models/codigoPostal.model");
const Provincia = require("../models/provincia.model");
const { Op } = require("sequelize");

// Obtener todas las localidades (con filtros y paginación)
exports.getAllCodigosPostales = async (req, res) => {
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
    const validFields = ["Codigo", "Descripcion", "Provincia"];
    const sortField = validFields.includes(field) ? field : "Descripcion";
    const sortOrder = order === "DESC" ? "DESC" : "ASC";

    // Obtener total de registros para metadata de paginación
    const count = await CodigoPostal.count({ where: whereClause });

    // Obtener registros paginados
    const codigosPostales = await CodigoPostal.findAll({
      where: whereClause,
      order: [[sortField, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Provincia,
          as: "ProvinciaRelacion",
          attributes: ["Descripcion"],
        },
      ],
    });

    // Enviar respuesta con metadata de paginación
    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      items: codigosPostales,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al obtener las localidades" });
  }
};

// Obtener una localidad por Código
exports.getCodigoPostalById = async (req, res) => {
  try {
    const codigoPostal = await CodigoPostal.findByPk(req.params.id, {
      include: [
        {
          model: Provincia,
          as: "ProvinciaRelacion",
          attributes: ["Descripcion"],
        },
      ],
    });

    if (!codigoPostal) {
      return res.status(404).json({ message: "Localidad no encontrada" });
    }

    return res.status(200).json(codigoPostal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener la localidad" });
  }
};

// Crear nueva localidad
exports.createCodigoPostal = async (req, res) => {
  try {
    const { Codigo, Descripcion, Provincia } = req.body;

    if (!Codigo) {
      return res.status(400).json({ message: "El código es obligatorio" });
    }

    if (!Provincia) {
      return res.status(400).json({ message: "La provincia es obligatoria" });
    }

    // Ya no verificamos si existe la provincia aquí, dejamos que la constraint
    // de la base de datos se encargue de esto

    const nuevoCodigoPostal = await CodigoPostal.create({
      Codigo,
      Descripcion,
      Provincia,
    });

    return res.status(201).json(nuevoCodigoPostal);
  } catch (error) {
    console.error(error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Ya existe una localidad con ese código" });
    }

    // Capturar error de clave foránea para dar un mensaje adecuado
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res
        .status(400)
        .json({ message: "La provincia seleccionada no existe" });
    }

    return res.status(500).json({ message: "Error al crear la localidad" });
  }
};

// Actualizar localidad
exports.updateCodigoPostal = async (req, res) => {
  try {
    const { Descripcion, Provincia } = req.body;
    const codigoPostal = await CodigoPostal.findByPk(req.params.id);

    if (!codigoPostal) {
      return res.status(404).json({ message: "Localidad no encontrada" });
    }

    // Actualizamos confiando en que la constraint de clave foránea
    // en la base de datos prevendrá asociaciones incorrectas
    await codigoPostal.update({ Descripcion, Provincia });

    return res.status(200).json(codigoPostal);
  } catch (error) {
    console.error(error);

    // Si hay un error de clave foránea, lo manejamos específicamente
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res
        .status(400)
        .json({ message: "La provincia seleccionada no existe" });
    }

    return res
      .status(500)
      .json({ message: "Error al actualizar la localidad" });
  }
};

// Eliminar localidad
exports.deleteCodigoPostal = async (req, res) => {
  try {
    const codigoPostal = await CodigoPostal.findByPk(req.params.id);

    if (!codigoPostal) {
      return res.status(404).json({ message: "Localidad no encontrada" });
    }

    await codigoPostal.destroy();

    return res
      .status(200)
      .json({ message: "Localidad eliminada correctamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar la localidad" });
  }
};
