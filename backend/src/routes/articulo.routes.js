const express = require("express");
const router = express.Router();
const articuloController = require("../controllers/articulo.controller");
const getEmpresaConnection = require("../middleware/dbConnection");
const multer = require('multer');
const path = require('path');

// Aplicar el middleware de conexión a todas las rutas
router.use(getEmpresaConnection);

// Configurar multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(xls|xlsx)$/)) {
      return cb(new Error('Solo se permiten archivos Excel'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Rutas específicas primero
router.post("/procesar-lista-precios", upload.single('archivo'), articuloController.procesarListaPrecios);
router.get("/stock-bajo", articuloController.getStockBajo);
router.post("/asociar-codigo", articuloController.asociarCodigoBarras);
router.post("/actualizar-precios", articuloController.actualizarPrecios);
router.post("/actualizar-precios-lista", articuloController.actualizarPreciosLista);
router.post("/listado-precios-pdf", articuloController.generarListadoPreciosPDF);
router.post("/resumen-existencia-pdf", articuloController.generarResumenExistenciaPDF);
router.get("/listado-precios", articuloController.getAllArticulosForPricing);
router.get("/by-proveedor-articulo", articuloController.getArticuloByProveedorYCodigoProveedor);

// Rutas con parámetros después
router.get("/:id", articuloController.getArticuloById);
router.put("/:id", articuloController.updateArticulo);
router.delete("/:id", articuloController.deleteArticulo);
// Buscar artículo por proveedor + código artículo proveedor (para ingreso por remito)

// Rutas genéricas al final
router.get("/", articuloController.getAllArticulos);
router.post("/", articuloController.createArticulo);

module.exports = router;
