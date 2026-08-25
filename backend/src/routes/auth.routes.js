const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { logAuthEvent } = require('../utils/logger');
const DBManager = require('../utils/DBManager');
const { loginRateLimit } = require('../middleware/loginRateLimit');
const authService = require('../services/auth.service');

function sendAuthError(res, error, usuario) {
  if (error.status && error.status < 500) {
    logAuthEvent(usuario || 'unknown', 'login', false, { error: error.message });
    return res.status(error.status).json({
      success: false,
      error: error.message
    });
  }
  console.error('Error en autenticación:', error);
  logAuthEvent(usuario || 'unknown', 'login', false, { error: error.message });
  return res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
}

router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }
    const payload = await authService.loginWithPassword(usuario, password);
    res.json(payload);
  } catch (error) {
    sendAuthError(res, error, req.body?.usuario);
  }
});

router.post('/online/login', loginRateLimit, async (req, res) => {
  try {
    const { usuario, password, empresa } = req.body;
    if (!usuario || !password || !empresa) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }
    const payload = await authService.loginLegacy(usuario, password, empresa);
    res.json(payload);
  } catch (error) {
    sendAuthError(res, error, req.body?.usuario);
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
    sendAuthError(res, error, req.body?.usuario);
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
