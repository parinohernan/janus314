const express = require("express");
const router = express.Router();
const rubroController = require("../controllers/rubro.controller");
const getEmpresaConnection = require("../middleware/dbConnection");

// Rutas para rubros - todas protegidas con el middleware de conexión
router.get("/", getEmpresaConnection, rubroController.getAllRubros);
router.get("/:id", getEmpresaConnection, rubroController.getRubroById);
router.post("/", getEmpresaConnection, rubroController.createRubro);
router.put("/:id", getEmpresaConnection, rubroController.updateRubro);
router.delete("/:id", getEmpresaConnection, rubroController.deleteRubro);

module.exports = router;
