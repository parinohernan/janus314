const app = require("./app");
const DBManager = require("./utils/DBManager");
const masterDB = require("./config/masterDB");
const { initializeDatabase } = require("./config/init");
// Importar el archivo de asociaciones para definir las relaciones entre modelos
require("./models/associations");

// Puerto
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  try {
    // Inicializar la base de datos maestra
    await initializeDatabase();
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
});

// Manejo de señales para cierre elegante
const gracefulShutdown = async () => {
  console.log('Iniciando cierre elegante del servidor...');
  
  // Cerrar servidor HTTP
  server.close(async () => {
    console.log('Servidor HTTP cerrado.');
    
    try {
      // Cerrar todas las conexiones de base de datos
      await DBManager.shutdown();
      
      // Cerrar conexión maestra
      await masterDB.getConnection().close();
      
      console.log('Todas las conexiones cerradas correctamente.');
      process.exit(0);
    } catch (error) {
      console.error('Error durante el cierre:', error);
      process.exit(1);
    }
  });

  // Si después de 10 segundos no se ha cerrado, forzar cierre
  setTimeout(() => {
    console.error('No se pudo cerrar elegantemente, forzando cierre...');
    process.exit(1);
  }, 10000);
};

// Manejar señales de terminación
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
