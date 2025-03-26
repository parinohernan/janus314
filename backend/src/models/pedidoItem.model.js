const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const PedidoCabeza = require("./pedidoCabeza.model");
const Articulo = require("./articulo.model");

const PedidoItem = sequelize.define(
  "PedidoItem",
  {
    DocumentoTipo: {
      type: DataTypes.STRING(3),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
      references: {
        model: PedidoCabeza,
        key: "DocumentoTipo",
      },
    },
    DocumentoSucursal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
      references: {
        model: PedidoCabeza,
        key: "DocumentoSucursal",
      },
    },
    DocumentoNumero: {
      type: DataTypes.STRING(8),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
      references: {
        model: PedidoCabeza,
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
      defaultValue: 0.0,
    },
  },
  {
    tableName: "pedidositems",
    timestamps: false,
    indexes: [
      { fields: ["CodigoArticulo"] },
      { fields: ["DocumentoTipo", "DocumentoSucursal", "DocumentoNumero"] },
    ],
  }
);

// Asociaciones
PedidoItem.belongsTo(PedidoCabeza, {
  foreignKey: ["DocumentoTipo", "DocumentoSucursal", "DocumentoNumero"],
});

PedidoItem.belongsTo(Articulo, {
  foreignKey: "CodigoArticulo",
  targetKey: "Codigo",
});

module.exports = PedidoItem;
