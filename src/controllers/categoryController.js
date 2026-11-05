const { Category } = require("../models");

async function listar(req, res) {
  const categorias = await Category.findAll({ order: [["nome", "ASC"]] });
  return res.json(categorias);
}

async function criar(req, res) {
  try {
    const { nome } = req.body;
    if (!nome || !nome.trim()) return res.status(400).json({ erro: "Informe o nome da categoria." });

    const existente = await Category.findOne({ where: { nome: nome.trim() } });
    if (existente) return res.status(409).json({ erro: "Já existe uma categoria com este nome." });

    const categoria = await Category.create({ nome: nome.trim() });
    return res.status(201).json(categoria);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao cadastrar categoria.", detalhe: err.message });
  }
}

module.exports = { listar, criar };
