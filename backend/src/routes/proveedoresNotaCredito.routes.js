const express = require('express');
const router = express.Router();
const controller = require('../controllers/proveedoresNotaCredito.controller');

router.get('/', controller.listar);
router.get('/:tipo/:sucursal/:numero', controller.obtenerPorId);

module.exports = router;
