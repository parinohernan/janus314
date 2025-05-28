const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CajaArqueoDetalle = sequelize.define(
  "CajaArqueoDetalle",
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
    MetodoPago: {
      type: DataTypes.STRING(3),
      allowNull: false,
      references: {
        model: 't_tiposdepago',
        key: 'Codigo'
      }
    },
    MontoContado: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    MontoSistema: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    Diferencia: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    Observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "caja_arqueo_detalle",
    timestamps: true
  }
);

module.exports = CajaArqueoDetalle; 