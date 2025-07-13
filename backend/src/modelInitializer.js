const { DataTypes } = require('sequelize');
const CajaCabeza = require('./models/cajaCabeza.model');
const CajaMovimientos = require('./models/cajaMovimientos.model');

const initializeModels = (sequelize) => {
  console.log('Iniciando inicialización de modelos...');
  
  // ... modelos existentes ...

  // Inicializar modelos de caja
  CajaCabeza.init(CajaCabeza.getAttributes(), {
    sequelize,
    modelName: 'CajaCabeza',
    tableName: 'caja_cabeza',
    timestamps: true
  });

  CajaMovimientos.init(CajaMovimientos.getAttributes(), {
    sequelize,
    modelName: 'CajaMovimientos',
    tableName: 'caja_movimientos',
    timestamps: true
  });

  // Las asociaciones de caja se manejan en cajaAssociations.js para evitar duplicaciones

  // Definir modelo Cliente
  const Cliente = sequelize.define('Cliente', {
    Codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    NombreFantasia: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Cuit: {
      type: DataTypes.STRING(13),
      allowNull: true
    }
  }, {
    tableName: 't_clientes',
    timestamps: false
  });

  // Definir modelo Usuario
  const Usuario = sequelize.define('Usuario', {
    Codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 't_usuarios',
    timestamps: false
  });

  // Definir modelo Vendedor
  const Vendedor = sequelize.define('Vendedor', {
    Codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 't_vendedores',
    timestamps: false
  });

  // Definir modelo ReciboCabeza
  const ReciboCabeza = sequelize.define('ReciboCabeza', {
    DocumentoTipo: {
      type: DataTypes.STRING(3),
      allowNull: false,
      primaryKey: true
    },
    DocumentoSucursal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true
    },
    DocumentoNumero: {
      type: DataTypes.STRING(8),
      allowNull: false,
      primaryKey: true
    },
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    ClienteCodigo: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    ImporteTotal: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.000
    },
    FechaAnulacion: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    CodigoUsuario: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    VendedorCodigo: {
      type: DataTypes.STRING(20),
      allowNull: true
    }
  }, {
    tableName: 'reciboscabeza',
    timestamps: false
  });

  // Definir modelo ReciboItem
  console.log('Definiendo modelo ReciboItem...');
  const ReciboItem = sequelize.define('ReciboItem', {
    DocumentoTipo: {
      type: DataTypes.STRING(3),
      allowNull: false,
      primaryKey: true
    },
    DocumentoSucursal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true
    },
    DocumentoNumero: {
      type: DataTypes.STRING(8),
      allowNull: false,
      primaryKey: true
    },
    FacturaTipo: {
      type: DataTypes.STRING(3),
      allowNull: false,
      primaryKey: true
    },
    FacturaSucursal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true
    },
    FacturaNumero: {
      type: DataTypes.STRING(8),
      allowNull: false,
      primaryKey: true
    },
    ImportePagado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0.000
    }
  }, {
    tableName: 'recibositems',
    timestamps: false
  });
  console.log('ReciboItem definido:', ReciboItem ? 'Sí' : 'No');

  // Definir modelo ReciboValor
  console.log('Definiendo modelo ReciboValor...');
  const ReciboValor = sequelize.define('ReciboValor', {
    DocumentoTipo: {
      type: DataTypes.STRING(3),
      allowNull: false,
      primaryKey: true
    },
    DocumentoSucursal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true
    },
    DocumentoNumero: {
      type: DataTypes.STRING(8),
      allowNull: false,
      primaryKey: true
    },
    ValorCodigo: {
      type: DataTypes.STRING(4),
      allowNull: false
    },
    ValorFecha: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ValorSucursal: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    ValorNumero: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ValorBanco: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    ValorImporte: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true
    }
  }, {
    tableName: 'recibosvalores',
    timestamps: false
  });
  console.log('ReciboValor definido:', ReciboValor ? 'Sí' : 'No');

  // Establecer relaciones
  console.log('Estableciendo relaciones...');
  ReciboCabeza.belongsTo(Cliente, {
    foreignKey: 'ClienteCodigo',
    targetKey: 'Codigo',
    as: 'ClienteRelacion'
  });

  ReciboCabeza.belongsTo(Usuario, {
    foreignKey: 'CodigoUsuario',
    targetKey: 'Codigo',
    as: 'UsuarioRelacion'
  });

  ReciboCabeza.belongsTo(Vendedor, {
    foreignKey: 'VendedorCodigo',
    targetKey: 'Codigo',
    as: 'VendedorRelacion'
  });

  // Establecer relaciones con ReciboItem y ReciboValor
  console.log('Estableciendo relaciones con ReciboItem y ReciboValor...');
  
  // Relación con ReciboItem
  ReciboCabeza.hasMany(ReciboItem, {
    foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
    sourceKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
    as: 'Items'
  });

  ReciboItem.belongsTo(ReciboCabeza, {
    foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
    targetKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
    as: 'Recibo'
  });

  // Relación con ReciboValor
  ReciboCabeza.hasMany(ReciboValor, {
    foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
    sourceKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
    as: 'Valores'
  });

  ReciboValor.belongsTo(ReciboCabeza, {
    foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
    targetKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
    as: 'Recibo'
  });

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

  // Crear el objeto de modelos
  const modelos = {
    Cliente,
    Usuario,
    Vendedor,
    Recibo: ReciboCabeza,
    ReciboItem,
    ReciboValor,
    ReciboCabeza,
    CajaCabeza,
    CajaMovimientos,
    // Otros modelos necesarios
    Articulo,
    Proveedor,
    Rubro,
    DatosEmpresa,
    Provincia,
    Localidad,
    CategoriaIva,
    FacturaCabeza,
    FacturaItem,
    NotaCredito: NotaCreditoCabeza,
    NotaDebito: NotaDebitoCabeza,
    MovimientoStock,
    NumerosControl,
    PreventaCabeza,
    PreventaItem,
    Configuracion,
    TipoDePago
  };

  console.log('Modelos inicializados:', Object.keys(modelos));
  console.log('ReciboItem en modelos:', !!modelos.ReciboItem);
  console.log('ReciboValor en modelos:', !!modelos.ReciboValor);
  return modelos;
};

module.exports = initializeModels; 