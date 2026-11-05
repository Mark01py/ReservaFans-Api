const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "reservafans-dev-secret-troque-em-producao";

function autenticar(req, res, next) {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token de autenticacao ausente. Faca login novamente." });
  }
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ erro: "Token invalido ou expirado." });
  }
}

function somenteAdmin(req, res, next) {
  if (!req.usuario || req.usuario.perfil !== "admin") {
    return res.status(403).json({ erro: "Acao restrita ao administrador do sistema." });
  }
  return next();
}

module.exports = { autenticar, somenteAdmin, JWT_SECRET };
