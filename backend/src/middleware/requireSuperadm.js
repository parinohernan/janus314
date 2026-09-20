const { esSuperadm } = require('./vendedorRoles');

/**
 * Solo el vendedor con Codigo = 'superadm'.
 * Debe usarse después de autenticación (req.userData).
 */
const requireSuperadm = (req, res, next) => {
  if (!req.userData || !req.userData.userId) {
    return res.status(401).json({
      success: false,
      error: 'No se proporcionó token de autenticación'
    });
  }
  if (!esSuperadm(req)) {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Solo el vendedor superadm puede restaurar backups.'
    });
  }
  next();
};

module.exports = requireSuperadm;
