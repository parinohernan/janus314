const express = require("express");
const router = express.Router();
const cajaController = require("../controllers/caja.controller");
const cajaResumenController = require("../controllers/cajaResumen.controller");

// Listar cajas con paginación y filtros
router.get("/", cajaController.listarCajas);

// Obtener detalle de una caja
router.get("/:codigo", cajaController.obtenerCaja);

// Crear nueva caja (apertura)
router.post("/", cajaController.abrirCaja);

// Registrar movimiento de caja
router.post("/movimiento", cajaController.registrarMovimiento);

// Realizar arqueo de caja
router.post("/arqueo/:codigo", cajaController.realizarArqueo);

// Cerrar caja
router.put("/cerrar/:codigo", cajaController.cerrarCaja);

// Obtener movimientos de una caja
router.get("/:codigo/movimientos", cajaController.obtenerMovimientos);

// Obtener cajas abiertas por vendedor
router.get("/vendedor/:vendedorId", cajaController.obtenerCajasVendedor);

// Rutas para resumen y cierre de caja
router.get("/:id/resumen", cajaResumenController.obtenerResumenCaja);
router.post("/:id/cierre", cajaResumenController.cerrarCaja);

module.exports = router; 