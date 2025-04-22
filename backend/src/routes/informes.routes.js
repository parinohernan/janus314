const express = require('express');
const router = express.Router();
const informesController = require('../controllers/informes.controller');

// Ruta para el informe de ventas por productos
router.get('/ventas-por-productos', informesController.ventasPorProductos);

module.exports = router; 