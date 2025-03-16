const express = require("express");
const router = express.Router();
const numerosControlController = require("../controllers/numerosControl.controller");

// Listar todos los tipos de comprobantes configurados
router.get("/", numerosControlController.listarNumerosControl);

// Obtener el próximo número para un tipo de comprobante y sucursal
router.get("/:codigo/:sucursal", numerosControlController.obtenerProximoNumero);

// Actualizar (incrementar) el próximo número para un tipo de comprobante y sucursal
router.put(
  "/:codigo/:sucursal",
  numerosControlController.actualizarProximoNumero
);

// Obtener y actualizar en una operación atómica (útil para reservar un número)
router.post(
  "/:codigo/:sucursal",
  numerosControlController.obtenerYActualizarNumero
);

module.exports = router;
