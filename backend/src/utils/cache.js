const Redis = require('ioredis');

class Cache {
  constructor() {
    if (Cache.instance) {
      return Cache.instance;
    }

    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
    const redisPassword = process.env.REDIS_PASSWORD;

    // Modo seguro: si no hay configuración de Redis, deshabilitar caché sin romper la app
    if (!redisUrl && !redisHost) {
      this.redis = null;
      this.enabled = false;
      console.warn('⚠️ Redis no configurado (faltan REDIS_URL o REDIS_HOST). Caché deshabilitado.');
    } else {
      try {
        if (redisUrl) {
          // Permite rediss:// en proveedores gestionados
          this.redis = new Redis(redisUrl, {
            tls: redisUrl.startsWith('rediss://') ? {} : undefined,
            retryStrategy: (times) => Math.min(times * 50, 2000)
          });
        } else {
          this.redis = new Redis({
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            retryStrategy: (times) => Math.min(times * 50, 2000)
          });
        }
        this.enabled = true;
      } catch (error) {
        console.warn('⚠️ No se pudo inicializar Redis. Caché deshabilitado.', error.message);
        this.redis = null;
        this.enabled = false;
      }
    }

    this.DEFAULT_TTL = 24 * 60 * 60; // 24 horas en segundos
    Cache.instance = this;
  }

  async get(key) {
    try {
      if (!this.redis) return null;
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error al obtener de caché:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.DEFAULT_TTL) {
    try {
      if (!this.redis) return true; // no-op si caché deshabilitado
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error al guardar en caché:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.redis) return true; // no-op
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Error al eliminar de caché:', error);
      return false;
    }
  }

  async flush() {
    try {
      if (!this.redis) return true; // no-op
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('Error al limpiar caché:', error);
      return false;
    }
  }

  getKeyForEmpresa(empresaId) {
    return `empresa:${empresaId}:config`;
  }

  async shutdown() {
    try {
      console.log('🔄 Cerrando conexión Redis...');
      if (!this.redis) {
        console.log('ℹ️ Caché deshabilitado, no hay conexión Redis que cerrar');
        return;
      }
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