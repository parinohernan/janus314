const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usuario = sequelize.define(
  "Usuario",
  {
    Codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true,
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Clave: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
  },
  {
    tableName: "t_usuarios",
    timestamps: false,
  }
);

module.exports = Usuario;
