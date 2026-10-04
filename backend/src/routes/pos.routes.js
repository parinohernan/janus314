const express = require("express");
const router = express.Router();
const posQzController = require("../controllers/posQz.controller");
const posLogoController = require("../controllers/posLogo.controller");

router.get("/qz-cert", posQzController.getCert);
router.post("/qz-sign", posQzController.sign);
router.get("/logo-ticket", posLogoController.getLogoTicket);

module.exports = router;
