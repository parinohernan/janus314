const { Sequelize } = require('sequelize');
require('dotenv').config();

class MasterDBConnection {
  constructor() {
    if (MasterDBConnection.instance) {
      return MasterDBConnection.instance;
    }

    console.log('=== Datos de conexión base de datos maestra ===');
    console.log('Host:', process.env.EMPRESAS_DB_HOST);
    console.log('Base de datos:', process.env.EMPRESAS_DB_NAME);
    console.log('Usuario:', process.env.EMPRESAS_DB_USER);
    console.log('==========================================');

    this.sequelize = new Sequelize(
      process.env.EMPRESAS_DB_NAME,
      process.env.EMPRESAS_DB_USER,
      process.env.EMPRESAS_DB_PASSWORD,
      {
        host: process.env.EMPRESAS_DB_HOST,
        dialect: 'mysql',
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        logging: false
      }
    );

    MasterDBConnection.instance = this;
  }

  getConnection() {
    return this.sequelize;
  }

  async testConnection() {
    try {
      await this.sequelize.authenticate();
      console.log('✅ Conexión a base de datos maestra establecida correctamente.');
      return true;
    } catch (error) {
      console.error('❌ Error al conectar a la base de datos maestra:', error);
      return false;
    }
  }
}

module.exports = new MasterDBConnection(); 