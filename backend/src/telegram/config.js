/**
 * Configuración del bot de Telegram
 */
module.exports = {
  // Token del bot - debe configurarse como variable de entorno
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  
  // URL base de la aplicación web
  baseUrl: 'https://janus314.osvi.lat',
  
  // URL de la mini webapp para crear ventas
  webAppUrl: 'https://janus314.osvi.lat/ventas/bot/nueva',
  
  // URL del webhook para recibir actualizaciones de Telegram
  webhookUrl: 'https://janus314.osvi.lat/api/telegram/webhook'
}; 