const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitud.controller');

// Ruta para crear una nueva solicitud
router.post('/', solicitudController.crearSolicitud);

// Ruta para obtener todas las solicitudes
router.get('/', solicitudController.obtenerSolicitudes);

// Ruta para obtener una solicitud específica
router.get('/:id', solicitudController.obtenerSolicitudPorId);

// Ruta para actualizar el estado de una solicitud
router.patch('/:id/estado', solicitudController.actualizarEstadoSolicitud);

module.exports = router; 