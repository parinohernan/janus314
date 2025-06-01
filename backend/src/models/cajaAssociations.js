const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CajaCabeza = require('./cajaCabeza.model');
const CajaMovimientos = require('./cajaMovimientos.model');
const CajaArqueoDetalle = require('./cajaArqueoDetalle.model');
const Vendedor = require('./vendedor.model');
const TipoDePago = require('./tipoDePago.model');

async function initializeAssociations() {
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
        tableName: 'caja_cabeza',
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

    console.log('Estableciendo asociaciones...');

    // Asociaciones CajaCabeza
    CajaCabeza.belongsTo(Vendedor, { 
      foreignKey: 'VendedorId', 
      as: 'Vendedor',
      targetKey: 'Codigo'
    });

    // Asociaciones CajaMovimientos
    CajaMovimientos.belongsTo(CajaCabeza, { 
      foreignKey: 'CajaCabezaId', 
      as: 'Caja' 
    });

    CajaArqueoDetalle.belongsTo(CajaCabeza, { 
      foreignKey: 'CajaCabezaId', 
      as: 'Caja' 
    });

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