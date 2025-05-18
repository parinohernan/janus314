const { Op } = require("sequelize");

// Obtener todas las localidades (con filtros y paginación)
exports.getAllLocalidades = async (req, res) => {
  try {
    const { Localidad, Provincia } = req.models;
    const {
      page = 1,
      limit,
      search = "",
      field = "Descripcion",
      order = "ASC",
    } = req.query;

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
    const count = await Localidad.count({ where: whereClause });

    // Configurar opciones de consulta
    const queryOptions = {
      where: whereClause,
      order: [[sortField, sortOrder]],
      include: [
        {
          model: Provincia,
          as: "ProvinciaRelacion",
          attributes: ["Descripcion"],
        },
      ],
    };

    // Aplicar paginación solo si se proporciona un límite
    if (limit) {
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = parseInt((page - 1) * limit);
    }

    // Obtener registros
    const localidades = await Localidad.findAll(queryOptions);

    // Enviar respuesta con metadata de paginación
    return res.status(200).json({
      totalItems: count,
      totalPages: limit ? Math.ceil(count / parseInt(limit)) : 1,
      currentPage: parseInt(page),
      items: localidades,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al obtener las localidades" });
  }
};

// Obtener una localidad por Código
exports.getLocalidadById = async (req, res) => {
  try {
    const { Localidad, Provincia } = req.models;
    const localidad = await Localidad.findByPk(req.params.id, {
      include: [
        {
          model: Provincia,
          as: "ProvinciaRelacion",
          attributes: ["Descripcion"],
        },
      ],
    });

    if (!localidad) {
      return res.status(404).json({ message: "Localidad no encontrada" });
    }

    return res.status(200).json(localidad);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener la localidad" });
  }
};

// Crear nueva localidad
exports.createLocalidad = async (req, res) => {
  try {
    const { Localidad } = req.models;
    const { Codigo, Descripcion, Provincia } = req.body;

    if (!Codigo) {
      return res.status(400).json({ message: "El código es obligatorio" });
    }

    if (!Provincia) {
      return res.status(400).json({ message: "La provincia es obligatoria" });
    }

    const nuevaLocalidad = await Localidad.create({
      Codigo,
      Descripcion,
      Provincia,
    });

    return res.status(201).json(nuevaLocalidad);
  } catch (error) {
    console.error(error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Ya existe una localidad con ese código" });
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res
        .status(400)
        .json({ message: "La provincia seleccionada no existe" });
    }

    return res.status(500).json({ message: "Error al crear la localidad" });
  }
};

// Actualizar localidad
exports.updateLocalidad = async (req, res) => {
  try {
    const { Localidad } = req.models;
    const { Descripcion, Provincia } = req.body;
    const localidad = await Localidad.findByPk(req.params.id);

    if (!localidad) {
      return res.status(404).json({ message: "Localidad no encontrada" });
    }

    await localidad.update({ Descripcion, Provincia });

    return res.status(200).json(localidad);
  } catch (error) {
    console.error(error);

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
exports.deleteLocalidad = async (req, res) => {
  try {
    const { Localidad } = req.models;
    const localidad = await Localidad.findByPk(req.params.id);

    if (!localidad) {
      return res.status(404).json({ message: "Localidad no encontrada" });
    }

    await localidad.destroy();

    return res
      .status(200)
      .json({ message: "Localidad eliminada correctamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar la localidad" });
  }
}; 