const express = require("express");
const router = express.Router();
const proveedorController = require("../controllers/proveedor.controller");
const getEmpresaConnection = require("../middleware/dbConnection");

// Rutas para proveedores - todas protegidas con el middleware de conexión
router.get("/", getEmpresaConnection, proveedorController.getAllProveedores);
router.get("/:id", getEmpresaConnection, proveedorController.getProveedorById);
router.post("/", getEmpresaConnection, proveedorController.createProveedor);
router.put("/:id", getEmpresaConnection, proveedorController.updateProveedor);
router.delete("/:id", getEmpresaConnection, proveedorController.deleteProveedor);

module.exports = router;
