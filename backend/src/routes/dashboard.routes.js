const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");

// Obtener estado de vendedores
router.get("/vendedores-estado", dashboardController.getEstadoVendedores);

// Obtener resumen del día
router.get("/resumen-dia", dashboardController.getResumenDia);

// Obtener stock crítico
router.get("/stock-critico", dashboardController.getStockCritico);

// Obtener actividad reciente
router.get("/actividad-reciente", dashboardController.getActividadReciente);

// Obtener datos para gráficos
router.get("/graficos", dashboardController.getGraficos);

module.exports = router;
