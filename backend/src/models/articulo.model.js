const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Proveedor = require("./proveedor.model");
const Rubro = require("./rubro.model");

const Articulo = sequelize.define(
  "Articulo",
  {
    Codigo: {
      type: DataTypes.STRING(13),
      primaryKey: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    Descripcion: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    Existencia: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    ExistenciaMinima: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    ExistenciaMaxima: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    PrecioCostoMasImp: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    PorcentajeIVA1: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    PorcentajeIVA2: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    PrecioCosto: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    UnidadVenta: {
      type: DataTypes.CHAR(3),
      allowNull: true,
    },
    Lista1: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    Lista2: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    Lista3: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    Lista4: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    Lista5: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    ProveedorCodigo: {
      type: DataTypes.STRING(7),
      allowNull: true,
      references: {
        model: Proveedor,
        key: "Codigo",
      },
    },
    RubroCodigo: {
      type: DataTypes.STRING(4),
      allowNull: true,
      references: {
        model: Rubro,
        key: "Codigo",
      },
    },
    Peso: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    SiempreSeDescarga: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    Iva2SobreNeto: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0,
    },
    PorcentajeVendedor: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    DescuentoXCantidad: {
      type: DataTypes.STRING(245),
      allowNull: true,
    },
    SeVende: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1,
    },
    Activo: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1,
    },
    EnviadoACentral: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    RequiereFrio: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0,
    },
    FamiliaCodigo: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    SubFamiliaCodigo: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    ProveedorArticuloCodigo: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: " ",
    },
    EsCompuesto: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    },
    UV_OrdenDeEntrega: {
      type: DataTypes.CHAR(3),
      allowNull: true,
    },
    UbicacionDeposito: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    CodigoBarras: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    tableName: "t_articulos",
    timestamps: false,
  }
);

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
