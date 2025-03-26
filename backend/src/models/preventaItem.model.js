const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const PreventaCabeza = require("./preventaCabeza.model");
const Articulo = require("./articulo.model");

const PreventaItem = sequelize.define(
  "PreventaItem",
  {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
      references: {
        model: PreventaCabeza,
        key: "DocumentoTipo",
      },
    },
    DocumentoSucursal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
      references: {
        model: PreventaCabeza,
        key: "DocumentoSucursal",
      },
    },
    DocumentoNumero: {
      type: DataTypes.STRING(8),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
      references: {
        model: PreventaCabeza,
        key: "DocumentoNumero",
      },
    },
    CodigoArticulo: {
      type: DataTypes.STRING(13),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
      references: {
        model: Articulo,
        key: "Codigo",
      },
    },
    Cantidad: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: true,
    },
    PrecioUnitario: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    DocumentoLiqTipo: {
      type: DataTypes.CHAR(3),
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
    PrecioLista: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    PorcentajeBonificacion: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "preventa_items",
    timestamps: false,
    indexes: [
      { fields: ["CodigoArticulo"] },
      { fields: ["DocumentoTipo", "DocumentoSucursal", "DocumentoNumero"] },
    ],
  }
);

// Asociaciones
PreventaItem.belongsTo(PreventaCabeza, {
  foreignKey: ["DocumentoTipo", "DocumentoSucursal", "DocumentoNumero"],
});

PreventaItem.belongsTo(Articulo, {
  foreignKey: "CodigoArticulo",
  targetKey: "Codigo",
});

module.exports = PreventaItem;
