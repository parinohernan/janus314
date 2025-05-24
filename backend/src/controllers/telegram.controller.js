const { Telegraf } = require('telegraf');
const config = require('../telegram/config');
const sequelize = require("../config/database");
const FacturaCabeza = require("../models/facturaCabeza.model");
const FacturaItem = require("../models/facturaItem.model");
const Articulo = require("../models/articulo.model");
const Cliente = require("../models/cliente.model");
const Vendedor = require("../models/vendedor.model");
const numerosControlController = require("./numerosControl.controller");
const { Op } = require("sequelize");

// Crear instancia del bot de Telegram
const bot = new Telegraf(config.botToken);

/**
 * Configuración de comandos del bot
 */
bot.command('start', (ctx) => {
  ctx.reply('¡Bienvenido al sistema de ventas de Janus314!', {
    reply_markup: {
      keyboard: [
        [{ text: 'Nueva Venta', web_app: { url: config.webAppUrl } }],
        [{ text: 'Consultar Stock' }],
        [{ text: 'Mis Ventas' }]
      ],
      resize_keyboard: true
    }
  });
});

bot.command('venta', (ctx) => {
  ctx.reply('Crea una nueva venta:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Crear Venta', web_app: { url: config.webAppUrl } }]
      ]
    }
  });
});

bot.command('ayuda', (ctx) => {
  ctx.reply(
    'Comandos disponibles:\n' +
    '/start - Iniciar el bot\n' +
    '/venta - Crear una nueva venta\n' +
    '/stock - Consultar stock de productos\n' +
    '/ayuda - Mostrar este mensaje'
  );
});

// Manejador para mensajes no entendidos
bot.on('message', (ctx) => {
  if (ctx.message.web_app_data) {
    // Procesar datos de la mini webapp
    const data = JSON.parse(ctx.message.web_app_data.data);
    
    // Aquí se procesaría la lógica de negocio con los datos recibidos
    ctx.reply(`Venta registrada correctamente. ID: ${data.id || 'N/A'}`);
  } else {
    ctx.reply('No entiendo ese comando. Usa /ayuda para ver las opciones disponibles.');
  }
});

/**
 * Controlador para procesar webhooks de Telegram
 */
exports.processWebhook = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook de Telegram:', error);
    res.status(500).send('Error al procesar el webhook');
  }
};

/**
 * Inicializar el bot
 */
exports.initBot = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      // Modo polling para desarrollo
      await bot.launch();
      console.log('Bot de Telegram iniciado en modo polling');
    } else {
      // Configurar webhook para producción
      await bot.telegram.setWebhook(config.webhookUrl);
      console.log('Bot de Telegram configurado con webhook:', config.webhookUrl);
    }
  } catch (error) {
    console.error('Error al iniciar el bot de Telegram:', error);
  }
};

/**
 * Enviar notificación a un usuario específico
 */
exports.sendNotification = async (userId, message) => {
  try {
    await bot.telegram.sendMessage(userId, message);
    return true;
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return false;
  }
};

// Endpoint para crear factura desde Telegram
exports.crearFactura = async (req, res) => {
  console.log("===========Telegram en crearFactura:", req.body);
  try {
    const facturaData = req.body;
    console.log("Datos recibidos de Telegram:", facturaData.Vendedor);
    
    // Validar datos mínimos requeridos
    if (!facturaData.ClienteCodigo) {
      return res.status(400).json({ 
        success: false, 
        message: "El código de cliente es obligatorio" 
      });
    }
    
    if (!facturaData.Items || !Array.isArray(facturaData.Items) || facturaData.Items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Debe incluir al menos un artículo" 
      });
    }
    
    // Usar la transacción de la conexión de empresa
    const t = await req.db.transaction();
    
    try {
    // Obtener próximo número de comprobante si no viene
    if (!facturaData.DocumentoNumero || facturaData.DocumentoNumero === "00000000") {
      try {
          // Obtener el próximo número usando el controlador de números de control
          // Si req.services está disponible, usar ese método
          if (req.services && req.services.numeroControlService) {
            const numeroData = await req.services.numeroControlService.obtenerYActualizarNumero(
              facturaData.DocumentoTipo,
              facturaData.DocumentoSucursal
            );
            facturaData.DocumentoNumero = numeroData.numeroFormateado;
          } else {
            // Fallback al método directo
            const numeroControl = await req.db.query(
          "SELECT NumeroProximo FROM t_numeroscontrol WHERE Codigo = ? AND Sucursal = ?",
          {
            replacements: [facturaData.DocumentoTipo, facturaData.DocumentoSucursal],
                type: req.db.QueryTypes.SELECT,
            transaction: t
          }
        );
            // console.log("===========Telegram en el try:", numeroControl);
        if (numeroControl && numeroControl.length > 0) {
          facturaData.DocumentoNumero = numeroControl[0].NumeroProximo.toString().padStart(8, "0");

              // Incrementar el número
              await req.db.query(
                "UPDATE t_numeroscontrol SET NumeroProximo = NumeroProximo + 1 WHERE Codigo = ? AND Sucursal = ?",
                {
                  replacements: [facturaData.DocumentoTipo, facturaData.DocumentoSucursal],
                  type: req.db.QueryTypes.UPDATE,
                  transaction: t
                }
              );
            }
        }
      } catch (error) {
        console.error("Error al obtener próximo número:", error);
          throw error;
      }
    }
      
      console.log("===========Telegram desp del try:", facturaData.Vendedor);
      
      // Obtener modelos desde req.models usando los nombres correctos según modelInitializer.js
      const { FacturaCabeza, FacturaItem, Articulo } = req.models;
      let fechaBsAs = new Date();
      // Ajustar a GMT-3 (Argentina)
      fechaBsAs.setHours(fechaBsAs.getHours() - 3);
      // Establecer al mediodía para evitar problemas con cambios de día
      fechaBsAs.setHours(12, 0, 0, 0);
      fechaBsAs = fechaBsAs.toISOString().split('T')[0];
      
      
    // Preparar datos para creación de factura
    const facturaCabeza = {
      DocumentoTipo: facturaData.DocumentoTipo,
      DocumentoSucursal: facturaData.DocumentoSucursal,
      DocumentoNumero: facturaData.DocumentoNumero,
        Fecha: fechaBsAs,
      ClienteCodigo: facturaData.ClienteCodigo,
        VendedorCodigo: facturaData.Vendedor,
      PagoTipo: facturaData.FormaPagoCodigo || 'CO',
      ImporteBruto: facturaData.ImporteBruto,
      PorcentajeBonificacion: facturaData.PorcentajeBonificacion || 0,
      ImporteBonificado: facturaData.ImporteBonificado || 0,
      ImporteNeto: facturaData.ImporteNeto,
      ImporteAdicional: facturaData.ImporteAdicional || 0,
      ImporteIva1: facturaData.ImporteIva1,
      ImporteIva2: facturaData.ImporteIva2 || 0,
      BaseImponible1: facturaData.BaseImponible1,
      BaseImponible2: facturaData.BaseImponible2 || 0,
      ImporteTotal: facturaData.ImporteTotal,
      ImportePagado: facturaData.ImportePagado || 0,
      PorcentajeIva1: 21,
      PorcentajeIva2: 10.5,
      ListaNumero: facturaData.ListaPrecio || 1,
      Observacion: facturaData.Observacion || '',
      CodigoUsuario: 'admin',
      CajaNumero: facturaData.CajaNumero
    };
    
    // Crear factura cabeza
    const nuevaFactura = await FacturaCabeza.create(facturaCabeza, { transaction: t });
    
    // Crear items de factura
    for (const item of facturaData.Items) {
      // Buscar el artículo en la base de datos
      const articulo = await Articulo.findOne({
        where: { Codigo: item.CodigoArticulo },
        transaction: t
      });
      
      if (!articulo) {
        console.warn(`Artículo no encontrado: ${item.CodigoArticulo}`);
      }
      
      // Crear item de factura
      await FacturaItem.create({
        DocumentoTipo: facturaData.DocumentoTipo,
        DocumentoSucursal: facturaData.DocumentoSucursal,
        DocumentoNumero: facturaData.DocumentoNumero,
        CodigoArticulo: item.CodigoArticulo,
        Cantidad: item.Cantidad,
        PrecioLista: item.PrecioLista || item.PrecioUnitario,
        PorcentajeBonificado: item.PorcentajeBonificado || 0,
        ImporteBonificado: item.ImporteBonificado || 0,
        PrecioUnitario: item.PrecioUnitario,
        ImporteCosto: articulo ? (articulo.PrecioCosto * item.Cantidad) : 0
      }, { transaction: t });
      
      // Actualizar stock si es necesario
      if (articulo) {
        const nuevoStock = Math.max(0, articulo.Existencia - item.Cantidad);
        await articulo.update({ Existencia: nuevoStock }, { transaction: t });
      }
    }
    
    // Confirmar transacción
    await t.commit();
    
    res.status(201).json({
      success: true,
      message: "Factura creada correctamente desde Telegram",
      data: {
        DocumentoTipo: nuevaFactura.DocumentoTipo,
        DocumentoSucursal: nuevaFactura.DocumentoSucursal,
        DocumentoNumero: nuevaFactura.DocumentoNumero,
        ImporteTotal: nuevaFactura.ImporteTotal
      }
    });
    
  } catch (error) {
    await t.rollback();
      console.error("Error al crear factura desde Telegram:", error);
      throw error;
    }
    
  } catch (error) {
    console.error("Error al crear factura desde Telegram:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear factura desde Telegram",
      error: error.message
    });
  }
};

// Endpoint para obtener datos básicos
exports.obtenerDatos = async (req, res) => {
  try {
    const { ConfiguracionService, ClienteService, ArticuloService } = req.services || {};
    
    // Verificar si tenemos acceso a los servicios necesarios
    if (!ConfiguracionService) {
      // Fallback al método antiguo si los servicios no están disponibles
      return obtenerDatosDirecto(req, res);
    }
    
    // Obtener la sucursal actual usando el servicio de configuración
    const configData = await ConfiguracionService.obtenerConfiguracion('SUCURSAL');
    const sucursal = configData?.valor || '0001';
    
    // Obtener las listas de precios
    const listasPrecio = [];
    for (let i = 1; i <= 5; i++) {
      listasPrecio.push({
        id: i.toString(),
        nombre: `Lista ${i}`
      });
    }
    
    // Obtener datos adicionales para el contexto del bot
    let clientesActivos = 0;
    let articulosActivos = 0;
    
    if (ClienteService) {
      const clientesData = await ClienteService.obtenerClientes({
        page: 1,
        limit: 1,
        Activo: true
      });
      clientesActivos = clientesData?.meta?.totalItems || 0;
    }
    
    if (ArticuloService) {
      const articulosData = await ArticuloService.obtenerArticulos({
        page: 1,
        limit: 1,
        Activo: true
      });
      articulosActivos = articulosData?.meta?.totalItems || 0;
    }
    
    res.json({
      success: true,
      data: {
        sucursal: sucursal,
        listasPrecio: listasPrecio,
        stats: {
          clientesActivos,
          articulosActivos
        }
      }
    });
    
  } catch (error) {
    console.error("Error al obtener datos básicos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos básicos",
      error: error.message
    });
  }
};

// Método de fallback utilizando consultas directas
const obtenerDatosDirecto = async (req, res) => {
  try {
    // Obtener la sucursal actual
    const sucursal = await sequelize.query(
      "SELECT ValorConfig FROM configuracion WHERE NombreConfig = 'SUCURSAL'",
      {
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    // Obtener las listas de precios
    const listasPrecio = [];
    for (let i = 1; i <= 5; i++) {
      listasPrecio.push({
        id: i.toString(),
        nombre: `Lista ${i}`
      });
    }
    
    res.json({
      success: true,
      data: {
        sucursal: (sucursal && sucursal.length > 0) ? sucursal[0].ValorConfig : '0001',
        listasPrecio: listasPrecio
      }
    });
    
  } catch (error) {
    console.error("Error al obtener datos básicos (fallback):", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos básicos",
      error: error.message
    });
  }
};

// Endpoint para crear o actualizar un producto desde Telegram
exports.crearProducto = async (req, res) => {
  try {
    const productoData = req.body;
    console.log("Datos de producto recibidos de Telegram:", productoData);
    
    // Validar datos mínimos requeridos
    if (!productoData.Descripcion) {
      return res.status(400).json({ 
        success: false, 
        message: "La descripción del producto es obligatoria" 
      });
    }
    
    // Usar la transacción de la conexión de empresa
    const t = await req.db.transaction();
    
    try {
      // Obtener modelo desde req.models
      const { Articulo } = req.models;
      
      // Generar código automático si no viene
      if (!productoData.Codigo) {
        try {
          // Buscar la configuración de último código de artículo
          // Usar una consulta directa ya que puede haber diferencias en el modelo
          const configUltimoCodigo = await req.db.query(
            "SELECT Codigo, ValorConfig FROM t_configuracion WHERE Codigo = 'ART_ULTIMO_CODIGO'",
            {
              type: req.db.QueryTypes.SELECT,
              transaction: t
            }
          );
          
          let nuevoCodigo;
          
          if (configUltimoCodigo && configUltimoCodigo.length > 0 && configUltimoCodigo[0].ValorConfig) {
            // Incrementar el último código
            const ultimoCodigo = parseInt(configUltimoCodigo[0].ValorConfig, 10);
            nuevoCodigo = ultimoCodigo + 1;
            productoData.Codigo = nuevoCodigo.toString().padStart(6, '0');
            
            // Actualizar la configuración con el nuevo valor
            await req.db.query(
              "UPDATE t_configuracion SET ValorConfig = ? WHERE Codigo = 'ART_ULTIMO_CODIGO'",
              {
                replacements: [nuevoCodigo.toString()],
                type: req.db.QueryTypes.UPDATE,
                transaction: t
              }
            );
          } else {
            // Si no existe la configuración o está vacía, buscar en la tabla de artículos
            const ultimoArticulo = await Articulo.findOne({
              order: [['Codigo', 'DESC']],
              transaction: t
            });
            
            if (ultimoArticulo) {
              // Incrementar el último código
              const ultimoCodigo = parseInt(ultimoArticulo.Codigo, 10);
              nuevoCodigo = ultimoCodigo + 1;
              productoData.Codigo = nuevoCodigo.toString().padStart(6, '0');
            } else {
              // Si no hay artículos, empezar desde 1
              nuevoCodigo = 1;
              productoData.Codigo = '000001';
            }
            
            // Crear la configuración si no existía
            if (!configUltimoCodigo || configUltimoCodigo.length === 0) {
              await req.db.query(
                "INSERT INTO t_configuracion (Codigo, ValorConfig, Descripcion) VALUES (?, ?, ?)",
                {
                  replacements: ['ART_ULTIMO_CODIGO', nuevoCodigo.toString(), 'Último código de artículo utilizado'],
                  type: req.db.QueryTypes.INSERT,
                  transaction: t
                }
              );
            }
          }
          
          console.log(`Nuevo código de artículo generado: ${productoData.Codigo}`);
        } catch (error) {
          console.error("Error al generar código automático:", error);
          throw error;
        }
      }
      
      // Preparar datos para creación de producto
      const articuloData = {
        Codigo: productoData.Codigo,
        Descripcion: productoData.Descripcion,
        CodigoBarras: productoData.CodigoBarras || '',
        ProveedorArticuloCodigo: productoData.CodigoProveedor || '',
        ProveedorCodigo: productoData.ProveedorCodigo || null,
        RubroCodigo: productoData.RubroCodigo || null,
        Existencia: Number(productoData.ExistenciaActual || 0),
        ExistenciaMinima: Number(productoData.ExistenciaMinima || 0),
        ExistenciaMaxima: Number(productoData.ExistenciaMaxima || 0),
        UbicacionDeposito: productoData.UbicacionDeposito || '',
        Peso: Number(productoData.Peso || 0),
        UnidadVenta: productoData.UnidadVenta || 'u',
        PrecioCosto: Number(productoData.PrecioCostoSinIva || productoData.PrecioCosto || 0),
        PrecioCostoMasImp: Number(productoData.PrecioCostoMasImp || productoData.PrecioCostoConIva || 0),
        PorcentajeIVA1: Number(productoData.PorcentajeIVA1 || productoData.PorcentajeIva1 || 21),
        PorcentajeIVA2: Number(productoData.PorcentajeIVA2 || productoData.PorcentajeIva2 || 0),
        Lista1: Number(productoData.PrecioLista1 || 0),
        Lista2: Number(productoData.PrecioLista2 || 0),
        Lista3: Number(productoData.PrecioLista3 || 0),
        Lista4: Number(productoData.PrecioLista4 || 0),
        Lista5: Number(productoData.PrecioLista5 || 0),
        PorcentajeVendedor: Number(productoData.PorcentajeVendedor || 0),
        Activo: 1
      };
      
      // Log para depuración
      console.log("Datos a guardar en la base de datos:", JSON.stringify(articuloData, null, 2));
      
      // Verificar si el producto ya existe
      const productoExistente = await Articulo.findOne({
        where: { Codigo: productoData.Codigo },
        transaction: t
      });
      
      let nuevoProducto;
      
      if (productoExistente) {
        // Actualizar producto existente
        await productoExistente.update(articuloData, { transaction: t });
        nuevoProducto = productoExistente;
      } else {
        // Crear nuevo producto utilizando una consulta SQL directa para asegurar que todos los campos se incluyan
        // Esta es una solución alternativa en caso de que el modelo Sequelize no tenga todos los campos
        await req.db.query(
          `INSERT INTO t_articulos (
            Codigo, Descripcion, CodigoBarras, ProveedorCodigo, ProveedorArticuloCodigo, RubroCodigo,
            Existencia, ExistenciaMinima, ExistenciaMaxima, UbicacionDeposito,
            Peso, UnidadVenta, PrecioCosto, PrecioCostoMasImp, 
            PorcentajeIVA1, PorcentajeIVA2, Lista1, Lista2, Lista3, Lista4, Lista5,
            PorcentajeVendedor, Activo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              articuloData.Codigo, 
              articuloData.Descripcion, 
              articuloData.CodigoBarras,
              articuloData.ProveedorCodigo, 
              articuloData.ProveedorArticuloCodigo,
              articuloData.RubroCodigo,
              articuloData.Existencia, 
              articuloData.ExistenciaMinima, 
              articuloData.ExistenciaMaxima,
              articuloData.UbicacionDeposito, 
              articuloData.Peso, 
              articuloData.UnidadVenta,
              articuloData.PrecioCosto, 
              articuloData.PrecioCostoMasImp,
              articuloData.PorcentajeIVA1, 
              articuloData.PorcentajeIVA2,
              articuloData.Lista1, 
              articuloData.Lista2, 
              articuloData.Lista3, 
              articuloData.Lista4, 
              articuloData.Lista5,
              articuloData.PorcentajeVendedor, 
              articuloData.Activo
            ],
            type: req.db.QueryTypes.INSERT,
            transaction: t
          }
        );
        
        // Recuperar el artículo recién creado
        nuevoProducto = await Articulo.findOne({
          where: { Codigo: articuloData.Codigo },
          transaction: t
        });
      }
      
      // Confirmar transacción
      await t.commit();
      
      res.status(201).json({
        success: true,
        message: productoExistente ? "Producto actualizado correctamente" : "Producto creado correctamente",
        data: {
          Codigo: nuevoProducto.Codigo,
          Descripcion: nuevoProducto.Descripcion
        }
      });
      
    } catch (error) {
      await t.rollback();
      console.error("Error al crear/actualizar producto desde Telegram:", error);
      throw error;
    }
    
  } catch (error) {
    console.error("Error al crear/actualizar producto desde Telegram:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear/actualizar producto desde Telegram",
      error: error.message
    });
  }
}; 