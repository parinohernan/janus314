const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CajaResumen = sequelize.define('CajaResumen', {
  Codigo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  CajaCabezaId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  SaldoInicial: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  TotalIngresos: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  TotalEgresos: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  SaldoTeorico: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  FechaHora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'CajaResumen',
  timestamps: false
});

module.exports = CajaResumen; 