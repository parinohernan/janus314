const DBManager = require('../utils/DBManager');

const dbConnector = async (req, res, next) => {
  try {
    // Asumimos que el empresaId viene en el token JWT y está disponible en req.user
    // Si no está configurado así, ajustar según la implementación de autenticación
    const empresaId = req.user?.empresaId;

    if (!empresaId) {
      return res.status(401).json({
        error: 'No se encontró ID de empresa en el token'
      });
    }

    // Obtener la conexión para esta empresa
    const connection = await DBManager.getConnection(empresaId);
    
    // Adjuntar la conexión al objeto request
    req.db = connection;
    
    next();
  } catch (error) {
    console.error('Error en dbConnector:', error);
    res.status(500).json({
      error: 'Error al conectar con la base de datos de la empresa',
      message: error.message
    });
  }
};

module.exports = dbConnector; 