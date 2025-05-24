const { DataTypes } = require('sequelize');

const initializeModels = (sequelize) => {
  // Definir modelo Provincia
  const Provincia = sequelize.define('Provincia', {
    Codigo: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 't_provincias',
    timestamps: false
  });

  // Definir modelo Localidad
  const Localidad = sequelize.define('Localidad', {
    Codigo: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Provincia: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'Provincia',
        key: 'Codigo'
      }
    }
  }, {
    tableName: 't_codigospostales',
    timestamps: false
  });

  // Definir modelo Articulo
  const Articulo = sequelize.define('Articulo', {
    Codigo: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false
    },
    Descripcion: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    Existencia: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    ExistenciaMinima: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0
    },
    ExistenciaMaxima: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0
    },
    PrecioCosto: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    PrecioCostoMasImp: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0
    },
    UnidadVenta: {
      type: DataTypes.CHAR(3),
      allowNull: true
    },
    PorcentajeIVA1: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    PorcentajeIVA2: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0
    },
    Lista1: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    Lista2: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    Lista3: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    Lista4: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    Lista5: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    ProveedorCodigo: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    RubroCodigo: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Peso: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0
    },
    PorcentajeVendedor: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    Activo: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    },
    UbicacionDeposito: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    CodigoBarras: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    ProveedorArticuloCodigo: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ""
    }
  }, {
    tableName: 't_articulos',
    timestamps: false
  });

  // Definir modelo Proveedor
  const Proveedor = sequelize.define('Proveedor', {
    Codigo: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Cuit: {
      type: DataTypes.STRING(11),
      allowNull: true
    },
    Calle: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Numero: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    Piso: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Departamento: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    CodigoPostal: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Telefono: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Mail: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ContactoComercial: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ImporteDeuda: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0
    },
    Enviado: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    SaldoNTCNoAplicado: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0
    },
    retenciones_generales_codigo: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    CondicionVentaCodigo: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    ProveedorTipoCodigo: {
      type: DataTypes.STRING(3),
      allowNull: true
    },
    InvCuentaCompras: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 't_proveedores',
    timestamps: false
  });

  // Definir modelo Rubro
  const Rubro = sequelize.define('Rubro', {
    Codigo: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 't_rubros',
    timestamps: false
  });

  // Definir modelo DatosEmpresa
  const DatosEmpresa = sequelize.define('DatosEmpresa', {
    RazonSocial: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    Domicilio: {
      type: DataTypes.STRING(70),
      allowNull: true
    },
    Localidad: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Telefono: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    EMail: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    Sucursal: {
      type: DataTypes.STRING(4),
      allowNull: true,
      comment: "Código de sucursal predeterminado"
    },
    Cuit: {
      type: DataTypes.STRING(13),
      allowNull: true
    },
    PuertoFiscal: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true
    },
    CategoriaIva: {
      type: DataTypes.CHAR(1),
      allowNull: true
    },
    IngresosBrutos: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    InicioActividades: {
      type: DataTypes.DATE,
      allowNull: true
    },
    DomicilioComercial: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    DomicilioFiscal: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    PieCero: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    PieUno: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    PieDos: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    PieTres: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    Timezone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "America/Argentina/Buenos_Aires",
      comment: "Zona horaria de la empresa"
    },
    LogoURL: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      comment: "URL del logo de la empresa"
    }
  }, {
    tableName: 'datosempresa',
    timestamps: false
  });

  // Definir modelo CategoriaIva
  const CategoriaIva = sequelize.define('CategoriaIva', {
    Codigo: {
      type: DataTypes.CHAR(1),
      primaryKey: true,
      allowNull: false,
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    }
  }, {
    tableName: 't_categoriasiva',
    timestamps: false
  });

  // Definir modelo Cliente
  const Cliente = sequelize.define('Cliente', {
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
        key: 'Codigo',
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
    }
  }, {
    tableName: 't_clientes',
    timestamps: false
  });

  // Definir modelo FacturaCabeza
  const FacturaCabeza = sequelize.define('FacturaCabeza', {
    DocumentoTipo: {
      type: DataTypes.CHAR(3),
      primaryKey: true,
      allowNull: false,
      comment: "Tipo de comprobante (FAC, NCA, NCB, etc)",
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
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ClienteCodigo: {
      type: DataTypes.STRING(8),
      allowNull: true,
    },
    VendedorCodigo: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    PagoTipo: {
      type: DataTypes.CHAR(2),
      allowNull: true,
      comment: "CT: Contado, CC: Cuenta Corriente",
    },
    ImporteBruto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    PorcentajeBonificacion: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteBonificado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteNeto: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteAdicional: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteIva1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteIva2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    BaseImponible1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    BaseImponible2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteTotal: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImportePagado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    PorcentajeIva1: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    PorcentajeIva2: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ListaNumero: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
    },
    FechaAnulacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    Observacion: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    CodigoUsuario: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    CajaNumero: {
      type: DataTypes.STRING(10),
      allowNull: true,
    }
  }, {
    tableName: "facturacabeza",
    timestamps: false
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
    tableName: 'facturaitems',
    timestamps: false
  });

  // Definir modelo NotaCreditoCabeza
  const NotaCreditoCabeza = sequelize.define('NotaCreditoCabeza', {
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
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    CodigoCliente: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    ImporteTotal: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    ImporteUtilizado: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    FechaAnulacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    }
  }, {
    tableName: "notacreditocabeza",
    timestamps: false
  });

  // Definir modelo NotaDebitoCabeza
  const NotaDebitoCabeza = sequelize.define('NotaDebitoCabeza', {
    DocumentoTipo: {
      type: DataTypes.STRING(3),
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
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ClienteCodigo: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    ImporteTotal: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    ImportePagado: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    FechaAnulacion: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: "notadebitocabeza",
    timestamps: false
  });

  // Definir modelo ReciboCabeza
  const ReciboCabeza = sequelize.define('ReciboCabeza', {
    DocumentoTipo: {
      type: DataTypes.STRING(3),
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
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ClienteCodigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    ImporteTotal: {
      type: DataTypes.DOUBLE(15, 3),
      allowNull: true,
      defaultValue: 0.0,
    },
    FechaAnulacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    }
  }, {
    tableName: "reciboscabeza",
    timestamps: false
  });

  // Definir modelo MovimientoStock
  const MovimientoStock = sequelize.define('MovimientoStock', {
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
    Fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    CodigoArticulo: {
      type: DataTypes.STRING(13),
      allowNull: false,
      primaryKey: true,
    },
    Cantidad: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    MovimientoTipo: {
      type: DataTypes.CHAR(3),
      allowNull: true,
      comment: "ING para ingreso, EGR para egreso",
    },
    Observacion: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  }, {
    tableName: "movimientosstock",
    timestamps: false
  });

  // Definir modelo NumerosControl
  const NumerosControl = sequelize.define('NumerosControl', {
    Codigo: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      primaryKey: true,
      comment: "Tipo de comprobante (STK, FAC, REC, etc.)",
    },
    Sucursal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true,
      comment: "Código de sucursal",
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Descripción del tipo de comprobante",
    },
    NumeroProximo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: "Próximo número a utilizar",
    },
    Copias: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: "Cantidad de copias a imprimir",
    },
  }, {
    tableName: "t_numeroscontrol",
    timestamps: false,
  });

  // Establecer relaciones
  Localidad.belongsTo(Provincia, {
    foreignKey: 'Provincia',
    as: 'ProvinciaRelacion'
  });

  Articulo.belongsTo(Proveedor, {
    foreignKey: 'ProveedorCodigo',
    as: 'Proveedor'
  });

  Articulo.belongsTo(Rubro, {
    foreignKey: 'RubroCodigo',
    as: 'Rubro'
  });

  Cliente.belongsTo(CategoriaIva, {
    foreignKey: 'CategoriaIva',
    as: 'CategoriaIvaRelacion'
  });

  MovimientoStock.belongsTo(Articulo, {
    foreignKey: "CodigoArticulo",
    targetKey: "Codigo",
  });

  // Establecer relaciones de FacturaCabeza
  FacturaCabeza.belongsTo(Cliente, {
    foreignKey: "ClienteCodigo",
    targetKey: "Codigo",
  });

  // Establecer relaciones de FacturaItem
  FacturaItem.belongsTo(Articulo, {
    foreignKey: "CodigoArticulo",
    targetKey: "Codigo",
  });

  // Relación entre FacturaCabeza y FacturaItem
  FacturaCabeza.hasMany(FacturaItem, {
    foreignKey: ["DocumentoTipo", "DocumentoSucursal", "DocumentoNumero"]
  });

  // Definir modelo Vendedor
  const Vendedor = sequelize.define('Vendedor', {
    Codigo: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Clave: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Activo: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1,
    },
    Permisos: {
      type: DataTypes.STRING(8),
      allowNull: true,
    }
  }, {
    tableName: 't_vendedores',
    timestamps: false
  });

  // Definir modelo PreventaCabeza
  const PreventaCabeza = sequelize.define(
    "PreventaCabeza",
    {
      DocumentoTipo: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        primaryKey: true,
        defaultValue: "",
      },
      DocumentoSucursal: {
        type: DataTypes.STRING(4),
        allowNull: false,
        primaryKey: true,
        defaultValue: "",
      },
      DocumentoNumero: {
        type: DataTypes.STRING(8),
        allowNull: false,
        primaryKey: true,
        defaultValue: "",
      },
      Fecha: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ClienteCodigo: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      VendedorCodigo: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      PagoTipo: {
        type: DataTypes.CHAR(2),
        allowNull: true,
      },
      ImporteBruto: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      PorcentajeBonificacion: {
        type: DataTypes.DOUBLE(15, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      ImporteBonificado: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      ImporteNeto: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      ImporteAdicional: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      ImporteIva1: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      ImporteIva2: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      ImporteTotal: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      ImportePagado: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      PorcentajeIva1: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      PorcentajeIva2: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      ListaNumero: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
      },
      FechaAnulacion: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      Observacion: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      FacturaTipo: {
        type: DataTypes.STRING(3),
        allowNull: true,
      },
      FacturaSucursal: {
        type: DataTypes.STRING(4),
        allowNull: true,
      },
      FacturaNumero: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      FechaEntrega: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      FechaHoraEnvio: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "fecha / hora de envio del pedido",
      },
    },
    {
      tableName: "preventa_cabeza",
      timestamps: false,
      indexes: [
        { fields: ["ClienteCodigo"] },
        { fields: ["DocumentoSucursal"] },
        { fields: ["VendedorCodigo"] },
        { fields: ["ClienteCodigo", "VendedorCodigo"] },
      ],
    }
  );

  // Definir modelo PreventaItem
  const PreventaItem = sequelize.define(
    "PreventaItem",
    {
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
        allowNull: true,
        defaultValue: 0,
      },
      PrecioUnitario: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0,
      },
      PrecioLista: {
        type: DataTypes.DOUBLE(15, 3),
        allowNull: true,
        defaultValue: 0,
      },
      PorcentajeBonificacion: {
        type: DataTypes.DOUBLE(15, 2),
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      tableName: "preventa_items",
      timestamps: false,
      indexes: [
        { fields: ["DocumentoTipo", "DocumentoSucursal", "DocumentoNumero"] },
        { fields: ["CodigoArticulo"] },
      ],
    }
  );

  // Asociaciones para PreventaCabeza
  PreventaCabeza.belongsTo(Cliente, {
    foreignKey: "ClienteCodigo",
    targetKey: "Codigo",
  });

  PreventaCabeza.belongsTo(Vendedor, {
    foreignKey: "VendedorCodigo",
    targetKey: "Codigo",
  });

  // Asociaciones para PreventaItem - corregida para claves compuestas
  PreventaItem.belongsTo(PreventaCabeza, {
    foreignKey: "DocumentoTipo",
    targetKey: "DocumentoTipo",
  });

  PreventaItem.belongsTo(PreventaCabeza, {
    foreignKey: "DocumentoSucursal",
    targetKey: "DocumentoSucursal",
  });

  PreventaItem.belongsTo(PreventaCabeza, {
    foreignKey: "DocumentoNumero",
    targetKey: "DocumentoNumero",
  });

  PreventaItem.belongsTo(Articulo, {
    foreignKey: "CodigoArticulo",
    targetKey: "Codigo",
  });

  // Definir modelo Configuracion
  const Configuracion = sequelize.define('Configuracion', {
    Codigo: {
      type: DataTypes.STRING(200),
      primaryKey: true,
      allowNull: false
    },
    Descripcion: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    ValorConfig: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    pasar_a_ipaqs: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    timestamps: false,
    freezeTableName: true,
    tableName: 't_configuracion'
  });
  
  // Definir modelo TipoDePago
  const TipoDePago = sequelize.define('TipoDePago', {
    Codigo: {
      type: DataTypes.STRING(3),
      primaryKey: true,
      allowNull: false,
    },
    Descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Activo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    aplicaSaldo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    recargoPorcentaje: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
  }, {
    tableName: 't_tiposdepago',
    timestamps: false,
  });

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
    FacturaCabeza,
    FacturaItem,
    NotaCredito: NotaCreditoCabeza,
    NotaDebito: NotaDebitoCabeza,
    Recibo: ReciboCabeza,
    MovimientoStock,
    NumerosControl,
    PreventaCabeza,
    PreventaItem,
    Configuracion,
    TipoDePago
  };
};

module.exports = initializeModels; 