const { esAdminOSuperadm } = require('./vendedorRoles');

/**
 * Vendedor admin o superadm. Debe usarse después de autenticación (req.userData).
 */
const requireAdminOrSuperadm = (req, res, next) => {
  if (!req.userData || !req.userData.userId) {
    return res.status(401).json({
      success: false,
      error: 'No se proporcionó token de autenticación'
    });
  }
  if (!esAdminOSuperadm(req)) {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Solo admin o superadm pueden gestionar backups.'
    });
  }
  next();
};

module.exports = requireAdminOrSuperadm;
