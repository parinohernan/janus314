const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const NotaDebitoCabeza = require('./notaDebitoCabeza.model');

const NotaDebitoItem = sequelize.define('NotaDebitoItem', {
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
  Descripcion: {
    type: DataTypes.STRING(254),
    allowNull: false
  },
  Importe: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: true,
    defaultValue: 0.000
  }
}, {
  tableName: 'notadebitoitems',
  timestamps: false,
  freezeTableName: true
});

// Definir relaciones
NotaDebitoItem.belongsTo(NotaDebitoCabeza, {
  foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
  as: 'NotaDebitoCabeza'
});

NotaDebitoCabeza.hasMany(NotaDebitoItem, {
  foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
  as: 'Items'
});

module.exports = NotaDebitoItem; 