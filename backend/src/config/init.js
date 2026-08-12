const masterDB = require('./masterDB');
const { ensureWikiTableAndSeed } = require('../models/wikiArticulo.model');

async function initializeDatabase() {
  try {
    await masterDB.testConnection();
  } catch (error) {
    console.error('Error al conectar la base de datos maestra:', error);
    process.exit(1);
  }

  try {
    await ensureWikiTableAndSeed();
  } catch (error) {
    // La wiki no debe impedir el arranque del ERP
    console.error('⚠️ Error al inicializar wiki (se continua el arranque):', error.message || error);
  }

  console.log('Base de datos maestra inicializada correctamente');
}

module.exports = { initializeDatabase }; 