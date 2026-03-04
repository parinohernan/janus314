const express = require('express');
const router = express.Router();
const ordenCompraController = require('../controllers/ordenCompra.controller');
const pdfController = require('../controllers/pdf.controller');

router.get('/', ordenCompraController.listarOrdenes);
router.post('/', ordenCompraController.crearOrden);
router.get('/pdf/:tipo/:sucursal/:numero', pdfController.generarOrdenCompraPDF);
router.get('/:tipo/:sucursal/:numero', ordenCompraController.obtenerOrden);

module.exports = router;
