// ***********************************************************
// Este archivo se puede usar para configurar comportamientos
// globales para Cypress, agregar comandos personalizados,
// sobreescribir comandos existentes, etc.
// ***********************************************************

// Import commands.js using ES2015 syntax:
// import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Ignorar ciertos errores no críticos en las pruebas
Cypress.on("uncaught:exception", (err, runnable) => {
  // regresa false para evitar que Cypress falle la prueba
  return false;
});
