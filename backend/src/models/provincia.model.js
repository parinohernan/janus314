const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Provincia = sequelize.define(
  "Provincia",
  {
    Codigo: {
      type: DataTypes.STRING(4),
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
  },
  {
    tableName: "t_provincias",
    timestamps: false, // La tabla existente no tiene campos de timestamps
  }
);

module.exports = Provincia;
