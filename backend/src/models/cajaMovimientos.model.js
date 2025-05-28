const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CajaMovimientos = sequelize.define(
  "CajaMovimientos",
  {
    Codigo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    CajaCabezaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'caja_cabeza',
        key: 'Codigo'
      }
    },
    Tipo: {
      type: DataTypes.ENUM('ingreso', 'egreso'),
      allowNull: false
    },
    Importe: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    Concepto: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    MetodoPago: {
      type: DataTypes.STRING(3),
      allowNull: false,
      references: {
        model: 't_tiposdepago',
        key: 'Codigo'
      }
    },
    Referencia: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    Banco: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ValorFecha: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    DocumentoAsociado: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    TipoDocumento: {
      type: DataTypes.ENUM('factura', 'recibo', 'nota_credito', 'gasto', 'otros'),
      allowNull: true
    },
    FechaHora: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    UsuarioId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 't_vendedores',
        key: 'Codigo'
      }
    }
  },
  {
    tableName: "caja_movimientos",
    timestamps: true
  }
);

module.exports = CajaMovimientos; 