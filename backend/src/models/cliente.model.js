const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const CategoriaIva = require("./categoriaIva.model");

class Cliente extends sequelize.Sequelize.Model {
  static getAttributes() {
    return {
      Codigo: {
        type: DataTypes.STRING(8),
        allowNull: false,
        primaryKey: true,
      },
      Descripcion: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      CategoriaIva: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      Cuit: {
        type: DataTypes.STRING(13),
        allowNull: true,
      },
      Domicilio: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      CodigoPostal: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      Localidad: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      Provincia: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      Telefono: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      Email: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      ListaPrecio: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 1,
      },
      Estado: {
        type: DataTypes.STRING(1),
        allowNull: false,
        defaultValue: 'A',
      },
    };
  }
}

Cliente.init(Cliente.getAttributes(), {
  sequelize,
  tableName: "clientes",
  timestamps: false,
});

// Relaciones
Cliente.belongsTo(CategoriaIva, {
  foreignKey: "CategoriaIva",
  as: "CategoriaIvaRelacion",
});

module.exports = Cliente;
