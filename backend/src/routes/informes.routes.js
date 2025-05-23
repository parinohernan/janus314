const express = require('express');
const router = express.Router();
const informesController = require('../controllers/informes.controller');

// Ruta para el informe de ventas por productos
router.get('/ventas-por-productos', informesController.ventasPorProductos);

// Rutas para estadísticas de vendedores
router.get('/vendedores/ventas', informesController.ventasPorVendedor);
router.get('/vendedores/productos', informesController.productosPorVendedor);
router.get('/vendedores/detalle', informesController.detalleVentasPorVendedor);

// Rutas para estadísticas de productos
router.get('/productos/mas-vendidos', informesController.productosMasVendidos);
router.get('/productos/menos-vendidos', informesController.productosMenosVendidos);
router.get('/productos/rotacion-stock', informesController.rotacionStock);

module.exports = router; 