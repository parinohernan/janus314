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
      const existingConnection = this.pools.get(empresaConfig.id);
      
      // Verificar que la conexión esté activa
      try {
        await existingConnection.authenticate();
        return existingConnection;
      } catch (error) {
        console.log(`⚠️ Conexión existente inactiva para empresa ${empresaConfig.id}, creando nueva...`);
        this.pools.delete(empresaConfig.id);
      }
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

      // Crear nueva conexión con configuración optimizada
      const sequelize = new Sequelize(
        empresaConfig.db_name,
        empresaConfig.db_user,
        empresaConfig.db_password,
        {
          host: empresaConfig.db_host,
          port: empresaConfig.db_port || 3306,
          dialect: 'mysql',
          pool: {
            max: parseInt(process.env.DB_POOL_MAX || '10'),
            min: parseInt(process.env.DB_POOL_MIN || '2'),
            acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000'),
            idle: parseInt(process.env.DB_POOL_IDLE || '30000'),
            evict: parseInt(process.env.DB_POOL_EVICT || '60000')
          },
          logging: process.env.NODE_ENV === 'development',
          dialectOptions: {
            connectTimeout: 60000,
            acquireTimeout: 60000,
            timeout: 60000,
            timezone: "-03:00"
          },
          timezone: "-03:00"
        }
      );

      // Probar la conexión con timeout
      await Promise.race([
        sequelize.authenticate(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout al conectar')), 30000)
        )
      ]);
      
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

  /**
   * Cierra la conexión de una empresa y la quita del pool (p. ej. al hacer logout).
   * Invalida también la config de esa empresa en caché para que el próximo login use datos frescos.
   */
  async closeConnectionForEmpresa(empresaId) {
    if (!this.pools.has(empresaId)) {
      return;
    }
    const sequelize = this.pools.get(empresaId);
    try {
      await Promise.race([
        sequelize.close(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout cerrando conexión')), 3000)
        )
      ]);
    } catch (error) {
      console.warn(`⚠️ Error cerrando conexión empresa ${empresaId}:`, error.message);
    } finally {
      this.pools.delete(empresaId);
      console.log(`✅ Conexión cerrada y eliminada del pool para empresa ${empresaId}`);
    }
    const cacheKey = cache.getKeyForEmpresa(empresaId);
    await cache.del(cacheKey);
  }

  async shutdown() {
    console.log('🔄 Iniciando cierre de DBManager...');
    
    if (this.pools.size === 0) {
      console.log('✅ No hay conexiones activas para cerrar.');
      return;
    }

    const closePromises = [];
    const empresaIds = Array.from(this.pools.keys());
    
    for (const empresaId of empresaIds) {
      const sequelize = this.pools.get(empresaId);
      console.log(`🔄 Cerrando conexión para empresa ${empresaId}...`);
      
      // Crear promesa con timeout individual
      const closePromise = Promise.race([
        sequelize.close(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout cerrando empresa ${empresaId}`)), 3000)
        )
      ]).catch(error => {
        console.warn(`⚠️ Error cerrando conexión empresa ${empresaId}:`, error.message);
      });
      
      closePromises.push(closePromise);
    }
    
    try {
      await Promise.allSettled(closePromises);
      this.pools.clear();
      console.log('✅ Todas las conexiones de empresa cerradas.');
    } catch (error) {
      console.error('❌ Error durante cierre de conexiones:', error);
    }
    
    // Cerrar conexión Redis con timeout
    try {
      console.log('🔄 Cerrando conexión Redis...');
      await Promise.race([
        cache.shutdown(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout cerrando Redis')), 2000)
        )
      ]);
    } catch (error) {
      console.warn('⚠️ Error cerrando Redis:', error.message);
    }
    
    console.log('✅ DBManager cerrado completamente.');
  }
}

module.exports = new DBManager(); 