const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ClientePreventa = sequelize.define('ClientePreventa', {
  Codigo: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  RazonSocial: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Direccion: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  Telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  Email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  Activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 't_clientes',
  schema: 'db_sis_fac',
  timestamps: false
});

module.exports = ClientePreventa; 