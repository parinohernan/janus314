const sequelize = require("../config/database");
const { Op } = require("sequelize");
const XLSX = require("xlsx");
const multer = require('multer');
const path = require('path');

// Configurar multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(xls|xlsx)$/)) {
      return cb(new Error('Solo se permiten archivos Excel'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
}).single('archivo');

// Obtener todos los artículos para listado de precios (sin paginación)
exports.getAllArticulosForPricing = async (req, res) => {
  try {
    const { Articulo, Proveedor, Rubro } = req.models;
    const {
      activo = 1,
      proveedor = "",
      rubro = "",
      proveedores = "",
      rubros = ""
    } = req.query;

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

    // Obtener todos los registros sin paginación
    const articulos = await Articulo.findAll({
      where: whereClause,
      order: [["RubroCodigo", "ASC"], ["Descripcion", "ASC"]],
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

    return res.status(200).json({
      items: articulos,
      total: articulos.length
    });

  } catch (error) {
    console.error("Error al obtener artículos para listado de precios:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener artículos",
      error: error.message
    });
  }
};

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
  const transaction = await req.db.transaction();
  
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

// Obtener artículos con stock bajo (existencia menor que existenciaMinima)
exports.getStockBajo = async (req, res) => {
  try {
    const { Articulo, Proveedor, Rubro } = req.models;
    const {
      page = 1,
      limit = 10,
      search = "",
      field = "Descripcion",
      order = "ASC",
      proveedor = ""
    } = req.query;

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Configurar opciones de búsqueda
    const whereClause = {
      Activo: 1,
      ExistenciaMinima: { 
        [Op.gt]: 0
      },
      Existencia: {
        [Op.lt]: req.db.col('ExistenciaMinima')
      }
    };
    
    // Filtrar por proveedor si se especifica
    if (proveedor && proveedor !== 'todos') {
      whereClause.ProveedorCodigo = proveedor;
    }
    
    if (search) {
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { Codigo: { [Op.like]: `%${search}%` } },
            { Descripcion: { [Op.like]: `%${search}%` } },
            { CodigoBarras: { [Op.like]: `%${search}%` } }
          ]
        }
      ];
    }

    // Validar campo de ordenamiento
    const validFields = ["Codigo", "Descripcion", "Existencia", "ExistenciaMinima"];
    const sortField = validFields.includes(field) ? field : "Descripcion";

    // Obtener total de registros
    const count = await Articulo.count({ where: whereClause });

    // Obtener registros paginados
    const articulos = await Articulo.findAll({
      attributes: [
        'Codigo', 'Descripcion', 'PrecioCosto', 'Existencia', 
        'ExistenciaMinima', // Añadir este campo explícitamente
        'Activo', 'PorcentajeIVA1', 'Lista1', 'Lista2', 
        'Lista3', 'Lista4', 'Lista5', 'ProveedorCodigo', 'RubroCodigo'
      ],
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
      totalItems: count,
      itemsPerPage: parseInt(limit),
      currentPage: parseInt(page),
      totalPages: totalPages
    });
  } catch (error) {
    console.error("Error al obtener artículos con stock bajo:", error);
    return res.status(500).json({ message: "Error al obtener los artículos con stock bajo" });
  }
};

// Procesar lista de precios desde Excel
exports.procesarListaPrecios = async (req, res) => {
  try {
    const { Articulo } = req.models;
    
    // Log detallado de la solicitud
    console.log('\n=== Inicio de procesamiento de lista de precios ===');
    console.log('Headers completos:', req.headers);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    // Verificar si hay archivo
    if (!req.file) {
      console.log('No se encontró archivo en la solicitud');
      return res.status(400).json({ 
        message: "No se ha proporcionado ningún archivo"
      });
    }

    // Verificar datos del formulario
    const formData = {
      proveedorCodigo: req.body.proveedorCodigo,
      columnaCodigoArticulo: req.body.columnaCodigoArticulo,
      columnaPrecioCosto: req.body.columnaPrecioCosto,
      porcentajeAjuste: req.body.porcentajeAjuste
    };

    console.log('Datos del formulario:', formData);

    // Validar datos requeridos
    if (!formData.proveedorCodigo) {
      return res.status(400).json({ 
        message: "El código de proveedor es requerido"
      });
    }

    if (!formData.columnaCodigoArticulo) {
      return res.status(400).json({ 
        message: "La columna de código de artículo es requerida"
      });
    }

    if (!formData.columnaPrecioCosto) {
      return res.status(400).json({ 
        message: "La columna de precio de costo es requerida"
      });
    }

    let workbook;
    try {
      console.log('Intentando leer archivo Excel desde:', req.file.path);
      workbook = XLSX.readFile(req.file.path);
    } catch (err) {
      console.error('Error al leer archivo Excel:', err);
      return res.status(400).json({ 
        message: "Error al leer el archivo Excel. Asegúrese de que es un archivo Excel válido.",
        error: err.message
      });
    }

    if (!workbook.SheetNames.length) {
      return res.status(400).json({ message: "El archivo Excel no contiene hojas" });
    }

    console.log('Hojas disponibles:', workbook.SheetNames);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const datos = XLSX.utils.sheet_to_json(worksheet);

    if (!datos || datos.length === 0) {
      return res.status(400).json({ message: "El archivo Excel está vacío o no tiene el formato esperado" });
    }

    console.log('Primera fila del Excel:', datos[0]);
    console.log('Columnas disponibles:', Object.keys(datos[0]));

    // Verificar que las columnas existan en el Excel
    if (!datos.length || !(formData.columnaCodigoArticulo in datos[0])) {
      return res.status(400).json({ 
        message: `La columna "${formData.columnaCodigoArticulo}" no existe en el archivo Excel`,
        columnasDisponibles: Object.keys(datos[0])
      });
    }

    if (!(formData.columnaPrecioCosto in datos[0])) {
      return res.status(400).json({ 
        message: `La columna "${formData.columnaPrecioCosto}" no existe en el archivo Excel`,
        columnasDisponibles: Object.keys(datos[0])
      });
    }

    // Obtener los códigos de artículos del Excel
    const codigosArticulos = datos
      .map(row => row[formData.columnaCodigoArticulo]?.toString().trim())
      .filter(Boolean);

    console.log(`Códigos de artículos encontrados: ${codigosArticulos.length}`);

    if (codigosArticulos.length === 0) {
      return res.status(400).json({ message: "No se encontraron códigos de artículos válidos en el archivo" });
    }

    // Buscar artículos en la base de datos usando ProveedorArticuloCodigo
    const articulos = await Articulo.findAll({
      where: {
        ProveedorArticuloCodigo: { [Op.in]: codigosArticulos },
        ProveedorCodigo: formData.proveedorCodigo
      }
    });

    console.log(`Artículos encontrados en la base de datos: ${articulos.length}`);

    if (articulos.length === 0) {
      return res.status(400).json({ 
        message: "No se encontraron artículos en la base de datos que coincidan con los códigos del archivo y el proveedor seleccionado" 
      });
    }

    // Crear mapa de precios del Excel
    const preciosExcel = {};
    datos.forEach(row => {
      const codigo = row[formData.columnaCodigoArticulo]?.toString().trim();
      const precio = parseFloat(row[formData.columnaPrecioCosto]);
      if (codigo && !isNaN(precio)) {
        preciosExcel[codigo] = precio;
      }
    });

    // Preparar lista de artículos para actualizar usando ProveedorArticuloCodigo
    const articulosParaActualizar = articulos.map(articulo => {
      const precioCostoNuevo = preciosExcel[articulo.ProveedorArticuloCodigo];
      const precioCostoAjustado = precioCostoNuevo * (1 + (parseFloat(formData.porcentajeAjuste) || 0) / 100);
      
      return {
        Codigo: articulo.Codigo,
        Descripcion: articulo.Descripcion,
        PrecioCostoActual: articulo.PrecioCosto,
        PrecioCostoNuevo: precioCostoAjustado,
        Incluir: true
      };
    }).filter(a => !isNaN(a.PrecioCostoNuevo));

    console.log(`Artículos preparados para actualizar: ${articulosParaActualizar.length}`);

    if (articulosParaActualizar.length === 0) {
      return res.status(400).json({ message: "No se encontraron precios válidos para actualizar" });
    }

    return res.status(200).json({
      articulos: articulosParaActualizar
    });

  } catch (error) {
    console.error("Error al procesar lista de precios:", error);
    return res.status(500).json({ 
      message: "Error al procesar la lista de precios",
      error: error.message 
    });
  }
};

// Actualizar precios desde lista
exports.actualizarPreciosLista = async (req, res) => {
  try {
    const { Articulo } = req.models;
    // Obtener la conexión de la empresa
    const connection = req.db;
    
    // Crear transacción usando la conexión de la empresa específica
    const transaction = await connection.transaction();
    
    try {
      const { articulos } = req.body;

      if (!articulos || !Array.isArray(articulos) || articulos.length === 0) {
        return res.status(400).json({ message: "Debe proporcionar una lista de artículos" });
      }

      // Actualizar cada artículo
      for (const articuloData of articulos) {
        const articulo = await Articulo.findByPk(articuloData.Codigo, { transaction });
        
        if (articulo) {
          await articulo.update({
            PrecioCosto: articuloData.PrecioCostoNuevo,
            PrecioCostoMasImp: articuloData.PrecioCostoNuevo * (1 + (articulo.PorcentajeIVA1 || 0) / 100)
          }, { transaction });
        }
      }

      await transaction.commit();

      return res.status(200).json({
        message: "Precios actualizados correctamente",
        articulosActualizados: articulos.length
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error al actualizar precios desde lista:", error);
    return res.status(500).json({ message: "Error al actualizar los precios" });
  }
};

// Generar listado de precios en PDF
exports.generarListadoPreciosPDF = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const { empresa, fecha, listaPrecio, mostrarExistencia, articulosPorRubro, rubros, ordenRubros } = req.body;

    // Crear documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 30
    });

    // Configurar headers para PDF
    res.setHeader('Content-Type', 'application/pdf');
    const nombreEmpresa = empresa?.RazonSocial || 'Empresa';
    const nombreArchivo = `${nombreEmpresa}_listade_precios_${fecha}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

    // Pipe el PDF a la respuesta
    doc.pipe(res);
    
    // Configurar fuente para soporte Unicode
    doc.font('Helvetica');

    // Función para obtener precio según lista
    const getPrecioLista = (articulo) => {
      const precioCosto = articulo.PrecioCosto || 0;
      let porcentajeLista = 0;
      
      // Obtener el porcentaje de la lista seleccionada
      switch (listaPrecio) {
        case 1: porcentajeLista = articulo.PorcentajeLista1 || 0; break;
        case 2: porcentajeLista = articulo.PorcentajeLista2 || 0; break;
        case 3: porcentajeLista = articulo.PorcentajeLista3 || 0; break;
        case 4: porcentajeLista = articulo.PorcentajeLista4 || 0; break;
        case 5: porcentajeLista = articulo.PorcentajeLista5 || 0; break;
        default: porcentajeLista = articulo.PorcentajeLista1 || 0; break;
      }
      
      // Calcular precio de lista: precio de costo + porcentaje
      return precioCosto * (1 + porcentajeLista / 100);
    };

    // Función para obtener precio con IVA
    const getPrecioConIva = (articulo) => {
      const precioLista = getPrecioLista(articulo);
      const porcentajeIva = articulo.PorcentajeIVA1 || 21;
      return precioLista * (1 + porcentajeIva / 100);
    };

    // Función para obtener nivel de existencia
    const getNivelExistencia = (articulo) => {
      if (!mostrarExistencia) return '';
      
      const existencia = articulo.Existencia || 0;
      const existenciaMinima = articulo.ExistenciaMinima || 0;
      
      if (existencia === 0) return 'X'; // Sin stock
      if (existencia <= existenciaMinima) return '!'; // Stock bajo
      return 'OK'; // Stock alto
    };

    // Función para obtener nombre del rubro
    const getNombreRubro = (codigo) => {
      if (codigo === 'SIN_RUBRO') return 'Sin Rubro';
      const rubro = rubros.find(r => r.Codigo === codigo);
      return rubro ? rubro.Descripcion : `Rubro ${codigo}`;
    };

    // Encabezado
    doc.fontSize(22).font('Helvetica-Bold').text(empresa?.RazonSocial || 'Empresa', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).font('Helvetica').text(`Listado de Precios - Lista ${listaPrecio}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Fecha: ${fecha}`, { align: 'center' });
    doc.moveDown(2);

    let yPosition = doc.y;
    const pageHeight = doc.page.height - 60;
    const margin = 30;

    // Ordenar rubros según el orden proporcionado
    const rubrosOrdenados = ordenRubros && Array.isArray(ordenRubros) 
      ? ordenRubros.filter(codigo => articulosPorRubro[codigo])
      : Object.keys(articulosPorRubro);

    // Iterar por cada rubro en el orden correcto
    for (const rubroCodigo of rubrosOrdenados) {
      const articulos = articulosPorRubro[rubroCodigo];
      const nombreRubro = getNombreRubro(rubroCodigo);
      
      // Verificar si necesitamos nueva página
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = margin;
      }

      // Título del rubro
      doc.fontSize(16).font('Helvetica-Bold').text(nombreRubro, { ellipsis: true });
      doc.moveDown(0.5);
      // Reposicionar cursor a la izquierda después del título
      doc.x = margin;
    

      // Tabla de artículos
      const tableTop = doc.y;
      const tableLeft = margin;
      const columnWidth = {
        codigo: 70,
        descripcion: 280,
        precioLista: 70,
        precioConIva: 70
      };

      if (mostrarExistencia) {
        columnWidth.existencia = 50;
      }

      // Encabezados de tabla
      doc.fontSize(12).font('Helvetica-Bold');
      let x = tableLeft;
      doc.text('Código', x, tableTop, { width: columnWidth.codigo, ellipsis: true });
      x += columnWidth.codigo;
      doc.text('Descripción', x, tableTop, { width: columnWidth.descripcion, ellipsis: true });
      x += columnWidth.descripcion;
      doc.text('Precio', x, tableTop, { width: columnWidth.precioLista, align: 'right' });
      x += columnWidth.precioLista;
      doc.text('Precio+IVA', x, tableTop, { width: columnWidth.precioConIva, align: 'right' });
      
      if (mostrarExistencia) {
        x += columnWidth.precioConIva;
        doc.text('Stock', x, tableTop, { width: columnWidth.existencia, align: 'center' });
      }

      doc.moveDown(0.5);
      // Reposicionar cursor a la izquierda después de los encabezados
      doc.x = margin;

      // Línea separadora
      doc.strokeColor('#000000').moveTo(tableLeft, doc.y).lineTo(tableLeft + Object.values(columnWidth).reduce((a, b) => a + b, 0), doc.y).stroke();
      doc.moveDown(0.5);
      // Reposicionar cursor a la izquierda después de la línea separadora
      doc.x = margin;

      // Artículos del rubro
      doc.fontSize(11).font('Helvetica');
      
      for (const articulo of articulos) {
        // Verificar si necesitamos nueva página
        if (doc.y > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        const currentY = doc.y;
        x = tableLeft;
        doc.text(articulo.Codigo || '', x, currentY, { width: columnWidth.codigo, ellipsis: true });
        x += columnWidth.codigo;
        doc.text(articulo.Descripcion || '', x, currentY, { width: columnWidth.descripcion, ellipsis: true });
        x += columnWidth.descripcion;
        doc.text(`$${getPrecioLista(articulo).toFixed(2)}`, x, currentY, { width: columnWidth.precioLista, align: 'right' });
        x += columnWidth.precioLista;
        doc.text(`$${getPrecioConIva(articulo).toFixed(2)}`, x, currentY, { width: columnWidth.precioConIva, align: 'right' });
        
        if (mostrarExistencia) {
          x += columnWidth.precioConIva;
          const nivelExistencia = getNivelExistencia(articulo);
          doc.text(nivelExistencia, x, currentY, { width: columnWidth.existencia, align: 'center' });
        }

        // Mover a la siguiente línea sin saltos adicionales
        doc.y = currentY + 15; // Espacio fijo entre líneas
        // Reposicionar cursor a la izquierda
        doc.x = margin;
      }

      doc.moveDown(1);
      yPosition = doc.y;
    }

    // Pie de página
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica').text(`Total de artículos: ${Object.values(articulosPorRubro).flat().length}`, { align: 'center', ellipsis: true });
    doc.moveDown(0.5);
    doc.text(`Generado el ${fecha}`, { align: 'center', ellipsis: true });
    
    // Leyenda de stock si está habilitada
    if (mostrarExistencia) {
      doc.moveDown(1);
      doc.fontSize(10).font('Helvetica').text('Leyenda Stock: OK Alto | ! Bajo | X Sin stock', { align: 'center' });
    }

    // Finalizar PDF
    doc.end();

  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar PDF',
      error: error.message
    });
  }
};
