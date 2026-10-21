const express = require("express");
const router = express.Router();
const configuracionController = require("../controllers/configuracion.controller");

router.get("/pdf-plantillas-fca", configuracionController.getPdfPlantillasFca);

// Obtener una configuración por código
router.get("/:codigo", configuracionController.getConfiguracionPorCodigo);

// Obtener todas las configuraciones
router.get("/", configuracionController.getAllConfiguraciones);

// Actualizar una configuración
router.put("/:codigo", configuracionController.actualizarConfiguracion);

module.exports = router;
