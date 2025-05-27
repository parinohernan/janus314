const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NumerosControl = sequelize.define(
  "NumerosControl",
  {
    Codigo: {
      type: DataTypes.STRING(3),
      primaryKey: true,
      allowNull: false,
    },
    Sucursal: {
      type: DataTypes.STRING(4),
      primaryKey: true,
      allowNull: false,
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    NumeroProximo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    Copias: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    ImporteAcumulado: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "t_numeroscontrol",
    timestamps: false,
  }
);

module.exports = NumerosControl;
