const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const Empresa = require('../models/Empresa');

async function migrateCajaTables() {
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'sql', 'create_caja_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Obtener solo la empresa con ID 1
    const empresa = await Empresa.findByPk('1');
    
    if (!empresa) {
      console.error('❌ No se encontró la empresa con ID 1');
      process.exit(1);
    }

    console.log(`\nMigrando tablas de caja para empresa: ${empresa.nombre}`);
    
    try {
      // Crear conexión para esta empresa
      const sequelize = new Sequelize(
        empresa.db_name,
        empresa.db_user,
        empresa.db_password,
        {
          host: empresa.db_host,
          dialect: 'mysql',
          logging: true // Habilitamos logging para ver las queries
        }
      );

      // Probar la conexión
      await sequelize.authenticate();
      console.log('✅ Conexión establecida');

      // Ejecutar el SQL
      const statements = sql.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await sequelize.query(statement);
        }
      }

      console.log('✅ Tablas de caja creadas exitosamente');
      
      // Cerrar la conexión
      await sequelize.close();
      
    } catch (error) {
      console.error(`❌ Error al migrar empresa ${empresa.nombre}:`, error.message);
      if (error.parent) {
        console.error('Detalles del error:', error.parent.message);
      }
    }

    console.log('\n✅ Migración completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar la migración
migrateCajaTables(); 