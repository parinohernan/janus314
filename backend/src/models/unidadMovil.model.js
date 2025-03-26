const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UnidadMovil = sequelize.define(
  "UnidadMovil",
  {
    Codigo: {
      type: DataTypes.STRING(4),
      primaryKey: true,
      allowNull: false,
    },
    Descripcion: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    Anulado: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    tableName: "t_unidadesmoviles",
    timestamps: false,
  }
);

module.exports = UnidadMovil;
