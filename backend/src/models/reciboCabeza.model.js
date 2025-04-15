const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cliente = require('./cliente.model');
const Usuario = require('./usuario.model');
const Vendedor = require('./vendedor.model');

const ReciboCabeza = sequelize.define('ReciboCabeza', {
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
  Fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  ClienteCodigo: {
    type: DataTypes.STRING(10),
    allowNull: false,
    references: {
      model: Cliente,
      key: 'Codigo'
    }
  },
  ImporteTotal: {
    type: DataTypes.DOUBLE(15, 3),
    allowNull: true,
    defaultValue: 0.000
  },
  FechaAnulacion: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  CodigoUsuario: {
    type: DataTypes.STRING(10),
    allowNull: true,
    references: {
      model: Usuario,
      key: 'Codigo'
    }
  },
  CajaNumero: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  VendedorCodigo: {
    type: DataTypes.STRING(20),
    allowNull: true,
    references: {
      model: Vendedor,
      key: 'Codigo'
    }
  },
  Referencia: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  gmc_diario_general_numero: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'reciboscabeza',
  timestamps: false,
  freezeTableName: true
});

// Definir relaciones
ReciboCabeza.belongsTo(Cliente, {
  foreignKey: 'ClienteCodigo',
  as: 'ClienteRelacion'
});

ReciboCabeza.belongsTo(Usuario, {
  foreignKey: 'CodigoUsuario',
  as: 'UsuarioRelacion'
});

ReciboCabeza.belongsTo(Vendedor, {
  foreignKey: 'VendedorCodigo',
  as: 'VendedorRelacion'
});

module.exports = ReciboCabeza; 