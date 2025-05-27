const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Proveedor = require("./proveedor.model");
const Rubro = require("./rubro.model");

class Articulo extends sequelize.Sequelize.Model {
  static getAttributes() {
    return {
      Codigo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        primaryKey: true,
      },
      Descripcion: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      Existencia: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      PrecioVenta1: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      PrecioVenta2: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      PrecioVenta3: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      PorcentajeIva: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: false,
        defaultValue: 21,
      },
      Estado: {
        type: DataTypes.STRING(1),
        allowNull: false,
        defaultValue: 'A',
      },
      RubroCodigo: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      CodigoBarras: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      UnidadMedida: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
    };
  }
}

Articulo.init(Articulo.getAttributes(), {
  sequelize,
  tableName: "articulos",
  timestamps: false,
});

// Definir las relaciones
Articulo.belongsTo(Proveedor, {
  foreignKey: "ProveedorCodigo",
  as: "Proveedor",
});

Articulo.belongsTo(Rubro, {
  foreignKey: "RubroCodigo",
  as: "Rubro",
});

module.exports = Articulo;
