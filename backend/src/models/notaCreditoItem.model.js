const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Articulo = require("./articulo.model");
const NotaCreditoCabeza = require("./notaCreditoCabeza.model");

const NotaCreditoItem = sequelize.define(
  "NotaCreditoItem",
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
      defaultValue: 0.0,
    },
    PrecioUnitario: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: true,
      defaultValue: 0.0,
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
  },
  {
    tableName: "notacreditoitems",
    timestamps: false,
    indexes: [
      { fields: ["CodigoArticulo"] },
      { fields: ["DocumentoTipo", "DocumentoSucursal", "DocumentoNumero"] },
    ],
  }
);

// Asociación simple sin intentar replicar la relación completa
NotaCreditoItem.belongsTo(Articulo, {
  foreignKey: "CodigoArticulo",
  targetKey: "Codigo",
});

// No definimos la asociación con NotaCreditoCabeza aquí
// En su lugar, manejaremos la relación manualmente cuando sea necesario

module.exports = NotaCreditoItem;
