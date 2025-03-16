const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Cliente = require("./cliente.model");
const Usuario = require("./usuario.model");
const Vendedor = require("./vendedor.model");

const FacturaCabeza = sequelize.define(
  "FacturaCabeza",
  {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      primaryKey: true,
      comment: "Tipo de comprobante (FAC, NCA, NCB, etc)",
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
    },
    PagoTipo: {
      type: DataTypes.CHAR(2),
      allowNull: true,
      comment: "CT: Contado, CC: Cuenta Corriente",
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
      type: DataTypes.DATE,
      allowNull: true,
    },
    Observacion: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    CodigoUsuario: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    CajaNumero: {
      type: DataTypes.STRING(10),
      allowNull: true,
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
    TransporteCodigo: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    PorcentajePercepcionIIBB: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImportePercepcionIIBB: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    FechaVencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    tableName: "facturacabeza",
    timestamps: false,
    indexes: [
      { fields: ["ClienteCodigo"] },
      { fields: ["DocumentoSucursal"] },
      { fields: ["VendedorCodigo"] },
      { fields: ["CodigoUsuario"] },
      { fields: ["Fecha"] },
    ],
  }
);

// Asociaciones
FacturaCabeza.belongsTo(Cliente, {
  foreignKey: "ClienteCodigo",
  targetKey: "Codigo",
});

FacturaCabeza.belongsTo(Usuario, {
  foreignKey: "CodigoUsuario",
  targetKey: "Codigo",
});

FacturaCabeza.belongsTo(Vendedor, {
  foreignKey: "VendedorCodigo",
  targetKey: "Codigo",
});

module.exports = FacturaCabeza;
