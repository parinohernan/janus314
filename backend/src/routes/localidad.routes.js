const express = require('express');
const router = express.Router();
const localidadController = require('../controllers/localidad.controller');

// Rutas para localidades
router.get('/', localidadController.getAllLocalidades);
router.get('/:id', localidadController.getLocalidadById);
router.post('/', localidadController.createLocalidad);
router.put('/:id', localidadController.updateLocalidad);
router.delete('/:id', localidadController.deleteLocalidad);

module.exports = router; 