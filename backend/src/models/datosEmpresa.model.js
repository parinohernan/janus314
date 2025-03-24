const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DatosEmpresa = sequelize.define(
  "DatosEmpresa",
  {
    RazonSocial: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },
    Domicilio: {
      type: DataTypes.STRING(70),
      allowNull: true,
    },
    Localidad: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Telefono: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    EMail: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Sucursal: {
      type: DataTypes.STRING(4),
      allowNull: true,
      comment: "Código de sucursal predeterminado",
    },
    Cuit: {
      type: DataTypes.STRING(13),
      allowNull: true,
    },
    PuertoFiscal: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },
    CategoriaIva: {
      type: DataTypes.CHAR(1),
      allowNull: true,
    },
    IngresosBrutos: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    InicioActividades: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    DomicilioComercial: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    DomicilioFiscal: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    PieCero: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    PieUno: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    PieDos: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    PieTres: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
  },
  {
    tableName: "datosempresa",
    timestamps: false,
  }
);

module.exports = DatosEmpresa;
