const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Cliente = require("./cliente.model");
const Vendedor = require("./vendedor.model");

const PreventaCabeza = sequelize.define(
  "PreventaCabeza",
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
    Fecha: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ClienteCodigo: {
      type: DataTypes.STRING(8),
      allowNull: true,
      references: {
        model: Cliente,
        key: "Codigo",
      },
    },
    VendedorCodigo: {
      type: DataTypes.STRING(20),
      allowNull: true,
      references: {
        model: Vendedor,
        key: "Codigo",
      },
    },
    PagoTipo: {
      type: DataTypes.CHAR(2),
      allowNull: true,
    },
    ImporteBruto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    PorcentajeBonificacion: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteBonificado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteNeto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteAdicional: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteIva1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteIva2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteTotal: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImportePagado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    PorcentajeIva1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    PorcentajeIva2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ListaNumero: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
    },
    FechaAnulacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    Observacion: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    FacturaTipo: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    FacturaSucursal: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    FacturaNumero: {
      type: DataTypes.STRING(8),
      allowNull: true,
    },
    FechaEntrega: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    FechaHoraEnvio: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "fecha / hora de envio del pedido",
    },
  },
  {
    tableName: "preventa_cabeza",
    timestamps: false,
    indexes: [
      { fields: ["ClienteCodigo"] },
      { fields: ["DocumentoSucursal"] },
      { fields: ["VendedorCodigo"] },
      { fields: ["ClienteCodigo", "VendedorCodigo"] },
    ],
  }
);

// Asociaciones
PreventaCabeza.belongsTo(Cliente, {
  foreignKey: "ClienteCodigo",
  targetKey: "Codigo",
});

PreventaCabeza.belongsTo(Vendedor, {
  foreignKey: "VendedorCodigo",
  targetKey: "Codigo",
});

module.exports = PreventaCabeza;
