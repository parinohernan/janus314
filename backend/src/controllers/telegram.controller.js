const { Telegraf } = require('telegraf');
const config = require('../telegram/config');

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