const express = require('express');
const router = express.Router();
const wikiController = require('../controllers/wiki.controller');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/', wikiController.listarArticulos);
router.get('/:slug', wikiController.obtenerArticulo);
router.post('/', requireAdmin, wikiController.crearArticulo);
router.put('/:slug', requireAdmin, wikiController.actualizarArticulo);
router.delete('/:slug', requireAdmin, wikiController.eliminarArticulo);

module.exports = router;
