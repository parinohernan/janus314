const Cliente = require("../models/cliente.model");
const CategoriaIva = require("../models/categoriaIva.model");
const { Op } = require("sequelize");

// Obtener todos los clientes (con filtros y paginación)
exports.getAllClientes = async (req, res) => {
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
        { NombreFantasia: { [Op.like]: `%${search}%` } },
        // { Localidad: { [Op.like]: `%${search}%` } },
      ];
    }

    // Validar campo de ordenamiento para evitar inyección SQL
    const validFields = [
      "Codigo",
      "Descripcion",
      "NombreFantasia",
      "ImporteDeuda",
      "Activo",
      "CategoriaIva",
    ];
    const sortField = validFields.includes(field) ? field : "Descripcion";
    const sortOrder = order === "DESC" ? "DESC" : "ASC";

    // Obtener total de registros para metadata de paginación
    const count = await Cliente.count({ where: whereClause });

    // Obtener registros paginados
    const clientes = await Cliente.findAll({
      where: whereClause,
      order: [[sortField, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: CategoriaIva,
          as: "CategoriaIvaRelacion",
          attributes: ["Descripcion"],
        },
      ],
      attributes: [
        "Codigo",
        "Descripcion",
        "NombreFantasia",
        "Cuit",
        "Telefono",
        "ImporteDeuda",
        "Activo",
        "CategoriaIva",
        "ListaPrecio",
        "CodigoVendedor",
      ],
    });

    // Calcular páginas totales y devolver con metadatos de paginación
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      items: clientes,
      meta: {
        totalItems: count,
        itemsPerPage: parseInt(limit),
        currentPage: parseInt(page),
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los clientes" });
  }
};

// Obtener un cliente por Código
exports.getClienteById = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id, {
      include: [
        {
          model: CategoriaIva,
          as: "CategoriaIvaRelacion",
          attributes: ["Descripcion"],
        },
      ],
    });

    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    return res.status(200).json(cliente);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener el cliente" });
  }
};

// Crear nuevo cliente
exports.createCliente = async (req, res) => {
  try {
    // Validar campos obligatorios
    if (!req.body.Codigo || !req.body.Descripcion) {
      return res.status(400).json({
        message: "Los campos Código y Descripción son obligatorios",
      });
    }

    // Verificar si ya existe un cliente con ese código
    const existingCliente = await Cliente.findByPk(req.body.Codigo);
    if (existingCliente) {
      return res.status(400).json({
        message: "Ya existe un cliente con ese código",
      });
    }

    // Procesar los datos para manejar correctamente campos vacíos que son claves foráneas
    const clienteData = { ...req.body };

    // Convertir cadenas vacías a NULL para campos que son claves foráneas
    if (clienteData.CategoriaIva === "") {
      clienteData.CategoriaIva = null;
    }

    if (clienteData.CodigoVendedor === "") {
      clienteData.CodigoVendedor = null;
    }

    if (clienteData.CondicionVentaCodigo === "") {
      clienteData.CondicionVentaCodigo = null;
    }

    if (clienteData.TransporteCodigo === "") {
      clienteData.TransporteCodigo = null;
    }

    if (clienteData.CanalCodigo === "") {
      clienteData.CanalCodigo = null;
    }

    // Formatear fechas si vienen como cadenas vacías
    if (clienteData.FechaDeAlta === "") {
      clienteData.FechaDeAlta = null;
    }

    if (clienteData.FechaDeBaja === "") {
      clienteData.FechaDeBaja = null;
    }

    // Crear el cliente con los datos procesados
    const nuevoCliente = await Cliente.create(clienteData);

    return res.status(201).json(nuevoCliente);
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

    return res.status(500).json({ message: "Error al crear el cliente" });
  }
};

// Actualizar cliente
exports.updateCliente = async (req, res) => {
  try {
    // Validar campos obligatorios
    if (!req.body.Descripcion) {
      return res.status(400).json({
        message: "El campo Descripción es obligatorio",
      });
    }

    // Buscar el cliente a actualizar
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Procesar los datos para manejar correctamente campos vacíos que son claves foráneas
    const clienteData = { ...req.body };

    // Convertir cadenas vacías a NULL para campos que son claves foráneas
    if (clienteData.CategoriaIva === "") {
      clienteData.CategoriaIva = null;
    }

    if (clienteData.CodigoVendedor === "") {
      clienteData.CodigoVendedor = null;
    }

    if (clienteData.CondicionVentaCodigo === "") {
      clienteData.CondicionVentaCodigo = null;
    }

    if (clienteData.TransporteCodigo === "") {
      clienteData.TransporteCodigo = null;
    }

    if (clienteData.CanalCodigo === "") {
      clienteData.CanalCodigo = null;
    }

    // Formatear fechas si vienen como cadenas vacías
    if (clienteData.FechaDeAlta === "") {
      clienteData.FechaDeAlta = null;
    }

    if (clienteData.FechaDeBaja === "") {
      clienteData.FechaDeBaja = null;
    }

    // Actualizar los campos con los datos procesados
    await cliente.update(clienteData);

    return res.status(200).json(cliente);
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

    return res.status(500).json({ message: "Error al actualizar el cliente" });
  }
};

// Eliminar cliente
exports.toggleActivoCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Cambiar el estado activo (toggle)
    const nuevoEstado = cliente.Activo === 1 ? 0 : 1;

    await cliente.update({ Activo: nuevoEstado });

    return res.status(200).json({
      message:
        nuevoEstado === 1
          ? "Cliente activado correctamente"
          : "Cliente desactivado correctamente",
      activo: nuevoEstado,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al cambiar el estado del cliente" });
  }
};
