const express = require("express");
const router = express.Router();

// Temporalmente devolvemos una respuesta básica
router.get("/", (req, res) => {
  res.json({ message: "API de productos en construcción" });
});

module.exports = router;
