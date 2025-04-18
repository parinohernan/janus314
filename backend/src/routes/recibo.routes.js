const express = require('express');
const router = express.Router();
const reciboController = require('../controllers/recibo.controller');

// Obtener todos los recibos (con filtros y paginación)
router.get('/', reciboController.getAllRecibos);

// Obtener un recibo por ID (tipo, sucursal, número)
router.get('/:tipo/:sucursal/:numero', reciboController.getReciboById);

// Obtener documentos de deuda (facturas impagas) de un cliente
router.get('/docdeuda/:codigocliente', reciboController.getDocumentosDeuda);

// Obtener documentos de crédito (notas de crédito) de un cliente
router.get('/doccredito/:codigocliente', reciboController.getDocumentosCredito);

// Crear un nuevo recibo
router.post('/', reciboController.createRecibo);

// Actualizar un recibo
router.put('/:tipo/:sucursal/:numero', reciboController.updateRecibo);

// Anular un recibo
router.post('/:tipo/:sucursal/:numero/anular', reciboController.anularRecibo);

module.exports = router; 