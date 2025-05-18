const { Op } = require("sequelize");
const sequelize = require("sequelize");

// Obtener todos los clientes (con filtros y paginación)
exports.getAllClientes = async (req, res) => {
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
exports.getClienteById = async (req, res) => {
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
exports.createCliente = async (req, res) => {
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
exports.updateCliente = async (req, res) => {
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
exports.toggleActivoCliente = async (req, res) => {
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
exports.getCuentasCorrientes = async (req, res) => {
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
exports.getComprobantesCliente = async (req, res) => {
  try {
    const { Cliente, Factura, NotaCredito, NotaDebito, Recibo } = req.models;
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Verificar que el cliente existe
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    let comprobantes = [];
    //obtener facturas
    const facturas = await Factura.findAll({
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
      raw: true
    });
    // Formatear los datos de las facturas
    comprobantes = facturas.map(factura => (factura.PagoTipo === 'CC' ? {
      Fecha: factura.Fecha,
      Detalle: `${factura.DocumentoTipo} - ${factura.DocumentoSucursal} - ${factura.DocumentoNumero}`,
      Debitos: factura.ImporteTotal,
      Creditos: 0,
      Saldo: factura.ImporteTotal
    } : {
      Fecha: factura.Fecha,
      Detalle: `${factura.DocumentoTipo} - ${factura.DocumentoSucursal} - ${factura.DocumentoNumero}`,
      Debitos: factura.ImportePagado || 0,
      Creditos: factura.ImporteTotal || 0,
      Saldo: 0
    }));
    //obtener notas de credito
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
      raw: true
    });
    // Formatear los datos de las notas de credito
    const notasCreditoFormateadas = notasCredito.map(nota => ('CO' !== 'CC' ? {//asumo que todass son CC ya que todavia no existe el tipo de pago en las notas de credito
      Fecha: nota.Fecha,
      Detalle: `${nota.DocumentoTipo} - ${nota.DocumentoSucursal} - ${nota.DocumentoNumero}`,
      Debitos: nota.ImporteUtilizado,
      Creditos: nota.ImporteTotal,
      Saldo: -1 * nota.ImporteTotal + nota.ImporteUtilizado
    } : {
      Fecha: nota.Fecha,
      Detalle: `${nota.DocumentoTipo} - ${nota.DocumentoSucursal} - ${nota.DocumentoNumero}`,
      Debitos: nota.ImporteUtilizado,
      Creditos: nota.ImporteTotal + nota.ImporteUtilizado,
      Saldo: 0
    }));

    //obtener notas de debito
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
      raw: true
    });
    // Formatear los datos de las notas de debito
    const notasDebitoFormateadas = notasDebito.map(nota => ({
      Fecha: nota.Fecha,
      Detalle: `${nota.DocumentoTipo} - ${nota.DocumentoSucursal} - ${nota.DocumentoNumero}`,
      Debitos: nota.ImporteTotal || 0,
      Creditos: 0, 
      Saldo: (nota.ImporteTotal || 0) 
    }));
    // obtener los recibos
    const recibos = await Recibo.findAll({
      where: { ClienteCodigo: id ,FechaAnulacion: null},
      attributes: [
        'Fecha',
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'ImporteTotal'
      ],
      raw: true
    });
    // Formatear los datos de los recibos
    const recibosFormateados = recibos.map(recibo => ({
      Fecha: recibo.Fecha,
      Detalle: `${recibo.DocumentoTipo} - ${recibo.DocumentoSucursal} - ${recibo.DocumentoNumero}`,
      Debitos: 0,
      Creditos: recibo.ImporteTotal, 
      Saldo: -1 * recibo.ImporteTotal
    }));
    //agregar recibos,notas de credito y debito al array de comprobantes

    comprobantes = [...comprobantes, ...notasCreditoFormateadas, ...notasDebitoFormateadas, ...recibosFormateados]; 

    //ordenar por fecha descendente
    comprobantes.sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));
    //acumular los saldos, desde el final hasta la primer linea saldo de linea x = saldo (x) + saldo (x+1)
    for (let i = comprobantes.length - 1; i >= 0; i--) {
      if (i < comprobantes.length - 1) {
        comprobantes[i].Saldo = comprobantes[i].Saldo + comprobantes[i + 1].Saldo;
      }
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
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los comprobantes del cliente" });
  }
};
