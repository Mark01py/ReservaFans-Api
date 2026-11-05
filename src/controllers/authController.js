const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { JWT_SECRET } = require("../middleware/auth");

async function registrar(req, res) {
  try {
    const { nome, email, senha, perfil } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Nome, e-mail e senha sao obrigatorios." });
    }
    const existente = await User.findOne({ where: { email } });
    if (existente) {
      return res.status(409).json({ erro: "Ja existe um usuario cadastrado com este e-mail." });
    }
    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await User.create({ nome, email, senhaHash, perfil: perfil === "admin" ? "admin" : "usuario" });
    return res.status(201).json({ id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao registrar usuario.", detalhe: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: "Informe e-mail e senha." });

    const usuario = await User.findOne({ where: { email } });
    if (!usuario) return res.status(401).json({ erro: "Credenciais invalidas." });

    const senhaOk = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaOk) return res.status(401).json({ erro: "Credenciais invalidas." });

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    return res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil } });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao autenticar.", detalhe: err.message });
  }
}

async function perfilAtual(req, res) {
  const usuario = await User.findByPk(req.usuario.id, { attributes: ["id", "nome", "email", "perfil"] });
  if (!usuario) return res.status(404).json({ erro: "Usuario nao encontrado." });
  return res.json(usuario);
}

module.exports = { registrar, login, perfilAtual };
