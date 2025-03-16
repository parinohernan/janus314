const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NumerosControl = sequelize.define(
  "NumerosControl",
  {
    Codigo: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      primaryKey: true,
      comment: "Tipo de comprobante (STK, FAC, REC, etc.)",
    },
    Sucursal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true,
      comment: "Código de sucursal",
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Descripción del tipo de comprobante",
    },
    NumeroProximo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: "Próximo número a utilizar",
    },
    Copias: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: "Cantidad de copias a imprimir",
    },
  },
  {
    tableName: "t_numeroscontrol",
    timestamps: false,
  }
);

module.exports = NumerosControl;
