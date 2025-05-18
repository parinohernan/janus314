const express = require("express");
const router = express.Router();
const datosEmpresaController = require("../controllers/datosEmpresa.controller");
const getEmpresaConnection = require("../middleware/dbConnection");

// Rutas para datos de empresa - todas protegidas con el middleware de conexión
router.get("/", getEmpresaConnection, datosEmpresaController.getDatosEmpresa);
router.put("/", getEmpresaConnection, datosEmpresaController.updateDatosEmpresa);

module.exports = router;
