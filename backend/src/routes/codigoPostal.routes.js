const express = require("express");
const router = express.Router();
const codigoPostalController = require("../controllers/codigoPostal.controller");

// Rutas para códigos postales (localidades)
router.get("/", codigoPostalController.getAllCodigosPostales);
router.get("/:id", codigoPostalController.getCodigoPostalById);
router.post("/", codigoPostalController.createCodigoPostal);
router.put("/:id", codigoPostalController.updateCodigoPostal);
router.delete("/:id", codigoPostalController.deleteCodigoPostal);

module.exports = router;
