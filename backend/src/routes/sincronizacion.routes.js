const express = require('express');
const router = express.Router();
const sincronizacionController = require('../controllers/sincronizacion.controller');

// Rutas para el estado de actualización
router.get('/estado-actualizacion', sincronizacionController.getEstadoActualizacion);
router.get('/estado-descarga', sincronizacionController.getEstadoDescarga);

// Rutas para el proceso de actualización
router.get('/verificar-configuracion', sincronizacionController.verificarConfiguracion);
router.post('/actualizar-articulos', sincronizacionController.actualizarArticulos);
router.post('/actualizar-clientes', sincronizacionController.actualizarClientes);
router.post('/actualizar-vendedores', sincronizacionController.actualizarVendedores);
router.post('/finalizar-actualizacion', sincronizacionController.finalizarActualizacion);

// Exportar el router
module.exports = router; 