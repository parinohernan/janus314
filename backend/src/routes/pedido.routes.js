const express = require("express");
const router = express.Router();
const pedidoController = require("../controllers/pedido.controller");

// Listar pedidos con paginación y filtros
router.get("/", pedidoController.listarPedidos);

// Obtener detalle de un pedido
router.get("/:tipo/:sucursal/:numero", pedidoController.obtenerPedido);

// Crear nuevo pedido
router.post("/", pedidoController.crearPedido);

// Actualizar estado de pedido (enviado, anulado, programado)
router.put(
  "/estado/:tipo/:sucursal/:numero",
  pedidoController.actualizarEstado
);

module.exports = router;
