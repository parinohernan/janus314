const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const CodigoPostal = require("./codigoPostal.model");

const Proveedor = sequelize.define(
  "Proveedor",
  {
    Codigo: {
      type: DataTypes.STRING(8),
      primaryKey: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Cuit: {
      type: DataTypes.STRING(11),
      allowNull: true,
    },
    Calle: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Numero: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    Piso: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Departamento: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    CodigoPostal: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: CodigoPostal,
        key: "Codigo",
      },
    },
    Telefono: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Mail: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ContactoComercial: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ImporteDeuda: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    Enviado: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    SaldoNTCNoAplicado: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    retenciones_generales_codigo: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    CondicionVentaCodigo: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    ProveedorTipoCodigo: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    InvCuentaCompras: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "t_proveedores",
    timestamps: false,
  }
);

// Definir la relación con CodigoPostal
Proveedor.belongsTo(CodigoPostal, {
  foreignKey: "CodigoPostal",
  as: "CodigoPostalRelacion",
});

module.exports = Proveedor;
