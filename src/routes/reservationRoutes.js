const express = require("express");
const controller = require("../controllers/reservationController");
const { autenticar, somenteAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/", autenticar, controller.criar);
router.post("/periodo", autenticar, controller.criarPorPeriodo);
router.get("/minhas", autenticar, controller.minhasReservas);
router.patch("/:id/cancelar", autenticar, controller.cancelar);

router.get("/", autenticar, somenteAdmin, controller.listarTodas);
router.patch("/:id/marcar-em-uso", autenticar, somenteAdmin, controller.marcarEmUso);
router.patch("/:id/devolucao", autenticar, somenteAdmin, controller.registrarDevolucao);

module.exports = router;
