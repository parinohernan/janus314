const express = require('express');
const router = express.Router();
const reciboController = require('../controllers/recibo.controller');

// Rutas principales y específicas PRIMERO
router.get('/', reciboController.getAllRecibos);
router.get('/docdeuda/:codigocliente', reciboController.getDocumentosDeuda);
router.get('/doccredito/:codigocliente', reciboController.getDocumentosCredito);

// Rutas con parámetros DESPUÉS
router.get('/:tipo/:sucursal/:numero', reciboController.getReciboById);
router.put('/:tipo/:sucursal/:numero', reciboController.updateRecibo);
router.post('/:tipo/:sucursal/:numero/anular', reciboController.anularRecibo);

// Otras rutas
router.post('/', reciboController.createRecibo);

module.exports = router; 