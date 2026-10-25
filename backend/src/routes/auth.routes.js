const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { logAuthEvent } = require('../utils/logger');
const DBManager = require('../utils/DBManager');
const { loginRateLimit } = require('../middleware/loginRateLimit');
const { enforceLoginCaptcha } = require('../middleware/loginCaptcha');
const loginAttemptTracker = require('../utils/loginAttemptTracker');
const loginCaptcha = require('../services/loginCaptcha.service');
const authService = require('../services/auth.service');

async function sendAuthError(res, error, usuario, req) {
  if (error.status && error.status < 500) {
    logAuthEvent(usuario || 'unknown', 'login', false, { error: error.message });
    let requireCaptcha = false;
    if (req && error.status === 401) {
      const ip = loginAttemptTracker.clientIp(req);
      const failures = await loginAttemptTracker.recordLoginFailure(ip);
      requireCaptcha = failures >= loginAttemptTracker.CAPTCHA_THRESHOLD;
    }
    return res.status(error.status).json({
      success: false,
      error: error.message,
      ...(requireCaptcha ? { requireCaptcha: true } : {})
    });
  }
  console.error('Error en autenticación:', error);
  logAuthEvent(usuario || 'unknown', 'login', false, { error: error.message });
  return res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
}

router.get('/login-guard', async (req, res) => {
  try {
    const ip = loginAttemptTracker.clientIp(req);
    const requireCaptcha = await loginAttemptTracker.requiresCaptcha(ip);
    res.json({
      success: true,
      requireCaptcha,
      threshold: loginAttemptTracker.CAPTCHA_THRESHOLD
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'No se pudo consultar el estado de seguridad'
    });
  }
});

router.get('/captcha-challenge', async (req, res) => {
  try {
    const challenge = await loginCaptcha.createChallenge();
    res.json({ success: true, ...challenge });
  } catch (error) {
    console.error('Error generando captcha:', error);
    res.status(500).json({
      success: false,
      error: 'No se pudo generar la verificación'
    });
  }
});

async function clearFailuresOnSuccess(req) {
  const ip = loginAttemptTracker.clientIp(req);
  await loginAttemptTracker.clearLoginFailures(ip);
}

router.post('/login', loginRateLimit, enforceLoginCaptcha, async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }
    const payload = await authService.loginWithPassword(usuario, password);
    await clearFailuresOnSuccess(req);
    res.json(payload);
  } catch (error) {
    await sendAuthError(res, error, req.body?.usuario, req);
  }
});

router.post('/online/login', loginRateLimit, enforceLoginCaptcha, async (req, res) => {
  try {
    const { usuario, password, empresa } = req.body;
    if (!usuario || !password || !empresa) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }
    const payload = await authService.loginLegacy(usuario, password, empresa);
    await clearFailuresOnSuccess(req);
    res.json(payload);
  } catch (error) {
    await sendAuthError(res, error, req.body?.usuario, req);
  }
});

router.post('/asociar', loginRateLimit, async (req, res) => {
  try {
    const { usuario, password, empresa, vendedor, clave } = req.body;
    const payload = await authService.asociarCuenta({
      usuario,
      password,
      empresaId: empresa,
      vendedorCodigo: vendedor,
      claveVendedor: clave
    });
    res.status(201).json(payload);
  } catch (error) {
    await sendAuthError(res, error, req.body?.usuario, req);
  }
});

router.post('/superadmin/login', loginRateLimit, async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }
    const payload = await authService.loginSuperadmin(usuario, password);
    res.json(payload);
  } catch (error) {
    sendAuthError(res, error, req.body?.usuario, req);
  }
});

router.get('/online/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido'
      });
    }

    const payload = await authService.verifySession(parts[1]);
    res.json(payload);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message
      });
    }
    console.error('Error en verify:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

router.post('/online/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const empresaId = decoded.empresaId;
        if (empresaId) {
          await DBManager.closeConnectionForEmpresa(empresaId);
        }
      } catch (err) {
        // Token inválido o expirado: no hacer nada, el frontend limpiará igual
      }
    }
  } catch (err) {
    console.warn('Error al cerrar conexión en logout:', err.message);
  }
  res.json({
    success: true,
    message: 'Sesión cerrada correctamente'
  });
});

module.exports = router;
