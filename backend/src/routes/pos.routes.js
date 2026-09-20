const express = require("express");
const router = express.Router();
const posQzController = require("../controllers/posQz.controller");

router.get("/qz-cert", posQzController.getCert);
router.post("/qz-sign", posQzController.sign);

module.exports = router;
