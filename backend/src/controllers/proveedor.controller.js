const { Op } = require("sequelize");
const sequelize = require("sequelize");

// Obtener todos los proveedores (con filtros y paginación)
exports.getAllProveedores = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      field = "Descripcion",
      order = "ASC",
      activo = "activos", // activos | inactivos | todos
    } = req.query;

    const { Proveedor } = req.models;

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

    // Filtro por estado Activo (acepta activos, 1, true | inactivos, 0, false | todos)
    const activoStr = String(activo).toLowerCase();
    if (activoStr === "activos" || activoStr === "1" || activoStr === "true") {
      whereClause.Activo = true;
    } else if (activoStr === "inactivos" || activoStr === "0" || activoStr === "false") {
      whereClause.Activo = false;
    }
    // "todos" no agrega filtro

    // Validar campo de ordenamiento para evitar inyección SQL
    const validFields = ["Codigo", "Descripcion", "Cuit", "Activo"];
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
      attributes: ["Codigo", "Descripcion", "Activo"],
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
    return res.status(500).json({ message: "Error al obtener los proveedores" });
  }
};

// Obtener cuentas corrientes de proveedores (listado con saldo)
exports.getCuentasCorrientes = async (req, res) => {
  try {
    const { Proveedor } = req.models;
    const {
      page = 1,
      limit = 10,
      search = "",
      field = "Descripcion",
      order = "ASC",
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { Codigo: { [Op.like]: `%${search}%` } },
        { Descripcion: { [Op.like]: `%${search}%` } },
      ];
    }
    // Cuentas corrientes: solo proveedores activos
    whereClause.Activo = true;

    const validFields = ["Codigo", "Descripcion", "Saldo"];
    const sortField = validFields.includes(field) ? field : "Descripcion";
    const sortOrder = order === "DESC" ? "DESC" : "ASC";

    const proveedores = await Proveedor.findAll({
      where: whereClause,
      order: [[sortField, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        "Codigo",
        "Descripcion",
        [sequelize.literal("COALESCE(ImporteDeuda, 0) - COALESCE(SaldoNTCNoAplicado, 0)"), "Saldo"],
      ],
    });

    const total = await Proveedor.count({ where: whereClause });

    return res.status(200).json({
      items: proveedores,
      meta: {
        totalItems: total,
        itemsPerPage: parseInt(limit),
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener cuentas corrientes de proveedores:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las cuentas corrientes",
      error: error.message,
    });
  }
};

// Obtener comprobantes de un proveedor (para detalle de cuenta corriente)
exports.getComprobantesProveedor = async (req, res) => {
  try {
    const {
      Proveedor,
      ComprasCabeza,
      ProveedoresNotaCreditoCabeza,
      ProveedoresNotaDebitoCabeza,
      ProveedoresReciboCabeza,
    } = req.models;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const proveedor = await Proveedor.findByPk(id);
    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    let comprobantes = [];

    const compras = await ComprasCabeza.findAll({
      where: { ProveedorCodigo: id, FechaAnulacion: null },
      attributes: [
        "Fecha",
        "DocumentoTipo",
        "DocumentoSucursal",
        "DocumentoNumero",
        "ImporteTotal",
        "ImportePagado",
      ],
      order: [["Fecha", "DESC"]],
      raw: true,
    });
    comprobantes = comprobantes.concat(
      compras.map((c) => ({
        Fecha: c.Fecha,
        Detalle: `${c.DocumentoTipo} - ${c.DocumentoSucursal} - ${c.DocumentoNumero}`,
        Debitos: c.ImporteTotal,
        Creditos: c.ImportePagado || 0,
        Saldo: (c.ImporteTotal || 0) - (c.ImportePagado || 0),
        TipoComprobante: "COM",
      }))
    );

    const notasCredito = await ProveedoresNotaCreditoCabeza.findAll({
      where: { CodigoProveedor: id, FechaAnulacion: null },
      attributes: [
        "Fecha",
        "DocumentoTipo",
        "DocumentoSucursal",
        "DocumentoNumero",
        "ImporteTotal",
        "ImporteUtilizado",
      ],
      order: [["Fecha", "DESC"]],
      raw: true,
    });
    comprobantes = comprobantes.concat(
      notasCredito.map((n) => ({
        Fecha: n.Fecha,
        Detalle: `${n.DocumentoTipo} - ${n.DocumentoSucursal} - ${n.DocumentoNumero}`,
        Debitos: n.ImporteUtilizado || 0,
        Creditos: n.ImporteTotal,
        Saldo: -(n.ImporteTotal || 0) + (n.ImporteUtilizado || 0),
        TipoComprobante: "NC",
      }))
    );

    const notasDebito = await ProveedoresNotaDebitoCabeza.findAll({
      where: { ProveedorCodigo: id, FechaAnulacion: null },
      attributes: [
        "Fecha",
        "DocumentoTipo",
        "DocumentoSucursal",
        "DocumentoNumero",
        "ImporteTotal",
        "ImportePagado",
      ],
      order: [["Fecha", "DESC"]],
      raw: true,
    });
    comprobantes = comprobantes.concat(
      notasDebito.map((n) => ({
        Fecha: n.Fecha,
        Detalle: `${n.DocumentoTipo} - ${n.DocumentoSucursal} - ${n.DocumentoNumero}`,
        Debitos: n.ImporteTotal || 0,
        Creditos: n.ImportePagado || 0,
        Saldo: (n.ImporteTotal || 0) - (n.ImportePagado || 0),
        TipoComprobante: "ND",
      }))
    );

    const recibos = await ProveedoresReciboCabeza.findAll({
      where: { ProveedorCodigo: id, FechaAnulacion: null },
      attributes: [
        "Fecha",
        "DocumentoTipo",
        "DocumentoSucursal",
        "DocumentoNumero",
        "ImporteTotal",
      ],
      order: [["Fecha", "DESC"]],
      raw: true,
    });
    comprobantes = comprobantes.concat(
      recibos.map((r) => ({
        Fecha: r.Fecha,
        Detalle: `${r.DocumentoTipo} - ${r.DocumentoSucursal} - ${r.DocumentoNumero}`,
        Debitos: 0,
        Creditos: r.ImporteTotal,
        Saldo: -(r.ImporteTotal || 0),
        TipoComprobante: "REC",
      }))
    );

    comprobantes.sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));

    let saldoAcumulado = 0;
    for (let i = comprobantes.length - 1; i >= 0; i--) {
      saldoAcumulado += comprobantes[i].Saldo;
      comprobantes[i].Saldo = saldoAcumulado;
    }

    const totalItems = comprobantes.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedComprobantes = comprobantes.slice(offset, offset + parseInt(limit));

    return res.status(200).json({
      items: paginatedComprobantes,
      meta: {
        totalItems,
        itemsPerPage: parseInt(limit),
        currentPage: parseInt(page),
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error al obtener comprobantes del proveedor:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los comprobantes",
      error: error.message,
    });
  }
};

// Obtener un proveedor por Código
exports.getProveedorById = async (req, res) => {
  try {
    const { Proveedor } = req.models;
    
    const proveedor = await Proveedor.findByPk(req.params.id);

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
    const { Proveedor } = req.models;
    
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
    const { Proveedor } = req.models;
    
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

    return res.status(500).json({ message: "Error al actualizar el proveedor" });
  }
};

// Activar o desactivar proveedor (soft delete)
exports.toggleActivoProveedor = async (req, res) => {
  try {
    const { Proveedor } = req.models;
    const { id } = req.params;
    const { Activo } = req.body;

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    const nuevoEstado = Boolean(Activo);
    await proveedor.update({ Activo: nuevoEstado });

    return res.status(200).json({
      message: nuevoEstado ? "Proveedor activado correctamente" : "Proveedor desactivado correctamente",
      Activo: nuevoEstado,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar el estado del proveedor" });
  }
};
