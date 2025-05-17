const { Sequelize } = require('sequelize');
const Empresa = require('../models/Empresa');
const masterDB = require('../config/masterDB');

// Lista de tablas que deben existir en todas las bases de datos
const REQUIRED_TABLES = [
  'usuarios',
  'productos',
  'ventas',
  // Agregar aquí todas las tablas requeridas
];

async function validateSchema(connection, empresaId) {
  const results = {
    empresaId,
    missingTables: [],
    differentColumns: {},
    status: 'pending'
  };

  try {
    // Obtener todas las tablas de la base de datos
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);

    // Verificar tablas faltantes
    REQUIRED_TABLES.forEach(requiredTable => {
      if (!tableNames.includes(requiredTable)) {
        results.missingTables.push(requiredTable);
      }
    });

    // Verificar estructura de cada tabla
    for (const tableName of REQUIRED_TABLES) {
      if (tableNames.includes(tableName)) {
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        results.differentColumns[tableName] = columns;
      }
    }

    results.status = results.missingTables.length === 0 ? 'valid' : 'invalid';
    return results;
  } catch (error) {
    results.status = 'error';
    results.error = error.message;
    return results;
  }
}

async function validateAllSchemas() {
  try {
    // Obtener todas las empresas activas
    const empresas = await Empresa.findAll({
      where: {
        estado: 'activo'
      }
    });

    console.log(`Validando esquemas para ${empresas.length} empresas...`);

    const results = [];
    for (const empresa of empresas) {
      console.log(`\nValidando empresa ${empresa.id} - ${empresa.nombre}`);
      
      try {
        const connection = new Sequelize(
          empresa.db_name,
          empresa.db_user,
          empresa.db_password,
          {
            host: empresa.db_host,
            dialect: 'mysql',
            logging: false
          }
        );

        await connection.authenticate();
        const validation = await validateSchema(connection, empresa.id);
        results.push(validation);

        // Cerrar la conexión después de usarla
        await connection.close();

        // Mostrar resultados para esta empresa
        if (validation.status === 'valid') {
          console.log(`✅ Esquema válido para empresa ${empresa.id}`);
        } else if (validation.status === 'invalid') {
          console.log(`❌ Esquema inválido para empresa ${empresa.id}`);
          console.log('Tablas faltantes:', validation.missingTables);
        } else {
          console.log(`⚠️ Error al validar empresa ${empresa.id}:`, validation.error);
        }
      } catch (error) {
        console.error(`Error al conectar con empresa ${empresa.id}:`, error.message);
        results.push({
          empresaId: empresa.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error al validar esquemas:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  validateAllSchemas()
    .then(results => {
      const valid = results.filter(r => r.status === 'valid').length;
      const invalid = results.filter(r => r.status === 'invalid').length;
      const errors = results.filter(r => r.status === 'error').length;

      console.log('\nResumen de validación:');
      console.log(`✅ Válidos: ${valid}`);
      console.log(`❌ Inválidos: ${invalid}`);
      console.log(`⚠️ Errores: ${errors}`);
      
      process.exit(invalid + errors > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { validateAllSchemas, validateSchema }; 