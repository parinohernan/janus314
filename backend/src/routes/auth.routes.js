const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { logAuthEvent } = require('../utils/logger');
const { Empresa } = require('../models/Empresa');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');

// Login para modo online
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

    // Buscar la empresa
    const empresaData = await Empresa.findByPk(empresa);
    if (!empresaData) {
      logAuthEvent(usuario, 'login', false, { error: 'Empresa no encontrada' });
      return res.status(401).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }

    // Verificar que la empresa esté activa
    if (empresaData.estado !== 'activo') {
      logAuthEvent(usuario, 'login', false, { error: 'Empresa inactiva' });
      return res.status(401).json({
        success: false,
        error: 'Empresa inactiva'
      });
    }

    // Buscar el usuario
    const usuarioData = await Usuario.findOne({
      where: { usuario }
    });

    if (!usuarioData) {
      logAuthEvent(usuario, 'login', false, { error: 'Usuario no encontrado' });
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar que el usuario esté activo
    if (!usuarioData.activo) {
      logAuthEvent(usuario, 'login', false, { error: 'Usuario inactivo' });
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo'
      });
    }

    // Verificar la contraseña
    const passwordValida = await usuarioData.comparePassword(password);
    if (!passwordValida) {
      logAuthEvent(usuario, 'login', false, { error: 'Contraseña inválida' });
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: usuarioData.id,
        empresaId: empresaData.id,
        isAdmin: usuarioData.rol === 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Actualizar último acceso
    await usuarioData.update({
      ultimoAcceso: new Date()
    });

    // Registrar evento de login exitoso
    logAuthEvent(usuario, 'login', true, { empresaId: empresaData.id });

    // Enviar respuesta
    res.json({
      success: true,
      user: {
        id: usuarioData.id,
        nombre: usuarioData.nombre,
        apellido: usuarioData.apellido,
        usuario: usuarioData.usuario,
        rol: usuarioData.rol,
        activo: usuarioData.activo,
        fechaCreacion: usuarioData.fechaCreacion,
        ultimoAcceso: usuarioData.ultimoAcceso
      },
      empresa: {
        id: empresaData.id,
        nombre: empresaData.nombre,
        baseDatos: empresaData.db_name
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    logAuthEvent(req.body.usuario || 'unknown', 'login', false, { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Verificar token
router.get('/online/verify', async (req, res) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación'
      });
    }

    // Verificar formato del token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido'
      });
    }

    const token = parts[1];

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario
    const usuario = await Usuario.findByPk(decoded.userId);
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo'
      });
    }

    // Buscar la empresa
    const empresa = await Empresa.findByPk(decoded.empresaId);
    if (!empresa) {
      return res.status(401).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }

    // Verificar que la empresa esté activa
    if (empresa.estado !== 'activo') {
      return res.status(401).json({
        success: false,
        error: 'Empresa inactiva'
      });
    }

    // Generar nuevo token
    const newToken = jwt.sign(
      {
        userId: usuario.id,
        empresaId: empresa.id,
        isAdmin: usuario.rol === 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Enviar respuesta
    res.json({
      success: true,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        usuario: usuario.usuario,
        rol: usuario.rol,
        activo: usuario.activo,
        fechaCreacion: usuario.fechaCreacion,
        ultimoAcceso: usuario.ultimoAcceso
      },
      empresa: {
        id: empresa.id,
        nombre: empresa.nombre,
        baseDatos: empresa.db_name
      },
      token: newToken
    });
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
    console.error('Error en verify:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Logout
router.post('/online/logout', (req, res) => {
  // En el frontend se eliminará el token del localStorage
  res.json({
    success: true,
    message: 'Sesión cerrada correctamente'
  });
});

module.exports = router; 