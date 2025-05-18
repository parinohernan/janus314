const express = require("express");
const router = express.Router();
const articuloController = require("../controllers/articulo.controller");
const getEmpresaConnection = require("../middleware/dbConnection");

// Aplicar el middleware de conexión a todas las rutas
router.use(getEmpresaConnection);

// Rutas para artículos
router.get("/", articuloController.getAllArticulos);
router.post("/asociar-codigo", articuloController.asociarCodigoBarras);
router.get("/:id", articuloController.getArticuloById);
router.post("/", articuloController.createArticulo);
router.put("/:id", articuloController.updateArticulo);
router.delete("/:id", articuloController.deleteArticulo);
router.post("/actualizar-precios", articuloController.actualizarPrecios);

module.exports = router;
