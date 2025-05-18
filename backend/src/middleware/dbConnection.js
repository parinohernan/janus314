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

    // Verificar que la empresa esté activa
    if (empresaData.estado !== 'activo') {
      return res.status(401).json({
        success: false,
        error: 'Empresa inactiva'
      });
    }

    console.log('🔄 Inicializando conexión para ruta:', req.path);
    console.log('📦 Empresa:', empresaData.nombre);
    
    // Obtener la conexión
    const empresaDB = await DBManager.getConnectionWithConfig(empresaData);
    
    // Inicializar los modelos con la conexión de la empresa
    const models = initializeModels(empresaDB);
    
    // Verificar que los modelos se inicializaron correctamente
    if (!models) {
      console.error('❌ Error: No se pudieron inicializar los modelos');
      return res.status(500).json({
        success: false,
        error: 'Error al inicializar los modelos'
      });
    }

    console.log('✅ Modelos inicializados correctamente');
    
    // Agregar la conexión, modelos y datos al request
    req.db = empresaDB;
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
    console.error('❌ Error en middleware de conexión:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

module.exports = getEmpresaConnection; 