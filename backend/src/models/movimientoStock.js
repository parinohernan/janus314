const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Articulo = require("./articulo.model");

const MovimientoStock = sequelize.define(
  "MovimientoStock",
  {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      primaryKey: true,
    },
    DocumentoSucursal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true,
    },
    DocumentoNumero: {
      type: DataTypes.STRING(8),
      allowNull: false,
      primaryKey: true,
    },
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    CodigoArticulo: {
      type: DataTypes.STRING(13),
      allowNull: false,
      primaryKey: true,
      references: {
        model: Articulo,
        key: "Codigo",
      },
    },
    Cantidad: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    MovimientoTipo: {
      type: DataTypes.CHAR(3),
      allowNull: true,
      comment: "ING para ingreso, EGR para egreso",
    },
    Observacion: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    tableName: "movimientosstock",
    timestamps: false,
    indexes: [
      {
        fields: ["CodigoArticulo", "Fecha"],
      },
    ],
  }
);

// Asociación con Articulo
MovimientoStock.belongsTo(Articulo, {
  foreignKey: "CodigoArticulo",
  targetKey: "Codigo",
});

module.exports = MovimientoStock;
