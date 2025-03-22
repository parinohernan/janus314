const express = require("express");
const router = express.Router();
const facturaController = require("../controllers/factura.controller");
const pdfController = require("../controllers/pdf.controller");

// Listar facturas con paginación y filtros
router.get("/", facturaController.listarFacturas);

// Obtener detalle de una factura
router.get("/:tipo/:sucursal/:numero", facturaController.obtenerFactura);

// Crear nueva factura
router.post("/", facturaController.crearFactura);

// Anular factura (No se elimina físicamente)
router.put("/anular/:tipo/:sucursal/:numero", facturaController.anularFactura);

// Nueva ruta para generar PDF
router.get("/pdf/:tipo/:sucursal/:numero", pdfController.generarFacturaPDF);

module.exports = router;
