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
      CodigoArticulo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: {
          model: Articulo,
          key: "Codigo",
        },
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
      DocummentoLiqTipo: {
        type: DataTypes.CHAR(3),
        allowNull: false,
      },
      DocummentoLiqSucursal: {
        type: DataTypes.STRING(4),
      },
      DocummentoLiqNumero: {
        type: DataTypes.STRING(8),
      },
      liqFecha: {
        type: DataTypes.DATE,
      }      
    };
  }
}

NotaCreditoItem.init(NotaCreditoItem.getAttributes(), {
  sequelize,
  tableName: "notacreditoitems",
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
