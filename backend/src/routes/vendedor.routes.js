const express = require("express");
const router = express.Router();
const vendedorController = require("../controllers/vendedor.controller");

// Obtener todos los vendedores
router.get("/", vendedorController.getVendedores);

// Obtener un vendedor por código
router.get("/:codigo", vendedorController.getVendedorById);

// Crear un nuevo vendedor
router.post("/", vendedorController.createVendedor);

// Actualizar un vendedor existente
router.put("/:codigo", vendedorController.updateVendedor);

// Eliminar un vendedor
router.delete("/:codigo", vendedorController.deleteVendedor);

module.exports = router;
