const express = require("express");
const router = express.Router();
const notaCreditoController = require("../controllers/notaCredito.controller");
const pdfController = require("../controllers/pdf.controller");
const { authenticateToken } = require("../middleware/auth");

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

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

// Generar PDF de nota de crédito
router.get("/pdf/:tipo/:sucursal/:numero", pdfController.generarNotaCreditoPDF);

module.exports = router;
