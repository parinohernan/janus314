const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Vendedor = sequelize.define(
  "Vendedor",
  {
    Codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true,
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Clave: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    Activo: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1,
    },
  },
  {
    tableName: "t_vendedores",
    timestamps: false,
  }
);

module.exports = Vendedor;
