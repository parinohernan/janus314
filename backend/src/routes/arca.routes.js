const express = require("express");
const router = express.Router();
const arcaController = require("../controllers/arca.controller");

// Rutas para operaciones con AFIP
router.post("/grabar-cae", arcaController.obtenerCae);
router.get("/estado", arcaController.verificarEstadoServidor);

module.exports = router;
