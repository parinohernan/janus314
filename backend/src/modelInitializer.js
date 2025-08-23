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
          tableName: 'caja_cabeza_new',
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

  // Importar modelos de factura desde archivos separados
  const FacturaCabeza = require('./models/facturaCabeza.model');
  const FacturaItem = require('./models/facturaItem.model');
  const Articulo = require('./models/articulo.model');

  // Establecer relaciones de Factura
  console.log('Estableciendo relaciones de Factura...');
  
  // Relación FacturaCabeza -> FacturaItem
  FacturaCabeza.hasMany(FacturaItem, {
    foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
    sourceKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero']
  });

  // Relación FacturaItem -> FacturaCabeza
  FacturaItem.belongsTo(FacturaCabeza, {
    foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
    targetKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero']
  });

  // Relación FacturaItem -> Articulo
  FacturaItem.belongsTo(Articulo, {
    foreignKey: 'CodigoArticulo',
    targetKey: 'Codigo'
  });

  // Después de definir ReciboValor, agregar la definición de NotaCreditoCabeza
  console.log('Definiendo modelo NotaCreditoCabeza...');
  const NotaCreditoCabeza = sequelize.define('NotaCreditoCabeza', {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
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
    CodigoCliente: {
      type: DataTypes.STRING(8),
      allowNull: false
    },
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    ImporteTotal: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteUtilizado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    FechaAnulacion: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ImporteNeto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteIva1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteIva2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    BaseImponible1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    BaseImponible2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    PorcentajeIva1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 21.0
    },
    PorcentajeIva2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 10.5
    },
    ListaNumero: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1
    },
    Observacion: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    PorStock: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    CodigoUsuario: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    CajaNumero: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    CodigoVendedor: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ""
    },
    ImporteBruto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteBonificado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteAdicional: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    afip_cae: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    afip_cae_observaciones: {
      type: DataTypes.STRING(254),
      allowNull: true
    },
    afip_cae_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    factura_tipo: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    factura_sucursal: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    factura_numero: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    gmc_diario_general_numero: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'notacreditocabeza',
    timestamps: false
  });

  // Definir modelo NotaCreditoItem
  console.log('Definiendo modelo NotaCreditoItem...');
  const NotaCreditoItem = sequelize.define('NotaCreditoItem', {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
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
    CodigoArticulo: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    Cantidad: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0
    },
    PrecioUnitario: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0
    },
    DocummentoLiqTipo: {
      type: DataTypes.CHAR(3),
      allowNull: false
    },
    DocummentoLiqSucursal: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    DocummentoLiqNumero: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    liqFecha: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notacreditoitems',
    timestamps: false
  });

  // Definir modelo NotaDebitoCabeza
  console.log('Definiendo modelo NotaDebitoCabeza...');
  const NotaDebitoCabeza = sequelize.define('NotaDebitoCabeza', {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
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
    CodigoCliente: {
      type: DataTypes.STRING(8),
      allowNull: false
    },
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    ImporteTotal: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteUtilizado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    FechaAnulacion: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ImporteNeto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteIva1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteIva2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    BaseImponible1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    BaseImponible2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    PorcentajeIva1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 21.0
    },
    PorcentajeIva2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 10.5
    },
    ListaNumero: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1
    },
    Observacion: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    PorStock: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    CodigoUsuario: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    CajaNumero: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    CodigoVendedor: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ""
    },
    ImporteBruto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteBonificado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteAdicional: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    afip_cae: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    afip_cae_observaciones: {
      type: DataTypes.STRING(254),
      allowNull: true
    },
    afip_cae_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    factura_tipo: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    factura_sucursal: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    factura_numero: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    gmc_diario_general_numero: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'notadebitocabeza',
    timestamps: false
  });

  // Definir modelo NotaDebitoItem
  console.log('Definiendo modelo NotaDebitoItem...');
  const NotaDebitoItem = sequelize.define('NotaDebitoItem', {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
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
    CodigoArticulo: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    Cantidad: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0
    },
    PrecioUnitario: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0
    },
    DocummentoLiqTipo: {
      type: DataTypes.CHAR(3),
      allowNull: false
    },
    DocummentoLiqSucursal: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    DocummentoLiqNumero: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    liqFecha: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notadebitoitems',
    timestamps: false
  });

  // Definir modelo MovimientoStock
  console.log('Definiendo modelo MovimientoStock...');
  const MovimientoStock = sequelize.define('MovimientoStock', {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
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
    CodigoArticulo: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    Cantidad: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0
    },
    PrecioUnitario: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0
    },
    TipoMovimiento: {
      type: DataTypes.STRING(1),
      allowNull: false
    },
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    CodigoUsuario: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    CajaNumero: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    CodigoVendedor: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Observacion: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    PorStock: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    afip_cae: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    afip_cae_observaciones: {
      type: DataTypes.STRING(254),
      allowNull: true
    },
    afip_cae_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    factura_tipo: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    factura_sucursal: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    factura_numero: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    gmc_diario_general_numero: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'movimientostock',
    timestamps: false
  });
  console.log('MovimientoStock definido:', MovimientoStock ? 'Sí' : 'No');

  // Definir modelo NumerosControl
  console.log('Definiendo modelo NumerosControl...');
  const NumerosControl = sequelize.define('NumerosControl', {
    Codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    DocumentoTipo: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    DocumentoSucursal: {
      type: DataTypes.STRING(4),
      allowNull: false
    },
    DocumentoNumero: {
      type: DataTypes.STRING(8),
      allowNull: false
    },
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    CodigoUsuario: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    CajaNumero: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    CodigoVendedor: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Observacion: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    PorStock: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    afip_cae: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    afip_cae_observaciones: {
      type: DataTypes.STRING(254),
      allowNull: true
    },
    afip_cae_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    factura_tipo: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    factura_sucursal: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    factura_numero: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    gmc_diario_general_numero: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'numeroscontrol',
    timestamps: false
  });
  console.log('NumerosControl definido:', NumerosControl ? 'Sí' : 'No');

  // Definir modelo PreventaCabeza
  console.log('Definiendo modelo PreventaCabeza...');
  const PreventaCabeza = sequelize.define('PreventaCabeza', {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
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
    CodigoCliente: {
      type: DataTypes.STRING(8),
      allowNull: false
    },
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    ImporteTotal: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteUtilizado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    FechaAnulacion: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ImporteNeto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteIva1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteIva2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    BaseImponible1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    BaseImponible2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    PorcentajeIva1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 21.0
    },
    PorcentajeIva2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 10.5
    },
    ListaNumero: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1
    },
    Observacion: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    PorStock: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    CodigoUsuario: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    CajaNumero: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    CodigoVendedor: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ""
    },
    ImporteBruto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteBonificado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    ImporteAdicional: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0
    },
    afip_cae: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    afip_cae_observaciones: {
      type: DataTypes.STRING(254),
      allowNull: true
    },
    afip_cae_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    factura_tipo: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    factura_sucursal: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    factura_numero: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    gmc_diario_general_numero: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'preventacabeza',
    timestamps: false
  });
  console.log('PreventaCabeza definido:', PreventaCabeza ? 'Sí' : 'No');

  // Definir modelo PreventaItem
  console.log('Definiendo modelo PreventaItem...');
  const PreventaItem = sequelize.define('PreventaItem', {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
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
    CodigoArticulo: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    Cantidad: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0
    },
    PrecioUnitario: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: false,
      defaultValue: 0
    },
    DocummentoLiqTipo: {
      type: DataTypes.CHAR(3),
      allowNull: false
    },
    DocummentoLiqSucursal: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    DocummentoLiqNumero: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    liqFecha: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'preventaitems',
    timestamps: false
  });
  console.log('PreventaItem definido:', PreventaItem ? 'Sí' : 'No');

  // Definir modelo Configuracion
  console.log('Definiendo modelo Configuracion...');
  const Configuracion = sequelize.define('Configuracion', {
    Codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Valor: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Tipo: {
      type: DataTypes.STRING(1),
      allowNull: true
    },
    CodigoEmpresa: {
      type: DataTypes.STRING(10),
      allowNull: true
    }
  }, {
    tableName: 'configuracion',
    timestamps: false
  });
  console.log('Configuracion definido:', Configuracion ? 'Sí' : 'No');

  // Definir modelo TipoDePago
  console.log('Definiendo modelo TipoDePago...');
  const TipoDePago = sequelize.define('TipoDePago', {
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
    tableName: 'tipodepago',
    timestamps: false
  });
  console.log('TipoDePago definido:', TipoDePago ? 'Sí' : 'No');

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