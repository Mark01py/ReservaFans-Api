const express = require("express");
const controller = require("../controllers/reportController");
const { autenticar, somenteAdmin } = require("../middleware/auth");

const router = express.Router();
router.get("/resumo", autenticar, somenteAdmin, controller.resumo);
router.get("/mais-solicitados", autenticar, somenteAdmin, controller.maisSolicitados);

module.exports = router;
