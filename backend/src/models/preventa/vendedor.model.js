const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const VendedorPreventa = sequelize.define('VendedorPreventa', {
  Codigo: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  Nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  Telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  Activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 't_vendedores',
  schema: 'db_sis_fac',
  timestamps: false
});

module.exports = VendedorPreventa; 