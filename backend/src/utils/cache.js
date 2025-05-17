const Redis = require('ioredis');
const { promisify } = require('util');

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

  async flush() {
    try {
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
      await this.redis.quit();
      console.log('Conexión Redis cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar conexión Redis:', error);
    }
  }
}

module.exports = new Cache(); 