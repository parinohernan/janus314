// CREATE TABLE `t_tiposdepago` (
//     `Codigo` varchar(3) DEFAULT NULL,
//     `Descripcion` varchar(50) DEFAULT NULL,
//     `Activo` tinyint(1) DEFAULT NULL,
//     `aplicaSaldo` tinyint(1) DEFAULT NULL,
//     `recargoPorcentaje` decimal(10,2) DEFAULT '0',
//   ) ENGINE=InnoDB DEFAULT CHARSET=latin1;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TipoDePago = sequelize.define(
  "TipoDePago",
  {
    Codigo: {
      type: DataTypes.STRING(3),
      primaryKey: true,
      allowNull: false,
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Activo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    aplicaSaldo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    recargoPorcentaje: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: "t_tiposdepago",
    timestamps: false,
  }
);

module.exports = TipoDePago;
