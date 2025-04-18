const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReciboValor = sequelize.define('ReciboValor', {
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
  ValorCodigo: {
    type: DataTypes.STRING(4),
    allowNull: false,
    defaultValue: ''
  },
  ValorFecha: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  ValorSucursal: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  ValorNumero: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  Valorbanco: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  ValorImporte: {
    type: DataTypes.DOUBLE(15, 3),
    allowNull: true
  },
  ChequeCodigo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ValorObservaciones: {
    type: DataTypes.STRING(254),
    allowNull: true
  }
}, {
  tableName: 'recibosvalores',
  timestamps: false,
  freezeTableName: true
});

module.exports = ReciboValor; 