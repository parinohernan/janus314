const PreventaCabeza = require("../models/preventaCabeza.model");
const PreventaItem = require("../models/preventaItem.model");
const Articulo = require("../models/articulo.model");
const Cliente = require("../models/cliente.model");
const Vendedor = require("../models/vendedor.model");
const Proveedor = require("../models/proveedor.model");
const Rubro = require("../models/rubro.model");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const numerosControlController = require("./numerosControl.controller");

// Obtener listado de preventas con paginación y filtros
exports.listarPreventas = async (req, res) => {
  try {
    // Usar los modelos dinámicos inicializados para esta empresa
    const { PreventaCabeza, Cliente, Vendedor } = req.models;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const tipo = req.query.tipo || null;
    const clienteCodigo = req.query.cliente || null;
    const vendedorCodigo = req.query.vendedor || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;
    const pendientes = req.query.pendientes === "true";

    // Construir condiciones de filtrado
    const whereClause = {};
    if (tipo) whereClause.DocumentoTipo = tipo;
    if (clienteCodigo) whereClause.ClienteCodigo = clienteCodigo;
    if (vendedorCodigo) whereClause.VendedorCodigo = vendedorCodigo;

    // Filtro para preventas pendientes (no anuladas y no facturadas)
    if (pendientes) {
      whereClause.FechaAnulacion = null;
      whereClause.FacturaNumero = null;
    }

    if (fechaDesde && fechaHasta) {
      whereClause.Fecha = {
        [Op.between]: [fechaDesde, fechaHasta],
      };
    } else if (fechaDesde) {
      whereClause.Fecha = {
        [Op.gte]: fechaDesde,
      };
    } else if (fechaHasta) {
      whereClause.Fecha = {
        [Op.lte]: fechaHasta,
      };
    }

    // Consulta con join a cliente y vendedor
    const preventas = await PreventaCabeza.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion", "Localidad", "Telefono"],
        },
        {
          model: Vendedor,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
      attributes: [
        "DocumentoTipo",
        "DocumentoSucursal",
        "DocumentoNumero",
        "Fecha",
        "ClienteCodigo",
        "VendedorCodigo",
        "PagoTipo",
        "ImporteBruto",
        "PorcentajeBonificacion",
        "ImporteBonificado",
        "ImporteNeto",
        "ImporteAdicional",
        "ImporteIva1",
        "ImporteIva2",
        "ImporteTotal",
        "ImportePagado",
        "PorcentajeIva1",
        "PorcentajeIva2",
        "ListaNumero",
        "FechaAnulacion",
        "Observacion",
        "FacturaTipo",
        "FacturaSucursal",
        "FacturaNumero",
        "FechaEntrega",
        "FechaHoraEnvio"
      ],
      order: [
        ["Fecha", "DESC"],
        ["DocumentoSucursal", "DESC"],
        ["DocumentoNumero", "DESC"],
      ],
      limit,
      offset,
    });

    // Calcular total de páginas
    const totalItems = preventas.count;
    const totalPages = Math.ceil(totalItems / limit);

    // Formatear las fechas en los resultados
    const preventasFormateadas = preventas.rows.map(preventa => {
      const preventaJson = preventa.toJSON();
      if (preventaJson.Fecha) {
        const fecha = new Date(preventaJson.Fecha);
        fecha.setHours(fecha.getHours() + 3); // Ajustar a zona horaria local
        preventaJson.Fecha = fecha.toISOString();
      }
      if (preventaJson.FechaHoraEnvio) {
        const fechaEnvio = new Date(preventaJson.FechaHoraEnvio);
        fechaEnvio.setHours(fechaEnvio.getHours() + 3); // Ajustar a zona horaria local
        preventaJson.FechaHoraEnvio = fechaEnvio.toISOString();
      }
      return preventaJson;
    });

    res.status(200).json({
      success: true,
      message: "Preventas obtenidas correctamente",
      data: preventasFormateadas,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Error al listar preventas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener preventas",
      error: error.message,
    });
  }
};

// Obtener detalle de una preventa
exports.obtenerPreventa = async (req, res) => {
  console.log("obtenerPreventa", req.params);
  try {
    // Usar los modelos dinámicos inicializados para esta empresa
    const { PreventaCabeza, PreventaItem, Cliente, Vendedor, Articulo } = req.models;
    
    const { tipo, sucursal, numero } = req.params;

    const preventa = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: Cliente,
          attributes: [
            "Codigo",
            "Descripcion",
            "Calle",
            "Numero",
            "Piso",
            "Departamento",
            "CodigoPostal",
            "Localidad",
            "Telefono",
            "CategoriaIva",
            "Cuit",
          ],
        },
        {
          model: Vendedor,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
    });

    if (!preventa) {
      return res.status(404).json({
        success: false,
        message: "Preventa no encontrada",
      });
    }

    // Obtener ítems de la preventa
    const items = await PreventaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: Articulo,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
      attributes: [
        "DocumentoTipo",
        "DocumentoSucursal",
        "DocumentoNumero",
        "CodigoArticulo",
        "Cantidad",
        "PrecioUnitario",
        "PrecioLista",
        "PorcentajeBonificacion",
      ],
    });

    res.status(200).json({
      success: true,
      message: "Preventa obtenida correctamente",
      data: {
        preventa,
        items,
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de preventa:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle de preventa",
      error: error.message,
    });
  }
};

// Crear nueva preventa
exports.crearPreventa = async (req, res) => {
  // Iniciar transacción
  console.log("crearPreventa", req.body);
  const { PreventaCabeza, PreventaItem, Cliente, Vendedor } = req.models;
  const t = await req.db.transaction();

  try {
    const preventaData = req.body;
    const items = preventaData.Items || [];
    delete preventaData.Items;

    // Validar datos mínimos
    if (
      !preventaData.DocumentoTipo ||
      !preventaData.DocumentoSucursal ||
      !preventaData.ClienteCodigo
    ) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios (tipo, sucursal, cliente)",
      });
    }

    // Obtener nuevo número de control
    preventaData.PagoTipo = "CC";
    try {
      const numeroInfo = await numerosControlController.actualizarNumeroDirecto(
        preventaData.DocumentoTipo,
        preventaData.DocumentoSucursal,
        preventaData.ImporteTotal || 0,
        t,
        req.models
      );
      preventaData.DocumentoNumero = numeroInfo.toString().padStart(8, "0");
    } catch (error) {
      await t.rollback();
      return res.status(500).json({
        success: false,
        message: "Error al obtener número de preventa",
        error: error.message,
      });
    }

    // Establecer fecha si no viene
    if (!preventaData.Fecha) {
      const hoy = new Date();
      hoy.setHours(hoy.getHours() - 3);
      preventaData.Fecha = hoy;
    }
    preventaData.ListaNumero = preventaData.ListaPrecio;
    console.log("preventaData", preventaData);

    // Crear preventa (cabecera)
    const preventaCreada = await PreventaCabeza.create(preventaData, {
      transaction: t,
    });

    // Si hay items, crearlos
    if (items.length > 0) {
      // Preparar los items con las claves de la preventa
      const itemsConClaves = items.map((item) => ({
        ...item,
        DocumentoTipo: preventaCreada.DocumentoTipo,
        DocumentoSucursal: preventaCreada.DocumentoSucursal,
        DocumentoNumero: preventaCreada.DocumentoNumero,
      }));

      await PreventaItem.bulkCreate(itemsConClaves, { transaction: t });
    }

    // Confirmar transacción
    await t.commit();

    // Devolver preventa creada
    const preventaCompleta = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: preventaCreada.DocumentoTipo,
        DocumentoSucursal: preventaCreada.DocumentoSucursal,
        DocumentoNumero: preventaCreada.DocumentoNumero,
      },
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion"],
        },
        {
          model: Vendedor,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Preventa creada correctamente",
      data: preventaCompleta,
    });
  } catch (error) {
    // Aseguramos el rollback en caso de cualquier error
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error("Error al crear preventa:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear preventa",
      error: error.message,
    });
  }
};

// Anular preventa
exports.anularPreventa = async (req, res) => {
  // Usar los modelos dinámicos inicializados para esta empresa
  const { PreventaCabeza } = req.models;
  
  // Iniciar transacción
  const t = await req.db.transaction();
  
  try {
    const { tipo, sucursal, numero } = req.params;

    // Verificar que la preventa existe
    const preventa = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    if (!preventa) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Preventa no encontrada",
      });
    }

    // Verificar que la preventa no está anulada
    if (preventa.FechaAnulacion) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "La preventa ya está anulada",
      });
    }

    // Verificar que la preventa no está facturada
    if (preventa.FacturaNumero) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "No se puede anular una preventa ya facturada",
      });
    }

    // Anular preventa (establecer fecha de anulación)
    preventa.FechaAnulacion = new Date();
    await preventa.save();

    res.status(200).json({
      success: true,
      message: "Preventa anulada correctamente",
      data: preventa,
    });
  } catch (error) {
    console.error("Error al anular preventa:", error);
    res.status(500).json({
      success: false,
      message: "Error al anular preventa",
      error: error.message,
    });
  }
};

// Facturar preventa
exports.facturarPreventa = async (req, res) => {
  // Usar los modelos dinámicos inicializados para esta empresa
  const { PreventaCabeza } = req.models;
  
  // Iniciar transacción
  const t = await req.db.transaction();
  
  try {
    const { tipo, sucursal, numero } = req.params;
    const { facturaTipo, facturaSucursal, facturaNumero } = req.body;

    // Validar datos
    if (!facturaTipo || !facturaSucursal || !facturaNumero) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Faltan datos obligatorios (facturaTipo, facturaSucursal, facturaNumero)",
      });
    }

    // Verificar que la preventa existe
    const preventa = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    if (!preventa) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Preventa no encontrada",
      });
    }

    // Verificar que la preventa no está anulada
    if (preventa.FechaAnulacion) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "No se puede facturar una preventa anulada",
      });
    }

    // Verificar que la preventa no está facturada
    if (preventa.FacturaNumero) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "La preventa ya ha sido facturada",
      });
    }

    // Actualizar datos de facturación
    preventa.FacturaTipo = facturaTipo;
    preventa.FacturaSucursal = facturaSucursal;
    preventa.FacturaNumero = facturaNumero;
    preventa.FechaHoraEnvio = new Date();
    await preventa.save();

    res.status(200).json({
      success: true,
      message: "Preventa facturada correctamente",
      data: preventa,
    });
  } catch (error) {
    console.error("Error al facturar preventa:", error);
    res.status(500).json({
      success: false,
      message: "Error al facturar preventa",
      error: error.message,
    });
  }
};

// Actualizar preventa
exports.actualizarPreventa = async (req, res) => {
  // Usar los modelos dinámicos inicializados para esta empresa
  const { PreventaCabeza, PreventaItem } = req.models;
  
  // Iniciar transacción
  const t = await req.db.transaction();
  
  try {
    const { tipo, sucursal, numero } = req.params;
    const preventaData = req.body;
    const items = preventaData.Items || [];
    delete preventaData.Items;

    // Verificar que la preventa existe
    const preventa = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    if (!preventa) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Preventa no encontrada",
      });
    }

    // Verificar que la preventa no está anulada
    if (preventa.FechaAnulacion) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "No se puede actualizar una preventa anulada",
      });
    }

    // Verificar que la preventa no está facturada
    if (preventa.FacturaNumero) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "No se puede actualizar una preventa ya facturada",
      });
    }

    // Actualizar la cabecera de la preventa
    await PreventaCabeza.update(preventaData, {
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    // Eliminar los items existentes
    await PreventaItem.destroy({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    // Crear los nuevos items
    if (items.length > 0) {
      // Preparar los items con las claves de la preventa
      const itemsConClaves = items.map((item) => ({
        ...item,
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      }));

      await PreventaItem.bulkCreate(itemsConClaves, { transaction: t });
    }

    // Confirmar transacción
    await t.commit();

    // Obtener la preventa actualizada con sus relaciones
    const preventaActualizada = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion"],
        },
        {
          model: Vendedor,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Preventa actualizada correctamente",
      data: preventaActualizada,
    });
  } catch (error) {
    // Aseguramos el rollback en caso de cualquier error
    await t.rollback();
    console.error("Error al actualizar preventa:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar preventa",
      error: error.message,
    });
  }
};

// Nuevo método para obtener resumen de preventas seleccionadas
exports.obtenerResumenPreventas = async (req, res) => {
    try {
        const { preventas, ordenarPor = 'codigo' } = req.body; // Array de objetos con {numero, sucursal} y opción de ordenamiento
        
        console.log('🔍 Datos recibidos en el backend:', req.body);
        console.log('🔍 Array de preventas:', preventas);
        console.log('🔍 Ordenar por:', ordenarPor);
        
        if (!preventas || !Array.isArray(preventas) || preventas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de preventas con número y sucursal'
            });
        }

        // Usar los modelos dinámicos inicializados para esta empresa
        const { PreventaItem, Articulo, PreventaCabeza, Proveedor, Rubro } = req.models;
        
        console.log('🔍 Modelos disponibles:', Object.keys(req.models));
        
        // Primero, vamos a ver qué preventas existen en la base de datos
        const preventasExistentes = await PreventaCabeza.findAll({
            attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
            limit: 10
        });
        
        console.log('🔍 Preventas existentes en la BD (primeras 10):', preventasExistentes.map(p => `${p.DocumentoTipo}-${p.DocumentoSucursal}-${p.DocumentoNumero}`));
        
        // Array para almacenar todos los ítems de las preventas
        let todosLosItems = [];
        let totalPreventas = 0;
        let totalArticulos = 0;

        // Procesar cada preventa
        for (const preventa of preventas) {
            const { numero, sucursal } = preventa;
            
            console.log(`🔍 Buscando preventa: ${sucursal}-${numero}`);
            
            // Primero, verificar si la preventa existe en la tabla cabeza
            const preventaCabeza = await PreventaCabeza.findOne({
                where: {
                    DocumentoNumero: numero,
                    DocumentoSucursal: sucursal
                },
                attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero']
            });
            
            if (preventaCabeza) {
                console.log(`✅ Preventa encontrada en cabeza: ${preventaCabeza.DocumentoTipo}-${preventaCabeza.DocumentoSucursal}-${preventaCabeza.DocumentoNumero}`);
                
                // Ahora buscar los ítems usando el tipo correcto con relaciones
                const items = await PreventaItem.findAll({
                    where: {
                        DocumentoTipo: preventaCabeza.DocumentoTipo,
                        DocumentoSucursal: preventaCabeza.DocumentoSucursal,
                        DocumentoNumero: preventaCabeza.DocumentoNumero
                    },
                    include: [
                        {
                            model: Articulo,
                            attributes: ['Codigo', 'Descripcion', 'RubroCodigo'],
                            include: [
                                {
                                    model: Proveedor,
                                    attributes: ['Codigo', 'Descripcion'],
                                    as: 'Proveedor'
                                },
                                {
                                    model: Rubro,
                                    attributes: ['Codigo', 'Descripcion'],
                                    as: 'Rubro'
                                }
                            ]
                        }
                    ]
                });

                console.log(`🔍 Items encontrados para ${sucursal}-${numero}:`, items.length);

                if (items.length > 0) {
                    totalPreventas++;
                    totalArticulos += items.length;
                    
                    // Convertir a formato plano para procesamiento
                    const itemsPlano = items.map(item => ({
                        CodigoArticulo: item.CodigoArticulo,
                        Cantidad: item.Cantidad,
                        Descripcion: item.Articulo?.Descripcion || 'Sin descripción',
                        ProveedorCodigo: item.Articulo?.Proveedor?.Codigo || '',
                        ProveedorDescripcion: item.Articulo?.Proveedor?.Descripcion || 'Sin proveedor',
                        RubroCodigo: item.Articulo?.Rubro?.Codigo || '',
                        RubroDescripcion: item.Articulo?.Rubro?.Descripcion || 'Sin rubro',
                        DocumentoTipo: preventaCabeza.DocumentoTipo,
                        DocumentoSucursal: preventaCabeza.DocumentoSucursal,
                        DocumentoNumero: preventaCabeza.DocumentoNumero
                    }));
                    
                    console.log(`🔍 Items plano para ${sucursal}-${numero}:`, itemsPlano);
                    
                    todosLosItems.push(...itemsPlano);
                } else {
                    console.log(`⚠️ No se encontraron ítems para la preventa ${sucursal}-${numero}`);
                }
            } else {
                console.log(`❌ Preventa no encontrada en cabeza: ${sucursal}-${numero}`);
            }
        }

        console.log('🔍 Total de items encontrados:', todosLosItems.length);

        // Agrupar ítems por código y sumar cantidades
        const itemsAgrupados = {};
        const preventasPorArticulo = {}; // Contador de preventas por artículo
        
        todosLosItems.forEach(item => {
            const codigo = item.CodigoArticulo;
            if (!itemsAgrupados[codigo]) {
                itemsAgrupados[codigo] = {
                    codigo: codigo,
                    descripcion: item.Descripcion,
                    proveedorCodigo: item.ProveedorCodigo,
                    proveedorDescripcion: item.ProveedorDescripcion,
                    rubroCodigo: item.RubroCodigo,
                    rubroDescripcion: item.RubroDescripcion,
                    cantidad: 0,
                    preventas: new Set() // Usar Set para evitar duplicados
                };
            }
            itemsAgrupados[codigo].cantidad += parseFloat(item.Cantidad) || 0;
            
            // Agregar la preventa actual al Set (se usará para contar preventas únicas)
            const preventaKey = `${item.DocumentoTipo}-${item.DocumentoSucursal}-${item.DocumentoNumero}`;
            itemsAgrupados[codigo].preventas.add(preventaKey);
        });

        // Convertir a array y ordenar según el criterio especificado
        let itemsResumen = Object.values(itemsAgrupados)
            .map(item => ({
                codigo: item.codigo,
                descripcion: item.descripcion,
                proveedorCodigo: item.proveedorCodigo,
                proveedorDescripcion: item.proveedorDescripcion,
                rubroCodigo: item.rubroCodigo,
                rubroDescripcion: item.rubroDescripcion,
                cantidad: item.cantidad,
                preventas: item.preventas.size // Contar preventas únicas
            }));

        // Aplicar ordenamiento según el criterio
        switch (ordenarPor) {
            case 'proveedor':
                itemsResumen.sort((a, b) => {
                    const proveedorA = a.proveedorDescripcion || 'Sin proveedor';
                    const proveedorB = b.proveedorDescripcion || 'Sin proveedor';
                    return proveedorA.localeCompare(proveedorB);
                });
                break;
            case 'rubro':
                itemsResumen.sort((a, b) => {
                    const rubroA = a.rubroDescripcion || 'Sin rubro';
                    const rubroB = b.rubroDescripcion || 'Sin rubro';
                    return rubroA.localeCompare(rubroB);
                });
                break;
            case 'descripcion':
                itemsResumen.sort((a, b) => a.descripcion.localeCompare(b.descripcion));
                break;
            case 'cantidad':
                itemsResumen.sort((a, b) => b.cantidad - a.cantidad); // Mayor cantidad primero
                break;
            default: // 'codigo' por defecto
                itemsResumen.sort((a, b) => a.codigo.localeCompare(b.codigo));
                break;
        }

        // Calcular total de cantidad
        const totalCantidad = itemsResumen.reduce((sum, item) => sum + item.cantidad, 0);

        const resumen = {
            encabezado: {
                cantidadPreventas: totalPreventas,
                cantidadArticulos: totalArticulos,
                totalCantidad: totalCantidad,
                ordenadoPor: ordenarPor
            },
            items: itemsResumen
        };

        console.log('📊 Resumen final:', resumen);

        res.json({
            success: true,
            data: resumen
        });

    } catch (error) {
        console.error('Error al obtener resumen de preventas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};
