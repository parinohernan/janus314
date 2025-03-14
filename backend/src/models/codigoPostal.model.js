const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Provincia = require("./provincia.model");

const CodigoPostal = sequelize.define(
  "CodigoPostal",
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
    Provincia: {
      type: DataTypes.STRING(4),
      allowNull: false,
      references: {
        model: Provincia,
        key: "Codigo",
      },
    },
  },
  {
    tableName: "t_codigospostales",
    timestamps: false,
  }
);

// Definir la relación con Provincia
CodigoPostal.belongsTo(Provincia, {
  foreignKey: "Provincia",
  as: "ProvinciaRelacion",
});

module.exports = CodigoPostal;
