const jwt = require('jsonwebtoken');
const DBManager = require('../utils/DBManager');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_temporal', async (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Token inválido o expirado'
        });
      }

      try {
        // Obtener la conexión para la empresa del usuario
        const connection = await DBManager.getConnection(user.empresaId);
        
        // Guardar la conexión y el usuario en el request
        req.dbConnection = connection;
        req.user = user;
        
        // Obtener los modelos de la conexión
        req.models = connection.models;
        
        // Log para debug
        console.log('Modelos disponibles:', Object.keys(req.models));
        
        next();
      } catch (error) {
        console.error('Error al obtener conexión de empresa:', error);
        res.status(500).json({
          success: false,
          message: 'Error al conectar con la base de datos de la empresa',
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la autenticación',
      error: error.message
    });
  }
};

module.exports = {
  authenticateToken
}; 