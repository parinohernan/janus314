const { DataTypes } = require('sequelize');

const initializeModels = (sequelize) => {
  // ... modelos existentes ...

  // Definir modelo FacturaItem
  const FacturaItem = sequelize.define('FacturaItem', {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
      primaryKey: true,
      allowNull: false,
    },
    DocumentoSucursal: {
      type: DataTypes.STRING(4),
      primaryKey: true,
      allowNull: false,
    },
    DocumentoNumero: {
      type: DataTypes.STRING(8),
      primaryKey: true,
      allowNull: false,
    },
    CodigoArticulo: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    Cantidad: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
    },
    PrecioLista: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
    },
    PorcentajeBonificado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
    },
    ImporteBonificado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
    },
    PrecioUnitario: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
    },
    ImporteCosto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
    }
  }, {
    tableName: 'facturaitem',
    timestamps: false
  });

  // ... resto de modelos ...

  return {
    Articulo,
    Proveedor,
    Rubro,
    DatosEmpresa,
    Provincia,
    Localidad,
    CategoriaIva,
    Cliente,
    Vendedor,
    Factura: FacturaCabeza,
    FacturaItem, // Añadir FacturaItem a la exportación
    NotaCredito: NotaCreditoCabeza,
    NotaDebito: NotaDebitoCabeza,
    Recibo: ReciboCabeza,
    MovimientoStock,
    NumerosControl
  };
};

module.exports = initializeModels; 