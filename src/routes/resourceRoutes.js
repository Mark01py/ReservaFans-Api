const express = require("express");
const controller = require("../controllers/resourceController");
const { autenticar, somenteAdmin } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.get("/", autenticar, controller.listar);
router.get("/:id", autenticar, controller.obter);
router.get("/:id/disponibilidade", autenticar, controller.disponibilidadeNoIntervalo);

router.post("/", autenticar, somenteAdmin, upload.single("foto"), controller.criar);
router.put("/:id", autenticar, somenteAdmin, upload.single("foto"), controller.atualizar);
router.delete("/:id", autenticar, somenteAdmin, controller.remover);

module.exports = router;
