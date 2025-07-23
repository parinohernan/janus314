# Lógica Multiempresas - Janus314

## Arquitectura General

El sistema Janus314 utiliza una arquitectura multiempresas que permite que múltiples empresas utilicen la misma aplicación manteniendo sus datos completamente aislados. Cada empresa tiene su propia base de datos independiente.

### Componentes Principales

1. **Base de Datos Maestra** - Almacena configuración de todas las empresas
2. **Bases de Datos Específicas** - Una por cada empresa
3. **DBManager** - Gestor de conexiones dinámicas
4. **Middleware de Autenticación** - Maneja el contexto por empresa
5. **Sistema de Cache** - Optimiza consultas de configuración

## 1. Base de Datos Maestra

### Configuración
```javascript
// config/masterDB.js
const sequelize = new Sequelize(
  process.env.EMPRESAS_DB_NAME,  // janus314empresas
  process.env.EMPRESAS_DB_USER,  // root
  process.env.EMPRESAS_DB_PASSWORD,
  {
    host: process.env.EMPRESAS_DB_HOST,  // 192.168.1.104
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  }
);
```

### Modelo de Empresa
```javascript
// models/Empresa.js
Empresa.init({
  id: { 
    type: DataTypes.STRING, 
    primaryKey: true 
  },
  nombre: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  db_name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },     // Base de datos específica
  db_user: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },     // Usuario DB específica
  db_password: { 
    type: DataTypes.STRING, 
    allowNull: false 
  }, // Password DB específica
  db_host: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },     // Host DB específica
  db_port: { 
    type: DataTypes.INTEGER, 
    defaultValue: 3306 
  },
  arcaendpoint: { 
    type: DataTypes.STRING, 
    defaultValue: 'http://localhost:3301/api/astrial' 
  },
  estado: { 
    type: DataTypes.ENUM('activo', 'inactivo'), 
    defaultValue: 'activo' 
  }
});
```

## 2. Gestor de Conexiones (DBManager)

### Clase Principal
```javascript
// utils/DBManager.js
class DBManager {
  constructor() {
    if (DBManager.instance) {
      return DBManager.instance;
    }
    this.pools = new Map(); // Pool de conexiones por empresa
    DBManager.instance = this;
  }

  async getConnection(empresaId) {
    // 1. Verificar si ya existe conexión
    if (this.pools.has(empresaId)) {
      const existingConnection = this.pools.get(empresaId);
      
      // Verificar que la conexión esté activa
      try {
        await existingConnection.authenticate();
        return existingConnection;
      } catch (error) {
        console.log(`⚠️ Conexión existente inactiva para empresa ${empresaId}, creando nueva...`);
        this.pools.delete(empresaId);
      }
    }

    try {
      // 2. Intentar obtener configuración del caché
      const cacheKey = cache.getKeyForEmpresa(empresaId);
      let empresaConfig = await cache.get(cacheKey);

      if (!empresaConfig) {
        // 3. Si no está en caché, obtener de la base de datos
        const empresa = await Empresa.findByPk(empresaId);
        if (!empresa) {
          throw new Error(`Empresa con ID ${empresaId} no encontrada`);
        }

        if (empresa.estado !== 'activo') {
          throw new Error(`Empresa ${empresaId} no está activa`);
        }

        // 4. Guardar en caché
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

  async getConnectionWithConfig(empresaConfig) {
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
          logging: process.env.NODE_ENV === 'development' ? console.log : false,
          dialectOptions: {
            connectTimeout: 60000,
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
```

## 3. Flujo de Autenticación Multiempresa

### Login con Contexto de Empresa
```javascript
// routes/auth.routes.js
router.post('/online/login', async (req, res) => {
  try {
    const { usuario, password, empresa } = req.body;

    // Validar que se proporcionen todos los campos
    if (!usuario || !password || !empresa) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }

    // 1. Buscar la empresa en la base de datos maestra
    const empresaData = await Empresa.findByPk(empresa);
    if (!empresaData) {
      logAuthEvent(usuario, 'login', false, { error: 'Empresa no encontrada' });
      return res.status(401).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }

    // 2. Verificar que la empresa esté activa
    if (empresaData.estado !== 'activo') {
      logAuthEvent(usuario, 'login', false, { error: 'Empresa inactiva' });
      return res.status(401).json({
        success: false,
        error: 'Empresa inactiva'
      });
    }

    console.log('****** Obtuvimos credenciales de la empresa:', empresaData.nombre);

    // 3. Conectar a la base de datos específica de la empresa
    const empresaDB = await DBManager.getConnectionWithConfig(empresaData);
    
    // 4. Buscar el vendedor en la base de datos de la empresa
    const [vendedor] = await empresaDB.query(
      'SELECT * FROM t_vendedores WHERE codigo = ? AND activo = 1 AND clave = ? LIMIT 1',
      {
        replacements: [usuario, password],
        type: empresaDB.QueryTypes.SELECT
      }
    );

    if (!vendedor) {
      logAuthEvent(usuario, 'login', false, { error: 'Credenciales inválidas' });
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // 5. Generar JWT con información de la empresa
    const token = jwt.sign(
      {
        empresaId: empresa,
        usuario: vendedor.codigo,
        nombre: vendedor.descripcion,
        tipo: 'vendedor'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 6. Registrar evento de login exitoso
    logAuthEvent(usuario, 'login', true, { empresa: empresaData.nombre });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        usuario: {
          codigo: vendedor.codigo,
          nombre: vendedor.descripcion,
          empresa: empresaData.nombre
        }
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    logAuthEvent(req.body?.usuario, 'login', false, { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});
```

## 4. Middleware de Conexión por Request

### Middleware Principal
```javascript
// middleware/dbConnection.js
const getEmpresaConnection = async (req, res, next) => {
  try {
    // 1. Obtener el token del header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación'
      });
    }

    // 2. Verificar formato del token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido'
      });
    }

    const token = parts[1];

    // 3. Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Buscar la empresa
    const empresaData = await Empresa.findByPk(decoded.empresaId);
    if (!empresaData) {
      return res.status(401).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }

    // 5. Verificar que la empresa esté activa
    if (empresaData.estado !== 'activo') {
      return res.status(401).json({
        success: false,
        error: 'Empresa inactiva'
      });
    }

    console.log('🔄 Inicializando conexión para ruta:', req.path);
    console.log('📦 Empresa:', empresaData.nombre);
    console.log('📦 vendedor:', req.body.Vendedor);
    
    // 6. Obtener la conexión específica de la empresa
    const empresaDB = await Promise.race([
      DBManager.getConnectionWithConfig(empresaData),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al obtener conexión de empresa')), 45000)
      )
    ]);
    
    // 7. Inicializar los modelos con la conexión de la empresa
    console.log('Inicializando modelos...');
    const models = initializeModels(empresaDB);
    
    // 8. Verificar que los modelos se inicializaron correctamente
    if (!models) {
      console.error('❌ Error: No se pudieron inicializar los modelos');
      return res.status(500).json({
        success: false,
        error: 'Error al inicializar los modelos'
      });
    }

    // 9. Verificar que los modelos necesarios estén presentes
    const modelosRequeridos = ['ReciboItem', 'ReciboValor', 'ReciboCabeza', 'Cliente'];
    const modelosFaltantes = modelosRequeridos.filter(modelo => !models[modelo]);
    
    if (modelosFaltantes.length > 0) {
      console.error('❌ Error: Faltan los siguientes modelos:', modelosFaltantes);
      return res.status(500).json({
        success: false,
        error: `Error al inicializar los modelos: Faltan ${modelosFaltantes.join(', ')}`
      });
    }

    console.log('✅ Modelos inicializados correctamente');
    
    // 10. Agregar la conexión, modelos y datos al request
    req.db = empresaDB;
    req.models = models;
    req.empresaData = empresaData;
    req.userData = decoded;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }
    if (error.message.includes('Timeout')) {
      console.error('❌ Error de timeout en conexión:', error);
      return res.status(503).json({
        success: false,
        error: 'Servicio temporalmente no disponible - Timeout de conexión'
      });
    }
    console.error('❌ Error en middleware de conexión:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};
```

## 5. Sistema de Cache

### Clase Cache
```javascript
// utils/cache.js
class Cache {
  constructor() {
    if (Cache.instance) {
      return Cache.instance;
    }

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.DEFAULT_TTL = 24 * 60 * 60; // 24 horas en segundos
    Cache.instance = this;
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error al obtener de caché:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.DEFAULT_TTL) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error al guardar en caché:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Error al eliminar de caché:', error);
      return false;
    }
  }

  getKeyForEmpresa(empresaId) {
    return `empresa:${empresaId}:config`;
  }

  async shutdown() {
    try {
      console.log('🔄 Cerrando conexión Redis...');
      
      // Verificar si Redis está conectado
      if (this.redis.status === 'ready') {
        await this.redis.quit();
        console.log('✅ Conexión Redis cerrada correctamente');
      } else {
        console.log('⚠️ Redis no estaba conectado');
      }
    } catch (error) {
      console.error('❌ Error al cerrar conexión Redis:', error);
    }
  }
}

module.exports = new Cache();
```

## 6. Estructura de Base de Datos

### Diagrama de Arquitectura
```
📁 Base de Datos Maestra (janus314empresas)
├── 📄 empresas
│   ├── id: "1"
│   ├── nombre: "Empresa A"
│   ├── db_name: "empresa_a_db"
│   ├── db_host: "192.168.1.104"
│   ├── db_user: "empresa_a_user"
│   ├── db_password: "empresa_a_pass"
│   └── estado: "activo"
│
│   ├── id: "2"
│   ├── nombre: "Empresa B"
│   ├── db_name: "empresa_b_db"
│   ├── db_host: "192.168.1.104"
│   ├── db_user: "empresa_b_user"
│   ├── db_password: "empresa_b_pass"
│   └── estado: "activo"

📁 Base de Datos Empresa A (empresa_a_db)
├── 📄 facturacabeza
├── 📄 facturaitems
├── 📄 clientes
├── 📄 articulos
├── 📄 t_vendedores
├── 📄 t_usuarios
├── 📄 t_configuracion
└── 📄 reciboscabeza

📁 Base de Datos Empresa B (empresa_b_db)
├── 📄 facturacabeza
├── 📄 facturaitems
├── 📄 clientes
├── 📄 articulos
├── 📄 t_vendedores
├── 📄 t_usuarios
├── 📄 t_configuracion
└── 📄 reciboscabeza
```

## 7. Flujo Completo de una Petición

### Secuencia de Operaciones
```
1. CLIENTE → Login Request
   ├── usuario: "vendedor1"
   ├── password: "123456"
   └── empresa: "1"

2. SERVIDOR → Validar Empresa
   ├── Buscar en BD maestra (janus314empresas)
   ├── Verificar estado "activo"
   └── Obtener credenciales de BD específica

3. SERVIDOR → Conectar a BD Empresa
   ├── Crear conexión Sequelize
   ├── Autenticar conexión
   └── Inicializar modelos

4. SERVIDOR → Autenticar Usuario
   ├── Query: SELECT * FROM t_vendedores WHERE codigo = ? AND activo = 1 AND clave = ?
   └── Verificar credenciales

5. SERVIDOR → Generar JWT
   ├── empresaId: "1"
   ├── usuario: "vendedor1"
   ├── nombre: "Juan Pérez"
   └── exp: 24h

6. CLIENTE → Request con JWT
   ├── Authorization: Bearer <token>
   └── POST /api/facturas

7. MIDDLEWARE → Procesar Request
   ├── Decodificar JWT
   ├── Extraer empresaId
   ├── Conectar a BD específica
   ├── Inicializar modelos
   └── Adjuntar al request

8. CONTROLLER → Ejecutar Lógica
   ├── req.db → Conexión específica
   ├── req.models → Modelos de la empresa
   ├── req.empresaData → Configuración empresa
   └── req.userData → Datos del usuario

9. RESPUESTA → Datos de la empresa específica
   └── Solo datos de la empresa del usuario
```

## 8. Ventajas de esta Arquitectura

### ✅ Aislamiento Total
- Cada empresa tiene su propia base de datos
- No hay posibilidad de mezcla de datos
- Seguridad máxima entre empresas

### ✅ Escalabilidad
- Fácil agregar nuevas empresas
- Cada empresa puede crecer independientemente
- Posibilidad de distribuir bases de datos en diferentes servidores

### ✅ Mantenimiento
- Problemas en una empresa no afectan a otras
- Backups independientes por empresa
- Actualizaciones pueden ser graduales

### ✅ Personalización
- Cada empresa puede tener configuraciones específicas
- Diferentes versiones de esquemas por empresa
- Configuraciones de ARCA específicas

### ✅ Performance
- Consultas más rápidas (bases de datos más pequeñas)
- Índices optimizados por empresa
- Cache específico por empresa

## 9. Consideraciones de Seguridad

### JWT con Contexto de Empresa
```javascript
// El JWT siempre incluye el empresaId
const token = jwt.sign({
  empresaId: empresa,        // Obligatorio para todas las operaciones
  usuario: vendedor.codigo,  // Usuario específico de la empresa
  nombre: vendedor.descripcion,
  tipo: 'vendedor'
}, process.env.JWT_SECRET, { expiresIn: '24h' });
```

### Validación en Cada Request
```javascript
// Middleware valida empresa en cada request
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const empresaData = await Empresa.findByPk(decoded.empresaId);

// Verificar que la empresa esté activa
if (empresaData.estado !== 'activo') {
  return res.status(401).json({
    success: false,
    error: 'Empresa inactiva'
  });
}
```

### Pool de Conexiones Aislado
```javascript
// Cada empresa tiene su propio pool de conexiones
this.pools = new Map(); // empresaId -> Sequelize instance

// No hay posibilidad de acceder a datos de otra empresa
const empresaDB = this.pools.get(empresaId);
```

## 10. Monitoreo y Logs

### Logs por Empresa
```javascript
// Todos los logs incluyen contexto de empresa
console.log('🔄 Inicializando conexión para ruta:', req.path);
console.log('📦 Empresa:', empresaData.nombre);
console.log('📦 vendedor:', req.body.Vendedor);
```

### Métricas de Pool
```javascript
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
```

## 11. Manejo de Errores

### Timeouts y Reconexión
```javascript
// Timeout en conexiones
await Promise.race([
  sequelize.authenticate(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout al conectar')), 30000)
  )
]);

// Verificación de conexiones activas
try {
  await existingConnection.authenticate();
  return existingConnection;
} catch (error) {
  console.log(`⚠️ Conexión existente inactiva para empresa ${empresaId}, creando nueva...`);
  this.pools.delete(empresaId);
}
```

### Cache Invalidation
```javascript
// Si hay error, invalidar el caché
const cacheKey = cache.getKeyForEmpresa(empresaId);
await cache.del(cacheKey);
```

## 12. Configuración de Entorno

### Variables de Entorno Requeridas
```bash
# Base de datos maestra
EMPRESAS_DB_HOST=192.168.1.104
EMPRESAS_DB_NAME=janus314empresas
EMPRESAS_DB_USER=root
EMPRESAS_DB_PASSWORD=tu_password

# Pool de conexiones
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_POOL_ACQUIRE=60000
DB_POOL_IDLE=30000

# JWT
JWT_SECRET=tu_jwt_secret_aqui

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Esta arquitectura multiempresas proporciona un sistema robusto, escalable y seguro para manejar múltiples empresas en una sola aplicación.
