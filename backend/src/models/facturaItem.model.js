const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const FacturaCabeza = require("./facturaCabeza.model");
const Articulo = require("./articulo.model");

const FacturaItem = sequelize.define(
  "FacturaItem",
  {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      primaryKey: true,
      references: {
        model: FacturaCabeza,
        key: "DocumentoTipo",
      },
    },
    DocumentoSucursal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true,
      references: {
        model: FacturaCabeza,
        key: "DocumentoSucursal",
      },
    },
    DocumentoNumero: {
      type: DataTypes.STRING(8),
      allowNull: false,
      primaryKey: true,
      references: {
        model: FacturaCabeza,
        key: "DocumentoNumero",
      },
    },
    CodigoArticulo: {
      type: DataTypes.STRING(13),
      allowNull: true,
      primaryKey: true,
      references: {
        model: Articulo,
        key: "Codigo",
      },
    },
    Cantidad: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: true,
      defaultValue: 0,
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
    es_merma: {
      type: DataTypes.TINYINT,
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

// Asociaciones
FacturaItem.belongsTo(FacturaCabeza, {
  foreignKey: ["DocumentoTipo", "DocumentoSucursal", "DocumentoNumero"],
});

FacturaItem.belongsTo(Articulo, {
  foreignKey: "CodigoArticulo",
  targetKey: "Codigo",
});

module.exports = FacturaItem;
