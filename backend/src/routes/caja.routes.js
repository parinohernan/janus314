const express = require("express");
const router = express.Router();
const cajaController = require("../controllers/caja.controller");
const cajaResumenController = require("../controllers/cajaResumen.controller");

// Obtener todas las cajas
router.get("/", cajaController.listarCajas);

// Obtener cajas por vendedor
router.get("/vendedor/:vendedorId", cajaController.obtenerCajasVendedor);

// Obtener movimientos de una caja
router.get("/:codigo/movimientos", cajaController.obtenerMovimientos);

// Obtener una caja específica
router.get("/:codigo", cajaController.obtenerCaja);

// Crear nueva caja (apertura)
router.post("/", cajaController.abrirCaja);

// Registrar movimiento de caja
router.post("/movimiento", cajaController.registrarMovimiento);

// Realizar arqueo de caja
router.post("/arqueo/:codigo", cajaController.realizarArqueo);

// Obtener resumen de caja
router.get("/:id/resumen", cajaResumenController.obtenerResumenCaja);

// Cerrar caja
router.post("/:id/cierre", cajaResumenController.cerrarCaja);

module.exports = router; 