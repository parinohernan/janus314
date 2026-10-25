const cache = require('./cache');

const FAIL_WINDOW_SEC = 15 * 60;
const CAPTCHA_THRESHOLD = 3;
const memory = new Map();

function failKey(ip) {
  return `login:fail:${ip}`;
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

async function getFailureCount(ip) {
  const key = failKey(ip);
  try {
    if (cache.redis && cache.enabled) {
      const raw = await cache.redis.get(key);
      return raw ? parseInt(raw, 10) || 0 : 0;
    }
    const entry = memory.get(ip);
    if (!entry || Date.now() > entry.resetAt) {
      return 0;
    }
    return entry.count;
  } catch {
    return 0;
  }
}

async function recordLoginFailure(ip) {
  const key = failKey(ip);
  try {
    if (cache.redis && cache.enabled) {
      const count = await cache.redis.incr(key);
      if (count === 1) {
        await cache.redis.expire(key, FAIL_WINDOW_SEC);
      }
      return count;
    }
    const now = Date.now();
    let entry = memory.get(ip);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + FAIL_WINDOW_SEC * 1000 };
    }
    entry.count += 1;
    memory.set(ip, entry);
    return entry.count;
  } catch {
    return CAPTCHA_THRESHOLD;
  }
}

async function clearLoginFailures(ip) {
  const key = failKey(ip);
  try {
    if (cache.redis && cache.enabled) {
      await cache.redis.del(key);
    } else {
      memory.delete(ip);
    }
  } catch {
    /* ignore */
  }
}

async function requiresCaptcha(ip) {
  const count = await getFailureCount(ip);
  return count >= CAPTCHA_THRESHOLD;
}

module.exports = {
  CAPTCHA_THRESHOLD,
  FAIL_WINDOW_SEC,
  clientIp,
  getFailureCount,
  recordLoginFailure,
  clearLoginFailures,
  requiresCaptcha
};
