const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

// Esta instancia solo se usa para inicialización, las conexiones reales
// se manejan a través de DBManager
const sequelize = new Sequelize(
  process.env.EMPRESAS_DB_NAME,
  process.env.EMPRESAS_DB_USER,
  process.env.EMPRESAS_DB_PASSWORD,
  {
    host: process.env.EMPRESAS_DB_HOST,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '5'),
      min: parseInt(process.env.DB_POOL_MIN || '0'),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000')
    },
    dialectOptions: {
      timezone: "-03:00",
    },
    timezone: "-03:00",
  }
);

console.log('=== Configuración de conexión por defecto ===');
console.log('Host:', process.env.EMPRESAS_DB_HOST);
console.log('Base de datos:', process.env.EMPRESAS_DB_NAME);
console.log('Usuario:', process.env.EMPRESAS_DB_USER);
console.log('=========================================');

module.exports = sequelize;
