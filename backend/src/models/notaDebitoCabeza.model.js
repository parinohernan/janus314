const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cliente = require('./cliente.model');
const Vendedor = require('./vendedor.model');

const NotaDebitoCabeza = sequelize.define('NotaDebitoCabeza', {
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
  ClienteCodigo: {
    type: DataTypes.STRING(8),
    allowNull: false,
    references: {
      model: Cliente,
      key: 'Codigo'
    }
  },
  Fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: '0000-00-00'
  },
  ImporteTotal: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  ImportePagado: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  FechaAnulacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  CodigoUsuario: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: ''
  },
  VendedorCodigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '',
    references: {
      model: Vendedor,
      key: 'Codigo'
    }
  },
  ImporteNeto: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: true,
    defaultValue: 0.0000
  },
  ImporteIva1: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: true,
    defaultValue: 0.0000
  },
  gmc_diario_general_numero: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  PlanesDePagoId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  FechaVencimiento: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notadebitocabeza',
  timestamps: false,
  freezeTableName: true
});

// Definir relaciones
NotaDebitoCabeza.belongsTo(Cliente, { 
  foreignKey: 'ClienteCodigo',
  as: 'ClienteRelacion'
});

NotaDebitoCabeza.belongsTo(Vendedor, { 
  foreignKey: 'VendedorCodigo',
  as: 'VendedorRelacion'
});

module.exports = NotaDebitoCabeza; 