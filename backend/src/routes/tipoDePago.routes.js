const express = require("express");
const router = express.Router();
const tipoDePagoController = require("../controllers/tipoDePago.controller");

// Rutas para rubros
router.get("/", tipoDePagoController.getAllTiposDePago);
router.get("/:id", tipoDePagoController.getTipoDePagoById);
router.post("/", tipoDePagoController.createTipoDePago);
router.put("/:id", tipoDePagoController.updateTipoDePago);
router.delete("/:id", tipoDePagoController.deleteTipoDePago);

module.exports = router;
