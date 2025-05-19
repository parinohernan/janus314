const { Telegraf } = require('telegraf');
const config = require('../telegram/config');
const sequelize = require("../config/database");
const FacturaCabeza = require("../models/facturaCabeza.model");
const FacturaItem = require("../models/facturaItem.model");
const Articulo = require("../models/articulo.model");
const Cliente = require("../models/cliente.model");
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
  try {
    const facturaData = req.body;
    console.log("Datos recibidos de Telegram:", facturaData);
    
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
            console.log("===========Telegram en el try:", numeroControl);
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
      
      console.log("===========Telegram desp del try:", facturaData.DocumentoNumero);
      
      // Obtener modelos desde req.models usando los nombres correctos según modelInitializer.js
      const { FacturaCabeza, FacturaItem, Articulo } = req.models;
      
      // Preparar datos para creación de factura
      const facturaCabeza = {
        DocumentoTipo: facturaData.DocumentoTipo,
        DocumentoSucursal: facturaData.DocumentoSucursal,
        DocumentoNumero: facturaData.DocumentoNumero,
        Fecha: facturaData.Fecha,
        ClienteCodigo: facturaData.ClienteCodigo,
        VendedorCodigo: facturaData.Vendedor || '1',
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