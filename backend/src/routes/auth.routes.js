const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { logAuthEvent } = require('../utils/logger');
const Empresa = require('../models/Empresa');
const DBManager = require('../utils/DBManager');
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

    // Buscar la empresa y obtener sus credenciales de BD
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

    console.log('****** Obtuvimos credenciales de la empresa:', empresaData.nombre);

    // Conectar a la base de datos de la empresa
    const empresaDB = await DBManager.getConnectionWithConfig(empresaData);
    
    // Buscar el vendedor en la base de datos de la empresa
    const [vendedor] = await empresaDB.query(
      'SELECT * FROM t_vendedores WHERE codigo = ? AND clave = ? LIMIT 1',
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

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: vendedor.Codigo,
        empresaId: empresaData.id,
        nombre: vendedor.Descripcion
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Registrar evento de login exitoso
    logAuthEvent(usuario, 'login', true, { empresaId: empresaData.id });

    // Enviar respuesta
    res.json({
      success: true,
      user: {
        id: vendedor.Codigo,
        nombre: vendedor.Descripcion,
        usuario: vendedor.Codigo,
        activo: vendedor.Activo === 1,
        permisos: vendedor.Permisos
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

    // Buscar la empresa
    const empresaData = await Empresa.findByPk(decoded.empresaId);
    if (!empresaData) {
      return res.status(401).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }

    // Verificar que la empresa esté activa
    if (empresaData.estado !== 'activo') {
      return res.status(401).json({
        success: false,
        error: 'Empresa inactiva'
      });
    }

    // Conectar a la base de datos de la empresa
    const empresaDB = await DBManager.getConnectionWithConfig(empresaData);
    
    // Buscar el vendedor
    const [vendedor] = await empresaDB.query(
      'SELECT * FROM t_vendedores WHERE codigo = ? LIMIT 1',
      {
        replacements: [decoded.userId],
        type: empresaDB.QueryTypes.SELECT
      }
    );

    if (!vendedor) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar que el vendedor esté activo
    if (vendedor.Activo !== 1) {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo'
      });
    }

    // Generar nuevo token
    const newToken = jwt.sign(
      {
        userId: vendedor.Codigo,
        empresaId: empresaData.id,
        nombre: vendedor.Descripcion
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Enviar respuesta
    res.json({
      success: true,
      user: {
        id: vendedor.Codigo,
        nombre: vendedor.Descripcion,
        usuario: vendedor.Codigo,
        activo: vendedor.Activo === 1,
        permisos: vendedor.Permisos
      },
      empresa: {
        id: empresaData.id,
        nombre: empresaData.nombre,
        baseDatos: empresaData.db_name
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