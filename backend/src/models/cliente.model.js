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
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      NombreFantasia: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      Cuit: {
        type: DataTypes.STRING(11),
        allowNull: true,
      },
      Calle: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      Numero: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      Piso: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      Departamento: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      ProvinciaCodigo: {
        type: DataTypes.STRING(3),
        allowNull: true,
      },
      CodigoPostal: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      Localidad: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      ContactoNombre: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      Mail: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      Telefono: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      TelefonoMovil: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      ContactoComercial: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      CategoriaIva: {
        type: DataTypes.CHAR(1),
        allowNull: true,
      },
      ListaPrecio: {
        type: DataTypes.CHAR(1),
        allowNull: true,
      },
      ImporteDeuda: {
        type: DataTypes.DOUBLE(15, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      CodigoVendedor: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      Actualizado: {
        type: DataTypes.TINYINT,
        allowNull: true,
      },
      SaldoNTCNoAplicado: {
        type: DataTypes.DOUBLE(15, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      Activo: {
        type: DataTypes.TINYINT(1),
        allowNull: true,
        defaultValue: 0,
      },
      LimiteCredito: {
        type: DataTypes.DOUBLE(15, 2),
        allowNull: true,
        defaultValue: 0.0,
      }
    };
  }
}

Cliente.init(Cliente.getAttributes(), {
  sequelize,
  tableName: "t_clientes",
  timestamps: false,
});

// Relaciones
Cliente.belongsTo(CategoriaIva, {
  foreignKey: "CategoriaIva",
  as: "CategoriaIvaRelacion",
});

module.exports = Cliente;
