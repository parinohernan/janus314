const express = require('express');
const router = express.Router();
const controller = require('../controllers/proveedoresRecibo.controller');

router.get('/', controller.listarRecibos);
router.get('/docdeuda/:codigoproveedor', controller.getDocumentosDeuda);
router.get('/doccredito/:codigoproveedor', controller.getDocumentosCredito);
router.get('/:tipo/:sucursal/:numero', controller.getReciboById);
router.put('/:tipo/:sucursal/:numero/anular', controller.anularRecibo);
router.post('/', controller.createRecibo);

module.exports = router;
