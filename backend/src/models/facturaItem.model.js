const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FacturaItem = sequelize.define(
  "FacturaItem",
  {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
    },
    DocumentoSucursal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
    },
    DocumentoNumero: {
      type: DataTypes.STRING(8),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
    },
    CodigoArticulo: {
      type: DataTypes.STRING(13),
      allowNull: true,
    },
    Cantidad: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: true,
    },
    ImporteCosto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0.0,
    },
    PrecioLista: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0.0,
    },
    PorcentajeBonificado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0.0,
    },
    ImporteBonificado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0.0,
    },
    PrecioUnitario: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: true,
    },
    DocumentoLiqTipo: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    DocumentoLiqSucursal: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    DocumentoLiqNumero: {
      type: DataTypes.STRING(8),
      allowNull: true,
    },
    LiqFecha: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    es_merma: {
      type: DataTypes.TINYINT(4),
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: "facturaitems",
    timestamps: false,
    indexes: [
      { fields: ["CodigoArticulo"] },
      { fields: ["DocumentoTipo", "DocumentoSucursal", "DocumentoNumero"] },
    ],
  }
);

module.exports = FacturaItem;
