const { Op } = require("sequelize");
const sequelize = require("sequelize");
const pool = require("../config/database");

// Obtener todos los clientes (con filtros y paginación)
const getAllClientes = async (req, res) => {
  try {
    const { Cliente, CategoriaIva } = req.models;
    const {
      page = 1,
      limit = 10,
      search = "",
      field = "Descripcion",
      order = "ASC",
      Activo,
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

    // Agregar filtro de Activo si se proporciona
    if (Activo !== undefined) {
      whereClause.Activo = Activo;
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
const getClienteById = async (req, res) => {
  try {
    const { Cliente, CategoriaIva } = req.models;
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
const createCliente = async (req, res) => {
  try {
    const { Cliente } = req.models;
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
const updateCliente = async (req, res) => {
  try {
    const { Cliente } = req.models;
    const cliente = await Cliente.findByPk(req.params.id);

    // Validar campos obligatorios
    if (!req.body.Descripcion) {
      return res.status(400).json({
        message: "El campo Descripción es obligatorio",
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
const toggleActivoCliente = async (req, res) => {
  try {
    const { Cliente } = req.models;
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

// Obtener cuentas corrientes de clientes
const getCuentasCorrientes = async (req, res) => {
  try {
    const { Cliente } = req.models;
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

    const validFields = ["Codigo", "Descripcion", "Saldo"];
    const sortField = validFields.includes(field) ? field : "Descripcion";
    const sortOrder = order === "DESC" ? "DESC" : "ASC";

    // Obtener clientes con sus saldos
    const clientes = await Cliente.findAll({
      where: whereClause,
      order: [[sortField, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        "Codigo",
        "Descripcion",
        [sequelize.literal('COALESCE(ImporteDeuda, 0) - COALESCE(SaldoNTCNoAplicado, 0)'), 'Saldo']
      ],
    });

    // Obtener el total de registros para la paginación
    const total = await Cliente.count({ where: whereClause });

    return res.status(200).json({
      items: clientes,
      meta: {
        totalItems: total,
        itemsPerPage: parseInt(limit),
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener cuentas corrientes:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las cuentas corrientes",
      error: error.message,
    });
  }
};

// Obtener comprobantes de un cliente
const getComprobantesCliente = async (req, res) => {
  try {
    const { Cliente, FacturaCabeza, NotaCredito, NotaDebito, Recibo } = req.models;
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Verificar que el cliente existe
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    let comprobantes = [];
    
    // Obtener facturas
    const facturas = await FacturaCabeza.findAll({
      where: { ClienteCodigo: id },
      attributes: [
        'Fecha',
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'ImporteTotal',
        'ImportePagado',
        'PagoTipo'
      ],
      order: [['Fecha', 'DESC']],
      raw: true
    });

    // Formatear facturas
    const facturasFormateadas = facturas.map(factura => ({
      Fecha: factura.Fecha,
      Detalle: `${factura.DocumentoTipo} - ${factura.DocumentoSucursal} - ${factura.DocumentoNumero}`,
      Debitos: factura.ImporteTotal,
      Creditos: factura.ImportePagado,
      Saldo: factura.PagoTipo === 'CC' ? 
        factura.ImporteTotal : 
        (factura.ImporteTotal - factura.ImportePagado),
      TipoComprobante: 'FAC'
    }));

    // Obtener notas de crédito
    const notasCredito = await NotaCredito.findAll({
      where: { CodigoCliente: id },
      attributes: [
        'Fecha',
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'ImporteTotal',
        'ImporteUtilizado'
      ],
      order: [['Fecha', 'DESC']],
      raw: true
    });

    // Formatear notas de crédito
    const notasCreditoFormateadas = notasCredito.map(nota => ({
      Fecha: nota.Fecha,
      Detalle: `${nota.DocumentoTipo} - ${nota.DocumentoSucursal} - ${nota.DocumentoNumero}`,
      Debitos: nota.ImporteUtilizado,
      Creditos: nota.ImporteTotal,
      Saldo: -1 * nota.ImporteTotal + nota.ImporteUtilizado,
      TipoComprobante: 'NC'
    }));

    // Obtener notas de débito
    const notasDebito = await NotaDebito.findAll({
      where: { ClienteCodigo: id },
      attributes: [
        'Fecha',
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'ImporteTotal',
        'ImportePagado'
      ],
      order: [['Fecha', 'DESC']],
      raw: true
    });

    // Formatear notas de débito
    const notasDebitoFormateadas = notasDebito.map(nota => ({
      Fecha: nota.Fecha,
      Detalle: `${nota.DocumentoTipo} - ${nota.DocumentoSucursal} - ${nota.DocumentoNumero}`,
      Debitos: nota.ImporteTotal || 0,
      Creditos: 0,
      Saldo: nota.ImporteTotal || 0,
      TipoComprobante: 'ND'
    }));

    // Obtener recibos
    const recibos = await Recibo.findAll({
      where: { 
        ClienteCodigo: id,
        FechaAnulacion: null
      },
      attributes: [
        'Fecha',
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'ImporteTotal'
      ],
      order: [['Fecha', 'DESC']],
      raw: true
    });

    // Formatear recibos
    const recibosFormateados = recibos.map(recibo => ({
      Fecha: recibo.Fecha,
      Detalle: `${recibo.DocumentoTipo} - ${recibo.DocumentoSucursal} - ${recibo.DocumentoNumero}`,
      Debitos: 0,
      Creditos: recibo.ImporteTotal,
      Saldo: -1 * recibo.ImporteTotal,
      TipoComprobante: 'REC'
    }));

    // Combinar todos los comprobantes
    comprobantes = [
      ...facturasFormateadas,
      ...notasCreditoFormateadas,
      ...notasDebitoFormateadas,
      ...recibosFormateados
    ];

    // Ordenar por fecha descendente
    comprobantes.sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));

    // Calcular saldos acumulados
    let saldoAcumulado = 0;
    for (let i = comprobantes.length - 1; i >= 0; i--) {
      saldoAcumulado += comprobantes[i].Saldo;
      comprobantes[i].Saldo = saldoAcumulado;
    }

    // Implementar paginación
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
        totalPages
      }
    });

  } catch (error) {
    console.error("Error en getComprobantesCliente:", error);
    return res.status(500).json({ 
      message: "Error al obtener los comprobantes del cliente"
    });
  }
};

// Obtener saldo del cliente
const obtenerSaldoCliente = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { FacturaCabeza } = req.models;
    
    // Usar Sequelize para obtener el saldo
    const result = await FacturaCabeza.findOne({
      attributes: [
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', 
              sequelize.literal('ImporteTotal - ImportePagado')
            ),
            0
          ),
          'Saldo'
        ]
      ],
      where: {
        ClienteCodigo: codigo,
        PagoTipo: 'CC'
      }
    });
    
    res.json({
      saldo: result?.getDataValue('Saldo') || 0
    });
  } catch (error) {
    console.error('Error al obtener saldo del cliente:', error);
    res.status(500).json({ 
      error: 'Error al obtener saldo del cliente',
      details: error.message 
    });
  }
};

// Actualizar saldo del cliente
const actualizarSaldoCliente = async (req, res) => {
  try {
    const { Cliente } = req.models;
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Actualizar solo el saldo
    await cliente.update({
      ImporteDeuda: parseFloat(req.body.ImporteDeuda)
    });

    return res.status(200).json(cliente);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar el saldo del cliente" });
  }
};

module.exports = {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  toggleActivoCliente,
  getCuentasCorrientes,
  getComprobantesCliente,
  obtenerSaldoCliente,
  actualizarSaldoCliente
};
