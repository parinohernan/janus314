const express = require('express');
const router = express.Router();
const optimizacionController = require('../controllers/optimizacion.controller');

router.delete('/preventas-antiguas', optimizacionController.eliminarPreventasAntiguas);
router.get('/exportar-tablas', optimizacionController.exportarTablas);

module.exports = router;
