const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/cliente.controller");

// Rutas para clientes
router.get("/", clienteController.getAllClientes);
router.get("/:id", clienteController.getClienteById);
router.post("/", clienteController.createCliente);
router.put("/:id", clienteController.updateCliente);
router.put("/:id/toggleActivo", clienteController.toggleActivoCliente);

module.exports = router;
