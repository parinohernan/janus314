const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ReciboCabeza = require('./reciboCabeza.model');

const ReciboItem = sequelize.define('ReciboItem', {
  DocumentoTipo: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: '',
    primaryKey: true
  },
  DocumentoSucursal: {
    type: DataTypes.STRING(4),
    allowNull: false,
    defaultValue: '',
    primaryKey: true
  },
  DocumentoNumero: {
    type: DataTypes.STRING(8),
    allowNull: false,
    defaultValue: '',
    primaryKey: true
  },
  FacturaTipo: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: '',
    primaryKey: true
  },
  FacturaSucursal: {
    type: DataTypes.STRING(4),
    allowNull: false,
    defaultValue: '',
    primaryKey: true
  },
  FacturaNumero: {
    type: DataTypes.STRING(8),
    allowNull: false,
    defaultValue: '',
    primaryKey: true
  },
  ImportePagado: {
    type: DataTypes.DOUBLE(15, 3),
    allowNull: false,
    defaultValue: 0.000
  }
}, {
  tableName: 'recibositems',
  timestamps: false,
  freezeTableName: true
});

// Definir relaciones
ReciboItem.belongsTo(ReciboCabeza, {
  foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
  as: 'ReciboCabeza'
});

ReciboCabeza.hasMany(ReciboItem, {
  foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
  as: 'Items'
});

module.exports = ReciboItem; 