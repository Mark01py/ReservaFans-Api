const express = require("express");

const {
  registrar,
  criarAdministradorInicial,
  login,
  perfilAtual,
} = require("../controllers/authController");

const { autenticar } = require("../middleware/auth");

const router = express.Router();

router.post("/registrar", registrar);
router.post("/criar-admin-inicial", criarAdministradorInicial);
router.post("/login", login);
router.get("/perfil", autenticar, perfilAtual);

module.exports = router;