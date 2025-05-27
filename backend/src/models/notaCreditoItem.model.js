const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Articulo = require("./articulo.model");

class NotaCreditoItem extends sequelize.Sequelize.Model {
  static getAttributes() {
    return {
      DocumentoTipo: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        primaryKey: true,
      },
      DocumentoSucursal: {
        type: DataTypes.STRING(4),
        allowNull: false,
        primaryKey: true,
      },
      DocumentoNumero: {
        type: DataTypes.STRING(8),
        allowNull: false,
        primaryKey: true,
      },
      ItemNumero: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      CodigoArticulo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: {
          model: Articulo,
          key: "Codigo",
        },
      },
      Descripcion: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      Cantidad: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      PrecioUnitario: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      PorcentajeBonificacion: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      PorcentajeIva: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      PrecioUnitarioConIva: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      Total: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      TotalConIva: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
    };
  }
}

NotaCreditoItem.init(NotaCreditoItem.getAttributes(), {
  sequelize,
  tableName: "notacreditoitem",
  timestamps: false,
  indexes: [
    { fields: ["CodigoArticulo"] },
  ],
});

// Asociaciones
NotaCreditoItem.belongsTo(Articulo, {
  foreignKey: "CodigoArticulo",
  targetKey: "Codigo",
});

module.exports = NotaCreditoItem;
