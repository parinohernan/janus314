const { Model, DataTypes } = require('sequelize');
const masterDB = require('../config/masterDB');

class Empresa extends Model {}

Empresa.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  db_host: {
    type: DataTypes.STRING,
    allowNull: false
  },
  db_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  db_user: {
    type: DataTypes.STRING,
    allowNull: false
  },
  db_password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo',
    allowNull: false
  }
}, {
  sequelize: masterDB.getConnection(),
  modelName: 'Empresa',
  tableName: 'empresas',
  timestamps: true
});

module.exports = Empresa; 