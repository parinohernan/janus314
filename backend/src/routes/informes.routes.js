const express = require('express');
const router = express.Router();
const informesController = require('../controllers/informes.controller');

// Ruta para el informe de facturación
router.get('/facturacion', informesController.informeFacturacion);

// Ruta para el informe de ventas por productos
router.get('/ventas-por-productos', informesController.ventasPorProductos);

// Rutas para estadísticas de vendedores
router.get('/vendedores/ventas', informesController.ventasPorVendedor);
router.get('/vendedores/productos', informesController.productosPorVendedor);
router.get('/vendedores/detalle', informesController.detalleVentasPorVendedor);
router.get('/vendedores/informe-completo', informesController.informeVentasVendedor);
router.get('/vendedores/informe-pdf', informesController.generarPDFInformeVendedor);

// Rutas para estadísticas de productos
router.get('/productos/mas-vendidos', informesController.productosMasVendidos);
router.get('/productos/menos-vendidos', informesController.productosMenosVendidos);
router.get('/productos/rotacion-stock', informesController.rotacionStock);

// Ruta para el informe de ventas por proveedor
router.get('/ventas-por-proveedor', informesController.ventasPorProveedor);

// Ruta para el informe de ventas por rubro
router.get('/ventas-por-rubro', informesController.ventasPorRubro);
router.get('/ventas-rubros-provincia', informesController.ventasPorRubroProvincia);
router.get('/ventas-rubros-provincia/pdf', informesController.generarPDFVentasPorRubroProvincia);

// Ruta para el informe de ventas por clientes
router.get('/ventas-por-clientes', informesController.informeVentasPorClientes);

module.exports = router; 