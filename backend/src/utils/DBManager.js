const { Sequelize } = require('sequelize');
const Empresa = require('../models/Empresa');
const cache = require('./cache');
const NotaCreditoCabeza = require('../models/notaCreditoCabeza.model');
const NotaCreditoItem = require('../models/notaCreditoItem.model');
const Cliente = require('../models/cliente.model');
const Articulo = require('../models/articulo.model');
const CajaCabeza = require('../models/cajaCabeza.model');
const CajaMovimientos = require('../models/cajaMovimientos.model');
const CajaArqueoDetalle = require('../models/cajaArqueoDetalle.model');
const { initializeAssociations } = require('../models/cajaAssociations');

// NUEVO: importar modelos de factura y dependencias
const FacturaCabezaDef = require('../models/facturaCabeza.model');
const FacturaItemDef = require('../models/facturaItem.model');
const UsuarioDef = require('../models/usuario.model');
const VendedorDef = require('../models/vendedor.model');
const ConfiguracionDef = require('../models/configuracion.model');

class DBManager {
  constructor() {
    if (DBManager.instance) {
      return DBManager.instance;
    }
    this.pools = new Map();
    DBManager.instance = this;
  }

  async initModels(sequelize) {
    // Definir los modelos para esta conexión
    NotaCreditoCabeza.init(NotaCreditoCabeza.getAttributes(), {
      sequelize,
      tableName: 'notacreditocabeza',
      timestamps: false,
    });

    NotaCreditoItem.init(NotaCreditoItem.getAttributes(), {
      sequelize,
      tableName: 'notacreditoitems',
      timestamps: false,
    });

    Cliente.init(Cliente.getAttributes(), {
      sequelize,
      tableName: 'clientes',
      timestamps: false,
    });

    Articulo.init(Articulo.getAttributes(), {
      sequelize,
      tableName: 'articulos',
      timestamps: false,
    });

    // NUEVO: inicializar modelos de factura y dependencias
    UsuarioDef.init(UsuarioDef.getAttributes(), {
      sequelize,
      tableName: 't_usuarios',
      timestamps: false,
    });
    VendedorDef.init(VendedorDef.getAttributes(), {
      sequelize,
      tableName: 't_vendedores',
      timestamps: false,
    });
    FacturaCabezaDef.init(FacturaCabezaDef.getAttributes(), {
      sequelize,
      tableName: 'facturacabeza',
      timestamps: false,
    });
    FacturaItemDef.init(FacturaItemDef.getAttributes(), {
      sequelize,
      tableName: 'facturaitems',
      timestamps: false,
    });
    ConfiguracionDef.init(ConfiguracionDef.getAttributes(), {
      sequelize,
      tableName: 't_configuracion',
      timestamps: false,
    });

    // Inicializar modelos de caja y sus asociaciones
    await initializeAssociations(sequelize);

    // Establecer las asociaciones
    NotaCreditoCabeza.belongsTo(Cliente, {
      foreignKey: "CodigoCliente",
      targetKey: "Codigo",
    });

    NotaCreditoItem.belongsTo(Articulo, {
      foreignKey: "CodigoArticulo",
      targetKey: "Codigo",
    });

    // NUEVO: asociaciones de factura
    FacturaCabezaDef.belongsTo(Cliente, {
      foreignKey: "ClienteCodigo",
      targetKey: "Codigo",
    });
    FacturaCabezaDef.belongsTo(UsuarioDef, {
      foreignKey: "CodigoUsuario",
      targetKey: "Codigo",
    });
    FacturaCabezaDef.belongsTo(VendedorDef, {
      foreignKey: "VendedorCodigo",
      targetKey: "Codigo",
    });
    FacturaCabezaDef.hasMany(FacturaItemDef, {
      foreignKey: ["DocumentoTipo", "DocumentoSucursal", "DocumentoNumero"]
    });
    FacturaItemDef.belongsTo(Articulo, {
      foreignKey: "CodigoArticulo",
      targetKey: "Codigo"
    });

    console.log('✅ Modelos inicializados correctamente para la conexión');

    // Retornar los modelos inicializados
    return {
      NotaCreditoCabeza,
      NotaCreditoItem,
      Cliente,
      Articulo,
      CajaCabeza,
      CajaMovimientos,
      CajaArqueoDetalle,
      // NUEVO:
      FacturaCabeza: FacturaCabezaDef,
      FacturaItem: FacturaItemDef,
      Usuario: UsuarioDef,
      Vendedor: VendedorDef,
      Configuracion: ConfiguracionDef
    };
  }

  async getConnectionWithConfig(empresaConfig) {
    // Si ya existe una conexión, la retornamos
    if (this.pools.has(empresaConfig.id)) {
      return this.pools.get(empresaConfig.id);
    }

    try {
      // Mostrar información de conexión
      console.log('=== Datos de conexión para empresa ===');
      console.log('ID Empresa:', empresaConfig.id);
      console.log('Nombre Empresa:', empresaConfig.nombre);
      console.log('Host:', empresaConfig.db_host);
      console.log('Puerto:', empresaConfig.db_port || 3306);
      console.log('Base de datos:', empresaConfig.db_name);
      console.log('Usuario:', empresaConfig.db_user);
      console.log('===================================');

      // Crear nueva conexión
      const sequelize = new Sequelize(
        empresaConfig.db_name,
        empresaConfig.db_user,
        empresaConfig.db_password,
        {
          host: empresaConfig.db_host,
          port: empresaConfig.db_port || 3306,
          dialect: 'mysql',
          pool: {
            max: parseInt(process.env.DB_POOL_MAX || '5'),
            min: parseInt(process.env.DB_POOL_MIN || '0'),
            acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
            idle: parseInt(process.env.DB_POOL_IDLE || '10000')
          },
          logging: process.env.NODE_ENV === 'development'
        }
      );

      // Probar la conexión
      await sequelize.authenticate();
      console.log('✅ Conexión establecida exitosamente para empresa:', empresaConfig.nombre);

      // Inicializar los modelos para esta conexión
      await this.initModels(sequelize);
      
      // Guardar en el pool
      this.pools.set(empresaConfig.id, sequelize);
      
      return sequelize;
    } catch (error) {
      console.error(`❌ Error al obtener conexión para empresa ${empresaConfig.id}:`, error);
      throw error;
    }
  }

  async getConnection(empresaId) {
    // Si ya existe una conexión, la retornamos
    if (this.pools.has(empresaId)) {
      return this.pools.get(empresaId);
    }

    try {
      // Intentar obtener configuración del caché
      const cacheKey = cache.getKeyForEmpresa(empresaId);
      let empresaConfig = await cache.get(cacheKey);

      if (!empresaConfig) {
        // Si no está en caché, obtener de la base de datos
        const empresa = await Empresa.findByPk(empresaId);
        if (!empresa) {
          throw new Error(`Empresa con ID ${empresaId} no encontrada`);
        }

        if (empresa.estado !== 'activo') {
          throw new Error(`Empresa ${empresaId} no está activa`);
        }

        // Guardar en caché
        empresaConfig = empresa.toJSON();
        await cache.set(cacheKey, empresaConfig);
      }

      return this.getConnectionWithConfig(empresaConfig);
    } catch (error) {
      // Si hay error, invalidar el caché
      const cacheKey = cache.getKeyForEmpresa(empresaId);
      await cache.del(cacheKey);
      
      console.error(`Error al obtener conexión para empresa ${empresaId}:`, error);
      throw error;
    }
  }

  async getPoolStatus() {
    const status = {};
    for (const [empresaId, sequelize] of this.pools.entries()) {
      status[empresaId] = {
        active: sequelize.connectionManager.pool.totalCount - sequelize.connectionManager.pool.idleCount,
        max: sequelize.connectionManager.pool.maxSize,
        idle: sequelize.connectionManager.pool.idleCount
      };
    }
    return status;
  }

  async shutdown() {
    const closePromises = [];
    for (const [empresaId, sequelize] of this.pools.entries()) {
      console.log(`Cerrando conexión para empresa ${empresaId}...`);
      closePromises.push(sequelize.close());
    }
    await Promise.all(closePromises);
    this.pools.clear();
    
    // Cerrar conexión Redis
    await cache.shutdown();
    
    console.log('Todas las conexiones han sido cerradas.');
  }
}

module.exports = new DBManager(); 