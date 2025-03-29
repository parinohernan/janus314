const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Cliente = require("./cliente.model");
const Usuario = require("./usuario.model");
const Vendedor = require("./vendedor.model");

const NotaCreditoCabeza = sequelize.define(
  "NotaCreditoCabeza",
  {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      primaryKey: true,
      comment: "Tipo de comprobante (NCA, NCB, etc)",
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
    CodigoCliente: {
      type: DataTypes.STRING(8),
      allowNull: false,
      references: {
        model: Cliente,
        key: "Codigo",
      },
    },
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ImporteTotal: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteUtilizado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    FechaAnulacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ImporteNeto: {
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
    BaseImponible1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    BaseImponible2: {
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
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0,
    },
    Observacion: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    PorStock: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0,
    },
    CodigoUsuario: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    CajaNumero: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    CodigoVendedor: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "",
    },
    ImporteBruto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteBonificado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteAdicional: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    afip_cae: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    afip_cae_observaciones: {
      type: DataTypes.STRING(254),
      allowNull: true,
    },
    afip_cae_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    factura_tipo: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    factura_sucursal: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    factura_numero: {
      type: DataTypes.STRING(8),
      allowNull: true,
    },
    gmc_diario_general_numero: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
  },
  {
    tableName: "notacreditocabeza",
    timestamps: false,
    indexes: [
      { fields: ["CodigoCliente"] },
      { fields: ["Fecha"] },
      { fields: ["CodigoUsuario"] },
      { fields: ["CodigoVendedor"] },
      { fields: ["factura_tipo", "factura_sucursal", "factura_numero"] },
    ],
  }
);

// Asociaciones
NotaCreditoCabeza.belongsTo(Cliente, {
  foreignKey: "CodigoCliente",
  targetKey: "Codigo",
});

NotaCreditoCabeza.belongsTo(Usuario, {
  foreignKey: "CodigoUsuario",
  targetKey: "Codigo",
});

NotaCreditoCabeza.belongsTo(Vendedor, {
  foreignKey: "CodigoVendedor",
  targetKey: "Codigo",
});

module.exports = NotaCreditoCabeza;
