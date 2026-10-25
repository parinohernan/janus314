const crypto = require('crypto');
const cache = require('../utils/cache');

const CAPTCHA_TTL_SEC = 10 * 60;
const memory = new Map();

function randomInt(min, max) {
  return crypto.randomInt(min, max + 1);
}

function buildMathChallenge() {
  const a = randomInt(1, 12);
  const b = randomInt(1, 12);
  const subtract = randomInt(0, 1) === 1 && a > b;
  if (subtract) {
    return { question: `¿Cuánto es ${a} − ${b}?`, answer: String(a - b) };
  }
  return { question: `¿Cuánto es ${a} + ${b}?`, answer: String(a + b) };
}

function normalizeAnswer(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '');
}

async function storeAnswer(id, answer) {
  const key = `login:captcha:${id}`;
  try {
    if (cache.redis && cache.enabled) {
      await cache.redis.set(key, answer, 'EX', CAPTCHA_TTL_SEC);
      return;
    }
    memory.set(id, { answer, expiresAt: Date.now() + CAPTCHA_TTL_SEC * 1000 });
  } catch (error) {
    memory.set(id, { answer, expiresAt: Date.now() + CAPTCHA_TTL_SEC * 1000 });
    console.warn('Captcha en memoria (Redis no disponible):', error.message);
  }
}

async function consumeAnswer(id) {
  const key = `login:captcha:${id}`;
  try {
    if (cache.redis && cache.enabled) {
      const answer = await cache.redis.get(key);
      if (answer) {
        await cache.redis.del(key);
      }
      return answer;
    }
    const entry = memory.get(id);
    memory.delete(id);
    if (!entry || Date.now() > entry.expiresAt) {
      return null;
    }
    return entry.answer;
  } catch {
    return null;
  }
}

async function createChallenge() {
  const { question, answer } = buildMathChallenge();
  const id = crypto.randomUUID();
  await storeAnswer(id, answer);
  return { captchaId: id, question };
}

async function verifyChallenge(captchaId, captchaAnswer) {
  if (!captchaId || captchaAnswer === undefined || captchaAnswer === null) {
    return false;
  }
  const expected = await consumeAnswer(String(captchaId));
  if (expected == null) {
    return false;
  }
  return normalizeAnswer(expected) === normalizeAnswer(captchaAnswer);
}

module.exports = {
  CAPTCHA_TTL_SEC,
  createChallenge,
  verifyChallenge,
  normalizeAnswer,
  buildMathChallenge
};
