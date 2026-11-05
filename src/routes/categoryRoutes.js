const express = require("express");
const controller = require("../controllers/categoryController");
const { autenticar, somenteAdmin } = require("../middleware/auth");

const router = express.Router();
router.get("/", autenticar, controller.listar);
router.post("/", autenticar, somenteAdmin, controller.criar);

module.exports = router;
