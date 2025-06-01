const express = require("express");
const router = express.Router();
const cajaController = require("../controllers/caja.controller");
const { obtenerResumenCaja, cerrarCaja } = require("../controllers/cajaResumen.controller");

// Obtener todas las cajas
router.get("/", cajaController.listarCajas);

// Obtener cajas cerradas
router.get("/cerradas", cajaController.listarCajasCerradas);

// Obtener cajas por vendedor
router.get("/vendedor/:vendedorId", cajaController.obtenerCajasVendedor);

// Obtener movimientos de una caja
router.get("/:codigo/movimientos", cajaController.obtenerMovimientos);

// Obtener una caja específica
router.get("/:codigo", cajaController.obtenerCaja);

// Crear nueva caja
router.post("/", cajaController.crearCaja);

// Registrar movimiento
router.post("/movimiento", cajaController.registrarMovimiento);

// Obtener resumen de arqueo por forma de pago
router.get("/:codigo/arqueo/resumen", cajaController.obtenerResumenArqueo);

// Realizar arqueo de caja
router.post("/arqueo/:codigo", cajaController.realizarArqueo);

// Obtener resumen de caja
router.get("/:id/resumen", obtenerResumenCaja);

// Cerrar caja
router.post("/:id/cierre", cerrarCaja);

module.exports = router; 