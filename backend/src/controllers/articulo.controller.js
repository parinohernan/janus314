const Articulo = require("../models/articulo.model");
const Proveedor = require("../models/proveedor.model");
const Rubro = require("../models/rubro.model");
const { Op } = require("sequelize");

// Obtener todos los artículos (con filtros y paginación)
exports.getAllArticulos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      field = "Descripcion",
      order = "ASC",
      activo = 1, // Valor por defecto: solo mostrar activos
    } = req.query;

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Configurar opciones de búsqueda
    const whereClause = {
      Activo: parseInt(activo) === 1 ? 1 : 0, // Filtrar por estado activo/inactivo
    };
    
    if (search) {
      // Permitir búsqueda en múltiples campos
      whereClause[Op.or] = [
        { Codigo: { [Op.like]: `%${search}%` } },
        { Descripcion: { [Op.like]: `%${search}%` } },
        { CodigoBarras: { [Op.like]: `%${search}%` } },
      ];
    }

    // Validar campo de ordenamiento para evitar inyección SQL
    const validFields = ["Codigo", "Descripcion", "PrecioCosto", "Existencia"];
    const sortField = validFields.includes(field) ? field : "Descripcion";
    const sortOrder = order === "DESC" ? "DESC" : "ASC";

    // Obtener total de registros para metadata de paginación de los activos
    const count = await Articulo.count({ where: whereClause });

    // Obtener registros paginados
    const articulos = await Articulo.findAll({
      where: whereClause,
      order: [[sortField, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Proveedor,
          as: "Proveedor",
          attributes: ["Codigo", "Descripcion"],
          required: false, // Hacer la unión LEFT JOIN en lugar de INNER JOIN
        },
        {
          model: Rubro,
          as: "Rubro",
          attributes: ["Codigo", "Descripcion"],
          required: false, // Hacer la unión LEFT JOIN en lugar de INNER JOIN
        },
      ],
      attributes: [
        "Codigo",
        "Descripcion",
        "PrecioCosto",
        "Existencia",
        "Activo",
        "PorcentajeIVA1",
        "Lista1",
        "Lista2",
        "Lista3",
        "Lista4",
        "Lista5",
        "ProveedorCodigo",
        "RubroCodigo",
      ],
      raw: false, // Mantener los objetos Sequelize para poder acceder a los métodos de instancia
    });

    console.log("articulos", articulos);
    
    // Procesar los resultados para manejar valores nulos o por defecto
    const processedArticulos = articulos.map(articulo => {
      const plainArticulo = articulo.get({ plain: true });
      
      // Asegurarse de que los valores numéricos sean números y no nulos
      plainArticulo.PrecioCosto = plainArticulo.PrecioCosto !== null ? plainArticulo.PrecioCosto : 0;
      plainArticulo.Existencia = plainArticulo.Existencia !== null ? plainArticulo.Existencia : 0;
      plainArticulo.Activo = plainArticulo.Activo !== null ? plainArticulo.Activo : 1; // Valor por defecto 1 para Activo
      plainArticulo.PorcentajeIVA1 = plainArticulo.PorcentajeIVA1 !== null ? plainArticulo.PorcentajeIVA1 : 0;
      plainArticulo.Lista1 = plainArticulo.Lista1 !== null ? plainArticulo.Lista1 : 0;
      plainArticulo.Lista2 = plainArticulo.Lista2 !== null ? plainArticulo.Lista2 : 0;
      plainArticulo.Lista3 = plainArticulo.Lista3 !== null ? plainArticulo.Lista3 : 0;
      plainArticulo.Lista4 = plainArticulo.Lista4 !== null ? plainArticulo.Lista4 : 0;
      plainArticulo.Lista5 = plainArticulo.Lista5 !== null ? plainArticulo.Lista5 : 0;
      
      // Asegurarse de que la descripción no sea nula
      plainArticulo.Descripcion = plainArticulo.Descripcion || '';
      
      return plainArticulo;
    });

    // Calcular páginas totales y devolver con metadatos de paginación
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      items: processedArticulos,
      meta: {
        totalItems: count,
        itemsPerPage: parseInt(limit),
        currentPage: parseInt(page),
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los artículos" });
  }
};

// Obtener un artículo por Código
exports.getArticuloById = async (req, res) => {
  try {
    const articulo = await Articulo.findByPk(req.params.id, {
      include: [
        {
          model: Proveedor,
          as: "Proveedor",
          attributes: ["Descripcion"],
        },
        {
          model: Rubro,
          as: "Rubro",
          attributes: ["Descripcion"],
        },
      ],
    });

    if (!articulo) {
      return res.status(404).json({ message: "Artículo no encontrado" });
    }

    return res.status(200).json(articulo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener el artículo" });
  }
};

// Crear nuevo artículo
exports.createArticulo = async (req, res) => {
  try {
    // Validar campos obligatorios
    if (!req.body.Codigo || !req.body.Descripcion) {
      return res.status(400).json({
        message: "Los campos Código y Descripción son obligatorios",
      });
    }

    // Verificar si ya existe un artículo con ese código
    const existingArticulo = await Articulo.findByPk(req.body.Codigo);
    if (existingArticulo) {
      return res.status(400).json({
        message: "Ya existe un artículo con ese código",
      });
    }

    // Procesar los datos para manejar correctamente campos vacíos que son claves foráneas
    const articuloData = { ...req.body };

    // Convertir cadenas vacías a NULL para campos que son claves foráneas
    if (articuloData.ProveedorCodigo === "") {
      articuloData.ProveedorCodigo = null;
    }

    if (articuloData.RubroCodigo === "") {
      articuloData.RubroCodigo = null;
    }

    if (articuloData.FamiliaCodigo === "") {
      articuloData.FamiliaCodigo = null;
    }

    if (articuloData.SubFamiliaCodigo === "") {
      articuloData.SubFamiliaCodigo = null;
    }

    // Crear el artículo con los datos procesados
    const nuevoArticulo = await Articulo.create(articuloData);

    return res.status(201).json(nuevoArticulo);
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

    return res.status(500).json({ message: "Error al crear el artículo" });
  }
};

// Actualizar artículo
exports.updateArticulo = async (req, res) => {
  try {
    // Validar campos obligatorios
    if (!req.body.Descripcion) {
      return res.status(400).json({
        message: "El campo Descripción es obligatorio",
      });
    }

    // Buscar el artículo a actualizar
    const articulo = await Articulo.findByPk(req.params.id);
    if (!articulo) {
      return res.status(404).json({ message: "Artículo no encontrado" });
    }

    // Procesar los datos para manejar correctamente campos vacíos que son claves foráneas
    const articuloData = { ...req.body };

    // Convertir cadenas vacías a NULL para campos que son claves foráneas
    if (articuloData.ProveedorCodigo === "") {
      articuloData.ProveedorCodigo = null;
    }

    if (articuloData.RubroCodigo === "") {
      articuloData.RubroCodigo = null;
    }

    if (articuloData.FamiliaCodigo === "") {
      articuloData.FamiliaCodigo = null;
    }

    if (articuloData.SubFamiliaCodigo === "") {
      articuloData.SubFamiliaCodigo = null;
    }

    // Actualizar los campos con los datos procesados
    await articulo.update(articuloData);

    return res.status(200).json(articulo);
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

    return res.status(500).json({ message: "Error al actualizar el artículo" });
  }
};

// Eliminar artículo
exports.deleteArticulo = async (req, res) => {
  try {
    const articulo = await Articulo.findByPk(req.params.id);

    if (!articulo) {
      return res.status(404).json({ message: "Artículo no encontrado" });
    }

    await articulo.destroy();

    return res
      .status(200)
      .json({ message: "Artículo eliminado correctamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar el artículo" });
  }
};
