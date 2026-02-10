const express = require('express');
const router = express.Router();
const controller = require('../controllers/relacionesArticuloProveedor.controller');
const getEmpresaConnection = require('../middleware/dbConnection');

router.get('/', getEmpresaConnection, controller.getByProveedor);
router.post('/', getEmpresaConnection, controller.upsert);
router.delete('/:proveedorCodigo/:codigoArticuloProveedor', getEmpresaConnection, controller.delete);

module.exports = router;