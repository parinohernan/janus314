const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ArticuloPreventa = sequelize.define('ArticuloPreventa', {
  Codigo: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  Descripcion: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  Stock: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  Activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 't_articulos',
  schema: 'db_sis_fac',
  timestamps: false,
  freezeTableName: true
});

module.exports = ArticuloPreventa; 