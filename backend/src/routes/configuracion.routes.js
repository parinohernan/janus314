const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracion.controller');

// Rutas para la configuración de sincronización móvil
router.get('/sincronizacion/configuracion', configuracionController.getConfiguracion);
router.put('/sincronizacion/configuracion', configuracionController.updateConfiguracion);
router.post('/sincronizacion/descargar-preventas', configuracionController.updateUltimaDescarga);
router.post('/sincronizacion/actualizar-datos', configuracionController.updateUltimaActualizacion);

module.exports = router; 