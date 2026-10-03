const express = require('express');
const requireAdminOrSuperadm = require('../middleware/requireAdminOrSuperadm');
const desarrolladorController = require('../controllers/desarrollador.controller');

const router = express.Router();

router.use(requireAdminOrSuperadm);
router.get('/reset', desarrolladorController.obtenerEstadoReset);
router.post('/reset', desarrolladorController.ejecutarReset);

module.exports = router;
