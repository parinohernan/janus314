const express = require('express');
const router = express.Router();
const DBManager = require('../utils/DBManager');
const adminAuth = require('../middlewares/adminAuth');
const { validateAllSchemas } = require('../scripts/validate-schemas');
const cuentaAccesoController = require('../controllers/cuentaAcceso.controller');

router.use(adminAuth);

router.get('/db-status', async (req, res) => {
  try {
    const status = await DBManager.getPoolStatus();
    res.json(status);
  } catch (error) {
    console.error('Error al obtener estado de conexiones:', error);
    res.status(500).json({
      error: 'Error al obtener estado de conexiones',
      message: error.message
    });
  }
});

router.post('/validate-schemas', async (req, res) => {
  try {
    const results = await validateAllSchemas();
    res.json({
      results,
      summary: {
        valid: results.filter(r => r.status === 'valid').length,
        invalid: results.filter(r => r.status === 'invalid').length,
        errors: results.filter(r => r.status === 'error').length
      }
    });
  } catch (error) {
    console.error('Error al validar esquemas:', error);
    res.status(500).json({
      error: 'Error al validar esquemas',
      message: error.message
    });
  }
});

router.get('/cuentas', cuentaAccesoController.listarCuentas);
router.post('/cuentas', cuentaAccesoController.crearCuenta);
router.patch('/cuentas/:id', cuentaAccesoController.actualizarCuenta);
router.get('/empresas', cuentaAccesoController.listarEmpresas);
router.get('/empresas/:id/vendedores', cuentaAccesoController.listarVendedoresEmpresa);

module.exports = router;
