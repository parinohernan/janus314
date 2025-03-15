const express = require("express");
const router = express.Router();
const categoriaIvaController = require("../controllers/categoriaIva.controller");

// Rutas para categorías de IVA
router.get("/", categoriaIvaController.getAllCategoriasIva);
router.get("/:id", categoriaIvaController.getCategoriaIvaById);
router.post("/", categoriaIvaController.createCategoriaIva);
router.put("/:id", categoriaIvaController.updateCategoriaIva);
router.delete("/:id", categoriaIvaController.deleteCategoriaIva);

module.exports = router;
