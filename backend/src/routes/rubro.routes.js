const express = require("express");
const router = express.Router();
const rubroController = require("../controllers/rubro.controller");

// Rutas para rubros
router.get("/", rubroController.getAllRubros);
router.get("/:id", rubroController.getRubroById);
router.post("/", rubroController.createRubro);
router.put("/:id", rubroController.updateRubro);
router.delete("/:id", rubroController.deleteRubro);

module.exports = router;
