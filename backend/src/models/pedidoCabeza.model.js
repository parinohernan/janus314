const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Cliente = require("./cliente.model");
const UnidadMovil = require("./unidadMovil.model");

const PedidoCabeza = sequelize.define(
  "PedidoCabeza",
  {
    DocumentoTipo: {
      type: DataTypes.STRING(3),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
    },
    DocumentoSucursal: {
      type: DataTypes.STRING(8),
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
    CodigoCliente: {
      type: DataTypes.STRING(8),
      allowNull: true,
      references: {
        model: Cliente,
        key: "Codigo",
      },
    },
    CodigoUMovil: {
      type: DataTypes.STRING(4),
      allowNull: false,
      references: {
        model: UnidadMovil,
        key: "Codigo",
      },
    },
    FechaEmicion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    FechaEntrega: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    FechaEnviado: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    CantidadArticulos: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    PesoDeCarga: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    Observacion: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    FechaAnulacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    tableName: "pedidoscabeza",
    timestamps: false,
  }
);

// Asociaciones
PedidoCabeza.belongsTo(Cliente, {
  foreignKey: "CodigoCliente",
  targetKey: "Codigo",
});

PedidoCabeza.belongsTo(UnidadMovil, {
  foreignKey: "CodigoUMovil",
  targetKey: "Codigo",
});

module.exports = PedidoCabeza;
