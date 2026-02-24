const express = require('express');
const router = express.Router();
const comprasController = require('../controllers/compras.controller');

router.get('/', comprasController.listarCompras);
router.post('/', comprasController.crearCompra);
router.get('/:tipo/:sucursal/:numero', comprasController.obtenerCompra);

module.exports = router;
