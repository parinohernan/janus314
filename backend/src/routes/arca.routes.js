const express = require("express");
const router = express.Router();
const arcaController = require("../controllers/arca.controller");

// Rutas para operaciones con AFIP/ARCA
router.post("/grabar-cae", arcaController.obtenerCae);
router.get("/estado-completo", arcaController.obtenerEstadoCompleto);
router.post("/ultimo-comprobante", arcaController.obtenerUltimoComprobante);

module.exports = router;
