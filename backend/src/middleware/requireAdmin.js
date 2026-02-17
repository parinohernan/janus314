/**
 * Middleware que restringe el acceso solo al vendedor con Codigo = 'admin'.
 * Debe usarse después de getEmpresaConnection (req.userData debe existir).
 */
const requireAdmin = (req, res, next) => {
  const userId = req.userData?.userId;
  if (!userId || userId !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Solo el administrador (vendedor admin) puede realizar esta acción.'
    });
  }
  next();
};

module.exports = requireAdmin;
