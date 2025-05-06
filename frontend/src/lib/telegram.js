/**
 * Biblioteca de utilidades para Telegram WebApp
 */

/**
 * Verifica si la aplicación se está ejecutando dentro de Telegram WebApp
 */
export function isTelegramWebApp() {
  return window.Telegram && window.Telegram.WebApp;
}

/**
 * Obtiene el objeto WebApp de Telegram
 */
export function getTelegramWebApp() {
  if (!isTelegramWebApp()) {
    throw new Error('Esta función solo puede ser usada dentro de Telegram WebApp');
  }
  return window.Telegram.WebApp;
}

/**
 * Obtiene el tema de Telegram WebApp
 */
export function getTelegramTheme() {
  const tg = getTelegramWebApp();
  return {
    backgroundColor: tg.themeParams.bg_color,
    textColor: tg.themeParams.text_color,
    buttonColor: tg.themeParams.button_color,
    buttonTextColor: tg.themeParams.button_text_color,
    linkColor: tg.themeParams.link_color,
    secondaryBgColor: tg.themeParams.secondary_bg_color,
  };
}

/**
 * Obtiene los datos del usuario de Telegram
 */
export function getTelegramUser() {
  const tg = getTelegramWebApp();
  return tg.initDataUnsafe?.user || null;
}

/**
 * Envía datos a la aplicación de Telegram y cierra la WebApp
 */
export function sendDataToTelegram(data) {
  const tg = getTelegramWebApp();
  tg.sendData(JSON.stringify(data));
  setTimeout(() => tg.close(), 1000);
} 