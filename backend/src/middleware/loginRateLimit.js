const cache = require('../utils/cache');

const WINDOW_SEC = 60;
const MAX_ATTEMPTS = 10;
const memory = new Map();

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

async function loginRateLimit(req, res, next) {
  const ip = clientIp(req);
  const key = `login:rl:${ip}`;

  try {
    if (cache.redis && cache.enabled) {
      const count = await cache.redis.incr(key);
      if (count === 1) {
        await cache.redis.expire(key, WINDOW_SEC);
      }
      if (count > MAX_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          error: 'Demasiados intentos. Probá de nuevo en un minuto.'
        });
      }
    } else {
      const now = Date.now();
      let entry = memory.get(ip);
      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + WINDOW_SEC * 1000 };
      }
      entry.count += 1;
      memory.set(ip, entry);
      if (entry.count > MAX_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          error: 'Demasiados intentos. Probá de nuevo en un minuto.'
        });
      }
    }
  } catch (error) {
    // Si el límite falla, no bloquear el login
    console.warn('Rate limit de login no disponible:', error.message);
  }

  next();
}

module.exports = {
  loginRateLimit,
  MAX_ATTEMPTS,
  WINDOW_SEC
};
