const express = require("express");
const router = express.Router();
const notaCreditoController = require("../controllers/notaCredito.controller");
const pdfController = require("../controllers/pdf.controller");

// Listar notas de crédito con paginación y filtros
router.get("/", notaCreditoController.listarNotasCredito);

// Obtener detalle de una nota de crédito
router.get(
  "/:tipo/:sucursal/:numero",
  notaCreditoController.obtenerNotaCredito
);

// Crear nueva nota de crédito
router.post("/", notaCreditoController.crearNotaCredito);

// Anular nota de crédito (No se elimina físicamente)
router.put(
  "/anular/:tipo/:sucursal/:numero",
  notaCreditoController.anularNotaCredito
);
//pdf
router.get("/pdf/:tipo/:sucursal/:numero", pdfController.generarNotaCreditoPDF);

// Usar temporalmente el generador de PDF de facturas (modificarlo después si es necesario)
router.get("/pdf/:tipo/:sucursal/:numero", pdfController.generarFacturaPDF);

module.exports = router;
