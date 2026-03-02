const express = require("express");
const router = express.Router();
const proveedorController = require("../controllers/proveedor.controller");
const pdfController = require("../controllers/pdf.controller");
const getEmpresaConnection = require("../middleware/dbConnection");

// Rutas para proveedores - todas protegidas con el middleware de conexión
router.get("/", getEmpresaConnection, proveedorController.getAllProveedores);
router.get("/cuentascorrientes", getEmpresaConnection, proveedorController.getCuentasCorrientes);
router.get("/:id/comprobantes", getEmpresaConnection, proveedorController.getComprobantesProveedor);
router.get("/:id/cuenta-corriente/pdf", getEmpresaConnection, pdfController.generarCuentaCorrienteProveedorPDF);
router.get("/:id", getEmpresaConnection, proveedorController.getProveedorById);
router.post("/", getEmpresaConnection, proveedorController.createProveedor);
router.put("/:id", getEmpresaConnection, proveedorController.updateProveedor);
router.patch("/:id/activo", getEmpresaConnection, proveedorController.toggleActivoProveedor);

module.exports = router;
