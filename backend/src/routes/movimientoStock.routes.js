const express = require("express");
const router = express.Router();
const movimientoStockController = require("../controllers/movimientoStock.controller");

// Obtener todos los movimientos (agrupados por documento)
router.get("/", movimientoStockController.getMovimientos);

// Obtener detalle de un movimiento específico
router.get(
  "/:tipo/:sucursal/:numero",
  movimientoStockController.getMovimientoDetalle
);

// Crear un nuevo movimiento con sus items
router.post("/", movimientoStockController.crearMovimiento);

// Eliminar un movimiento completo
router.delete(
  "/:tipo/:sucursal/:numero",
  movimientoStockController.eliminarMovimiento
);

module.exports = router;
