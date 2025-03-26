const express = require("express");
const router = express.Router();
const preventaController = require("../controllers/preventa.controller");

// Listar preventas con paginación y filtros
router.get("/", preventaController.listarPreventas);

// Obtener detalle de una preventa
router.get("/:tipo/:sucursal/:numero", preventaController.obtenerPreventa);

// Crear nueva preventa
router.post("/", preventaController.crearPreventa);

// Anular preventa
router.put(
  "/anular/:tipo/:sucursal/:numero",
  preventaController.anularPreventa
);

// Facturar preventa
router.put(
  "/facturar/:tipo/:sucursal/:numero",
  preventaController.facturarPreventa
);

module.exports = router;
