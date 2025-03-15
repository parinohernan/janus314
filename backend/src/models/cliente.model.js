const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const CategoriaIva = require("./categoriaIva.model");

const Cliente = sequelize.define(
  "Cliente",
  {
    Codigo: {
      type: DataTypes.STRING(8),
      primaryKey: true,
      allowNull: false,
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
      references: {
        model: CategoriaIva,
        key: "Codigo",
      },
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
    },
    CanalCodigo: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    FechaDeAlta: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    FechaDeBaja: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    TransporteCodigo: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    DirEntregaCalle: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    DirEntregaNumero: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    DirEntregaPiso: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    DirEntregaDpto: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    DirEntregaProvinciaCodigo: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    DirEntregaLocalidadCodigo: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    CondicionVentaCodigo: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    PorcentajeBonificacionGeneral: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    GrupoPercepcionIIBBCodigo: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    PorcentajePercepcionIIBB: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    GrupoCodigo: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    cant_facturas_impagas_max: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    ZonaCodigo: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    InvCuentaVentas: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    CliCuentaCredito: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    TipoDocumento: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    CodigoLocalidad: {
      type: DataTypes.STRING(8),
      allowNull: true,
    },
  },
  {
    tableName: "t_clientes",
    timestamps: false,
  }
);

// Relaciones
Cliente.belongsTo(CategoriaIva, {
  foreignKey: "CategoriaIva",
  as: "CategoriaIvaRelacion",
});

module.exports = Cliente;
