const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User } = require("../models");
const { JWT_SECRET } = require("../middleware/auth");

async function registrar(req, res) {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Nome, e-mail e senha sao obrigatorios.",
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const existente = await User.findOne({
      where: { email: emailNormalizado },
    });

    if (existente) {
      return res.status(409).json({
        erro: "Ja existe um usuario cadastrado com este e-mail.",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await User.create({
      nome,
      email: emailNormalizado,
      senhaHash,
      perfil: "usuario",
    });

    return res.status(201).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    });
  } catch (err) {
    return res.status(500).json({
      erro: "Erro ao registrar usuario.",
      detalhe: err.message,
    });
  }
}

async function criarAdministradorInicial(req, res) {
  try {
    const tokenRecebido = req.get("x-bootstrap-token") || "";
    const tokenEsperado = process.env.BOOTSTRAP_TOKEN || "";

    if (
      !tokenEsperado ||
      !tokenRecebido ||
      Buffer.byteLength(tokenRecebido) !== Buffer.byteLength(tokenEsperado) ||
      !crypto.timingSafeEqual(
        Buffer.from(tokenRecebido),
        Buffer.from(tokenEsperado)
      )
    ) {
      return res.status(403).json({
        erro: "Autorizacao invalida.",
      });
    }

    const totalUsuarios = await User.count();

    if (totalUsuarios > 0) {
      return res.status(409).json({
        erro: "O cadastro inicial ja foi realizado.",
      });
    }

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha || senha.length < 8) {
      return res.status(400).json({
        erro: "Informe nome, e-mail e senha com pelo menos 8 caracteres.",
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const senhaHash = await bcrypt.hash(senha, 10);

    const administrador = await User.create({
      nome,
      email: emailNormalizado,
      senhaHash,
      perfil: "admin",
    });

    return res.status(201).json({
      mensagem: "Administrador inicial criado com sucesso.",
      usuario: {
        id: administrador.id,
        nome: administrador.nome,
        email: administrador.email,
        perfil: administrador.perfil,
      },
    });
  } catch (err) {
    return res.status(500).json({
      erro: "Erro ao criar administrador inicial.",
      detalhe: err.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: "Informe e-mail e senha.",
      });
    }

    const usuario = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!usuario) {
      return res.status(401).json({
        erro: "Credenciais invalidas.",
      });
    }

    const senhaOk = await bcrypt.compare(senha, usuario.senhaHash);

    if (!senhaOk) {
      return res.status(401).json({
        erro: "Credenciais invalidas.",
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    });
  } catch (err) {
    return res.status(500).json({
      erro: "Erro ao autenticar.",
      detalhe: err.message,
    });
  }
}

async function perfilAtual(req, res) {
  const usuario = await User.findByPk(req.usuario.id, {
    attributes: ["id", "nome", "email", "perfil"],
  });

  if (!usuario) {
    return res.status(404).json({
      erro: "Usuario nao encontrado.",
    });
  }

  return res.json(usuario);
}

module.exports = {
  registrar,
  criarAdministradorInicial,
  login,
  perfilAtual,
};