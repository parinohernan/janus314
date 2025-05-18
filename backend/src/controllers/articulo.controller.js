const { Op } = require("sequelize");

// Obtener todos los artículos (con filtros y paginación)
exports.getAllArticulos = async (req, res) => {
  try {
    const { Articulo, Proveedor, Rubro } = req.models;
    const {
      page = 1,
      limit = 10,
      search = "",
      field = "Descripcion",
      order = "ASC",
      activo = 1,
      proveedor = "",
      rubro = "",
      proveedores = "",
      rubros = ""
    } = req.query;

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Configurar opciones de búsqueda
    const whereClause = {};
    
    // Filtrar por estado activo/inactivo
    if (parseInt(activo) !== -1) {
      whereClause.Activo = parseInt(activo) === 1 ? 1 : 0;
    }
    
    // Filtrar por proveedor
    if (proveedor) {
      whereClause.ProveedorCodigo = proveedor;
    }
    
    // Filtrar por rubro
    if (rubro) {
      whereClause.RubroCodigo = rubro;
    }

    // Filtrar por múltiples proveedores
    if (proveedores) {
      whereClause.ProveedorCodigo = {
        [Op.in]: proveedores.split(',')
      };
    }

    // Filtrar por múltiples rubros
    if (rubros) {
      whereClause.RubroCodigo = {
        [Op.in]: rubros.split(',')
      };
    }
    
    if (search) {
      whereClause[Op.or] = [
        { Codigo: { [Op.like]: `%${search}%` } },
        { Descripcion: { [Op.like]: `%${search}%` } },
        { CodigoBarras: { [Op.like]: `%${search}%` } }
      ];
    }

    // Validar campo de ordenamiento
    const validFields = ["Codigo", "Descripcion", "PrecioCosto", "Existencia"];
    const sortField = validFields.includes(field) ? field : "Descripcion";

    // Obtener total de registros
    const count = await Articulo.count({ where: whereClause });

    // Obtener registros paginados
    const articulos = await Articulo.findAll({
      where: whereClause,
      order: [[sortField, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Proveedor,
          as: "Proveedor",
          attributes: ["Codigo", "Descripcion"],
          required: false
        },
        {
          model: Rubro,
          as: "Rubro",
          attributes: ["Codigo", "Descripcion"],
          required: false
        }
      ]
    });

    // Calcular páginas totales
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      items: articulos,
      meta: {
        totalItems: count,
        itemsPerPage: parseInt(limit),
        currentPage: parseInt(page),
        totalPages: totalPages
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los artículos" });
  }
};

// Obtener un artículo por Código
exports.getArticuloById = async (req, res) => {
  try {
    const { Articulo, Proveedor, Rubro } = req.models;
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
    const { Articulo } = req.models;
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
    const { Articulo } = req.models;
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
    const articulo = await req.models.Articulo.findByPk(req.params.id);

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

// Asociar código de barras a un artículo
exports.asociarCodigoBarras = async (req, res) => {
  try {
    const { codigoArticulo, codigoBarras } = req.body;

    if (!codigoArticulo || !codigoBarras) {
      return res.status(400).json({
        message: "Se requieren el código del artículo y el código de barras"
      });
    }

    // Buscar el artículo
    const articulo = await req.models.Articulo.findByPk(codigoArticulo);
    if (!articulo) {
      return res.status(404).json({
        message: "Artículo no encontrado"
      });
    }

    // Verificar si el código de barras ya está asociado a otro artículo
    const articuloExistente = await req.models.Articulo.findOne({
      where: {
        CodigoBarras: codigoBarras,
        Codigo: { [Op.ne]: codigoArticulo }
      }
    });

    if (articuloExistente) {
      return res.status(400).json({
        message: `El código de barras ${codigoBarras} ya está asociado al artículo ${articuloExistente.Codigo} - ${articuloExistente.Descripcion}`
      });
    }

    // Actualizar el artículo con el nuevo código de barras
    await articulo.update({ CodigoBarras: codigoBarras });

    return res.status(200).json({
      message: "Código de barras asociado correctamente",
      articulo: {
        Codigo: articulo.Codigo,
        Descripcion: articulo.Descripcion,
        CodigoBarras: codigoBarras
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al asociar el código de barras"
    });
  }
};

// Actualizar precios de artículos
exports.actualizarPrecios = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { articulos, porcentaje } = req.body;

    if (!articulos || !Array.isArray(articulos) || articulos.length === 0) {
      return res.status(400).json({ message: "Debe proporcionar una lista de artículos" });
    }

    if (!porcentaje || isNaN(porcentaje)) {
      return res.status(400).json({ message: "Debe proporcionar un porcentaje válido" });
    }

    // Obtener los artículos a actualizar
    const articulosToUpdate = await req.models.Articulo.findAll({
      where: {
        Codigo: {
          [Op.in]: articulos
        }
      },
      transaction
    });

    // Actualizar cada artículo
    for (const articulo of articulosToUpdate) {
      const precioCosto = articulo.PrecioCosto || 0;
      const nuevoPrecioCosto = precioCosto * (1 + (porcentaje / 100));
      
      await articulo.update({
        PrecioCosto: nuevoPrecioCosto,
        PrecioCostoMasImp: nuevoPrecioCosto * (1 + (articulo.PorcentajeIVA1 || 0) / 100)
      }, { transaction });
    }

    await transaction.commit();

    return res.status(200).json({
      message: "Precios actualizados correctamente",
      articulosActualizados: articulosToUpdate.length
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error al actualizar precios:", error);
    return res.status(500).json({ message: "Error al actualizar los precios" });
  }
};
