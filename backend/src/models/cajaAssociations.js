const { Model, DataTypes } = require('sequelize');
const CajaCabeza = require('./cajaCabeza.model');
const CajaMovimientos = require('./cajaMovimientos.model');
const CajaArqueoDetalle = require('./cajaArqueoDetalle.model');
const Vendedor = require('./vendedor.model');
const TipoDePago = require('./tipoDePago.model');

async function initializeAssociations(sequelize) {
  try {
    console.log('Iniciando inicialización de modelos y asociaciones...');

    // Inicializar Vendedor primero ya que es una dependencia
    if (!Vendedor.sequelize) {
      console.log('Inicializando modelo Vendedor...');
      Vendedor.init({
        Codigo: {
          type: DataTypes.STRING(20),
          allowNull: false,
          primaryKey: true,
        },
        Descripcion: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        Clave: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        Activo: {
          type: DataTypes.TINYINT,
          allowNull: true,
          defaultValue: 1,
        },
        Permisos: {
          type: DataTypes.STRING(8),
          allowNull: true,
        },
      }, {
        sequelize,
        modelName: 'Vendedor',
        tableName: 't_vendedores',
        timestamps: false,
      });
      console.log('✅ Modelo Vendedor inicializado');
    }

    // Inicializar CajaCabeza después de sus dependencias
    if (!CajaCabeza.sequelize) {
      console.log('Inicializando modelo CajaCabeza...');
      CajaCabeza.init(CajaCabeza.getAttributes(), {
        sequelize,
        modelName: 'CajaCabeza',
        tableName: 'caja_cabeza_new',
        timestamps: false
      });
      console.log('✅ Modelo CajaCabeza inicializado');
    }

    // Inicializar CajaMovimientos después de CajaCabeza
    if (!CajaMovimientos.sequelize) {
      console.log('Inicializando modelo CajaMovimientos...');
      CajaMovimientos.init(CajaMovimientos.getAttributes(), {
        sequelize,
        modelName: 'CajaMovimientos',
        tableName: 'caja_movimientos',
        timestamps: true
      });
      console.log('✅ Modelo CajaMovimientos inicializado');
    }

    // Inicializar CajaArqueoDetalle después de CajaCabeza
    if (!CajaArqueoDetalle.sequelize) {
      console.log('Inicializando modelo CajaArqueoDetalle...');
      CajaArqueoDetalle.init(CajaArqueoDetalle.getAttributes(), {
        sequelize,
        modelName: 'CajaArqueoDetalle',
        tableName: 'caja_arqueo_detalle',
        timestamps: true
      });
      console.log('✅ Modelo CajaArqueoDetalle inicializado');
    }

    // Inicializar TipoDePago si no está inicializado
    if (!TipoDePago.sequelize) {
      console.log('Inicializando modelo TipoDePago...');
      TipoDePago.init(TipoDePago.getAttributes(), {
        sequelize,
        modelName: 'TipoDePago',
        tableName: 't_tiposdepago',
        timestamps: false
      });
      console.log('✅ Modelo TipoDePago inicializado');
    }

    console.log('Estableciendo asociaciones...');

    // Verificar si las asociaciones ya están definidas antes de crearlas
    const associations = CajaCabeza.associations || {};
    const hasCajaVendedorAssociation = Object.values(associations).some(assoc => assoc.as === 'CajaVendedor');

    if (!hasCajaVendedorAssociation) {
    // Asociaciones CajaCabeza
    CajaCabeza.belongsTo(Vendedor, { 
      foreignKey: 'VendedorId', 
        as: 'CajaVendedor',
      targetKey: 'Codigo'
    });
    }

    // Verificar si las asociaciones de CajaMovimientos ya están definidas
    const cajaMovimientosAssociations = CajaMovimientos.associations || {};
    const hasCajaAssociation = Object.values(cajaMovimientosAssociations).some(assoc => assoc.as === 'Caja');

    if (!hasCajaAssociation) {
    // Asociaciones CajaMovimientos
    CajaMovimientos.belongsTo(CajaCabeza, { 
      foreignKey: 'CajaCabezaId', 
      as: 'Caja' 
    });
    }

    // Verificar si las asociaciones de CajaArqueoDetalle ya están definidas
    const cajaArqueoAssociations = CajaArqueoDetalle.associations || {};
    const hasArqueoCajaAssociation = Object.values(cajaArqueoAssociations).some(assoc => assoc.as === 'Caja');

    if (!hasArqueoCajaAssociation) {
    CajaArqueoDetalle.belongsTo(CajaCabeza, { 
      foreignKey: 'CajaCabezaId', 
      as: 'Caja' 
    });
    }

    // Verificar y agregar asociaciones con TipoDePago
    const hasTipoPagoAssociation = Object.values(cajaMovimientosAssociations).some(assoc => assoc.as === 'TipoPago');
    if (!hasTipoPagoAssociation) {
      CajaMovimientos.belongsTo(TipoDePago, {
        foreignKey: "MetodoPago",
        targetKey: "Codigo",
        as: "TipoPago"
      });
    }

    const hasArqueoTipoPagoAssociation = Object.values(cajaArqueoAssociations).some(assoc => assoc.as === 'TipoPago');
    if (!hasArqueoTipoPagoAssociation) {
      CajaArqueoDetalle.belongsTo(TipoDePago, {
        foreignKey: "MetodoPago",
        targetKey: "Codigo",
        as: "TipoPago"
      });
    }

    // Verificar y agregar asociación de CajaMovimientos con Vendedor
    const hasUsuarioAssociation = Object.values(cajaMovimientosAssociations).some(assoc => assoc.as === 'Usuario');
    if (!hasUsuarioAssociation) {
      CajaMovimientos.belongsTo(Vendedor, {
        foreignKey: "UsuarioId",
        targetKey: "Codigo",
        as: "Usuario"
      });
    }

    // Verificar y agregar asociación hasMany de CajaCabeza a CajaArqueoDetalle
    const hasArqueosAssociation = Object.values(associations).some(assoc => assoc.as === 'Arqueos');
    if (!hasArqueosAssociation) {
      CajaCabeza.hasMany(CajaArqueoDetalle, {
        foreignKey: 'CajaCabezaId',
        as: 'Arqueos'
      });
    }

    // Verificar y agregar asociación hasMany de CajaCabeza a CajaMovimientos
    const hasMovimientosAssociation = Object.values(associations).some(assoc => assoc.as === 'Movimientos');
    if (!hasMovimientosAssociation) {
      CajaCabeza.hasMany(CajaMovimientos, {
        foreignKey: 'CajaCabezaId',
        as: 'Movimientos'
      });
    }

    console.log('✅ Asociaciones inicializadas correctamente');
  } catch (error) {
    console.error('Error al inicializar asociaciones:', error);
    throw error;
  }
}

module.exports = {
  CajaCabeza,
  CajaMovimientos,
  CajaArqueoDetalle,
  initializeAssociations
}; 