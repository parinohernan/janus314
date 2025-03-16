const express = require("express");
const router = express.Router();
const datosEmpresaController = require("../controllers/datosEmpresa.controller");

// Obtener datos de la empresa
router.get("/", datosEmpresaController.getDatosEmpresa);

// Actualizar datos de la empresa
router.put("/", datosEmpresaController.updateDatosEmpresa);

module.exports = router;
