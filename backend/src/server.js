const app = require("./app");
const DBManager = require("./utils/DBManager");
const masterDB = require("./config/masterDB");
const { initializeDatabase } = require("./config/init");

// Puerto
const PORT = process.env.PORT || 3000;

// Variable para controlar el estado de cierre
let isShuttingDown = false;

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
const gracefulShutdown = async (signal) => {
  // Evitar múltiples llamadas
  if (isShuttingDown) {
    console.log('Cierre ya en progreso, ignorando señal:', signal);
    return;
  }
  
  isShuttingDown = true;
  console.log(`\n🔄 Iniciando cierre elegante del servidor (señal: ${signal})...`);
  
  // Cerrar servidor HTTP con timeout más corto
  server.close(async () => {
    console.log('✅ Servidor HTTP cerrado.');
    
    try {
      // Cerrar todas las conexiones de base de datos con timeout
      console.log('🔄 Cerrando conexiones de base de datos...');
      await Promise.race([
        DBManager.shutdown(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout cerrando DBManager')), 5000)
        )
      ]);
      
      // Cerrar conexión maestra con timeout
      console.log('🔄 Cerrando conexión maestra...');
      await Promise.race([
        masterDB.getConnection().close(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout cerrando masterDB')), 3000)
        )
      ]);
      
      console.log('✅ Todas las conexiones cerradas correctamente.');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error durante el cierre:', error);
      console.log(' Forzando cierre...');
      process.exit(1);
    }
  });

  // Si después de 5 segundos no se ha cerrado, forzar cierre
  setTimeout(() => {
    if (!isShuttingDown) return; // Ya se cerró
    console.error('⏰ Timeout: No se pudo cerrar elegantemente, forzando cierre...');
    process.exit(1);
  }, 5000);
};

// Manejar señales de terminación
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  gracefulShutdown('unhandledRejection');
});
