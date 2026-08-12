const jwt = require('jsonwebtoken');
const Empresa = require('../models/Empresa');
const DBManager = require('../utils/DBManager');
const initializeModels = require('../utils/modelInitializer');

const getEmpresaConnection = async (req, res, next) => {
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
    // console.log('🔄 Empresa encontrada:', empresaData.nombre);
    // Verificar que la empresa esté activa
    if (empresaData.estado !== 'activo') {
      return res.status(401).json({
        success: false,
        error: 'Empresa inactiva'
      });
    }

    
    // ✅ Agregar timeout para operaciones de base de datos
    const empresaDB = await Promise.race([
      DBManager.getConnectionWithConfig(empresaData),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al obtener conexión de empresa')), 30000)
      )
    ]);
    
    // Inicializar los modelos con la conexión de la empresa
    console.log('Inicializando modelos...');
    const models = initializeModels(empresaDB);
    
    // Verificar que los modelos se inicializaron correctamente
    if (!models) {
      console.error('❌ Error: No se pudieron inicializar los modelos');
      return res.status(500).json({
        success: false,
        error: 'Error al inicializar los modelos'
      });
    }

    // Verificar específicamente ReciboItem y ReciboValor
    console.log('Verificando modelos específicos:');
    console.log('- ReciboItem:', !!models.ReciboItem);
    console.log('- ReciboValor:', !!models.ReciboValor);
    console.log('- Modelos disponibles:', Object.keys(models));

    // Verificar que los modelos necesarios estén presentes
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
    
    // Agregar la conexión, modelos y datos al request
    req.db = empresaDB;
    req.dbConnection = empresaDB;
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

/**
 * Solo valida JWT y empresa activa (tabla maestra). No abre la BD de la empresa ni inicializa modelos.
 * Útil para endpoints que no usan datos de la empresa en MySQL (p. ej. listado Cloudinary).
 */
async function requireAuthEmpresaOnly(req, res, next) {
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

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const empresaData = await Empresa.findByPk(decoded.empresaId);
    if (!empresaData) {
      return res.status(401).json({
        success: false,
        error: 'Empresa no encontrada'
      });
    }
    if (empresaData.estado !== 'activo') {
      return res.status(401).json({
        success: false,
        error: 'Empresa inactiva'
      });
    }

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
    console.error('❌ Error en requireAuthEmpresaOnly:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

module.exports = getEmpresaConnection;
module.exports.requireAuthEmpresaOnly = requireAuthEmpresaOnly; 