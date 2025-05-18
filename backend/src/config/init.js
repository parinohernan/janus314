const masterDB = require('./masterDB');

async function initializeDatabase() {
  try {
    await masterDB.testConnection();
    console.log('Base de datos maestra inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos maestra:', error);
    process.exit(1);
  }
}

module.exports = { initializeDatabase }; 