const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CategoriaIva = sequelize.define(
  "CategoriaIva",
  {
    Codigo: {
      type: DataTypes.CHAR(1),
      primaryKey: true,
      allowNull: false,
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Porcentaje1: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Porcentaje2: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Documento: {
      type: DataTypes.CHAR(1),
      allowNull: true,
    },
  },
  {
    tableName: "t_categoriasiva",
    timestamps: false,
  }
);

module.exports = CategoriaIva;
