const Proveedor = require("../models/proveedor.model");
const CodigoPostal = require("../models/codigoPostal.model");
const { Op } = require("sequelize");

// Obtener todos los proveedores (con filtros y paginación)
exports.getAllProveedores = async (req, res) => {
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
        { Cuit: { [Op.like]: `%${search}%` } },
      ];
    }

    // Validar campo de ordenamiento para evitar inyección SQL
    const validFields = ["Codigo", "Descripcion", "Cuit"];
    const sortField = validFields.includes(field) ? field : "Descripcion";
    const sortOrder = order === "DESC" ? "DESC" : "ASC";

    // Obtener total de registros para metadata de paginación
    const count = await Proveedor.count({ where: whereClause });

    // Obtener registros paginados
    const proveedores = await Proveedor.findAll({
      where: whereClause,
      order: [[sortField, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: CodigoPostal,
          as: "CodigoPostalRelacion",
          attributes: ["Descripcion"],
        },
      ],
      attributes: ["Codigo", "Descripcion"], // Solo retornamos estos campos para el listado
    });

    // Calcular páginas totales y devolver con metadatos de paginación
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      items: proveedores,
      meta: {
        totalItems: count,
        itemsPerPage: parseInt(limit),
        currentPage: parseInt(page),
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al obtener los proveedores" });
  }
};

// Obtener un proveedor por Código
exports.getProveedorById = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id, {
      include: [
        {
          model: CodigoPostal,
          as: "CodigoPostalRelacion",
          attributes: ["Descripcion", "Provincia"],
        },
      ],
    });

    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    return res.status(200).json(proveedor);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener el proveedor" });
  }
};

// Crear nuevo proveedor
exports.createProveedor = async (req, res) => {
  try {
    // Validar campos obligatorios
    if (!req.body.Codigo || !req.body.Descripcion) {
      return res.status(400).json({
        message: "Los campos Código y Descripción son obligatorios",
      });
    }

    // Verificar si ya existe un proveedor con ese código
    const existingProveedor = await Proveedor.findByPk(req.body.Codigo);
    if (existingProveedor) {
      return res.status(400).json({
        message: "Ya existe un proveedor con ese código",
      });
    }

    // Procesar los datos para manejar correctamente campos vacíos que son claves foráneas
    const proveedorData = { ...req.body };

    // Convertir cadenas vacías a NULL para campos que son claves foráneas
    if (proveedorData.retenciones_generales_codigo === "") {
      proveedorData.retenciones_generales_codigo = null;
    }

    if (proveedorData.CondicionVentaCodigo === "") {
      proveedorData.CondicionVentaCodigo = null;
    }

    if (proveedorData.ProveedorTipoCodigo === "") {
      proveedorData.ProveedorTipoCodigo = null;
    }

    if (proveedorData.CodigoPostal === "") {
      proveedorData.CodigoPostal = null;
    }

    // Crear el proveedor con los datos procesados
    const nuevoProveedor = await Proveedor.create(proveedorData);

    return res.status(201).json(nuevoProveedor);
  } catch (error) {
    console.error(error);

    // Si hay un error de clave foránea, proporcionar un mensaje más específico
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        message: `Error de clave foránea: No existe el valor proporcionado en la tabla ${
          error.table
        } para el campo ${error.fields.join(", ")}`,
      });
    }

    return res.status(500).json({ message: "Error al crear el proveedor" });
  }
};

// Actualizar proveedor
exports.updateProveedor = async (req, res) => {
  try {
    // Validar campos obligatorios
    if (!req.body.Descripcion) {
      return res.status(400).json({
        message: "El campo Descripción es obligatorio",
      });
    }

    // Buscar el proveedor a actualizar
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    // Procesar los datos para manejar correctamente campos vacíos que son claves foráneas
    const proveedorData = { ...req.body };

    // Convertir cadenas vacías a NULL para campos que son claves foráneas
    if (proveedorData.retenciones_generales_codigo === "") {
      proveedorData.retenciones_generales_codigo = null;
    }

    if (proveedorData.CondicionVentaCodigo === "") {
      proveedorData.CondicionVentaCodigo = null;
    }

    if (proveedorData.ProveedorTipoCodigo === "") {
      proveedorData.ProveedorTipoCodigo = null;
    }

    if (proveedorData.CodigoPostal === "") {
      proveedorData.CodigoPostal = null;
    }

    // Actualizar los campos con los datos procesados
    await proveedor.update(proveedorData);

    return res.status(200).json(proveedor);
  } catch (error) {
    console.error(error);

    // Si hay un error de clave foránea, proporcionar un mensaje más específico
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        message: `Error de clave foránea: No existe el valor proporcionado en la tabla ${
          error.table
        } para el campo ${error.fields.join(", ")}`,
      });
    }

    return res
      .status(500)
      .json({ message: "Error al actualizar el proveedor" });
  }
};

// Eliminar proveedor
exports.deleteProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);

    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    await proveedor.destroy();

    return res
      .status(200)
      .json({ message: "Proveedor eliminado correctamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar el proveedor" });
  }
};
