const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Rubro = sequelize.define(
  "Rubro",
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
    RubroGrupoCodigo: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
  },
  {
    tableName: "t_rubros",
    timestamps: false, // La tabla existente no tiene campos de timestamps
  }
);

module.exports = Rubro;
