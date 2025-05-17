const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'No se proporcionó token de autenticación'
      });
    }

    // Verificar formato del token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Formato de token inválido'
      });
    }

    const token = parts[1];

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar si el usuario es administrador
    if (!decoded.isAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado - Se requieren privilegios de administrador'
      });
    }

    // Adjuntar información del usuario decodificada a la request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }
    console.error('Error en adminAuth:', error);
    res.status(500).json({
      error: 'Error al verificar autenticación'
    });
  }
};

module.exports = adminAuth; 