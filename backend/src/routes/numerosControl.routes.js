const express = require("express");
const router = express.Router();
const numerosControlController = require("../controllers/numerosControl.controller");
const { authenticateToken } = require('../middleware/auth');

// Listar todos los tipos de comprobantes configurados
router.get("/", numerosControlController.listarNumerosControl);

// Obtener próximo número para un tipo de comprobante y sucursal
router.get("/:tipo/:sucursal", authenticateToken, numerosControlController.obtenerProximoNumero);

// Actualizar número de control
router.put("/:tipo/:sucursal", authenticateToken, numerosControlController.actualizarProximoNumero);

// Obtener y actualizar en una operación atómica (útil para reservar un número)
router.post(
  "/:codigo/:sucursal",
  numerosControlController.obtenerYActualizarNumero
);

// Incrementar el próximo número de control
router.post(
  "/:tipo/:sucursal/incrementar",
  numerosControlController.incrementNumber
);

module.exports = router;
