const { Resource, Category } = require("../models");
const { disponibilidadeAgora, verificarDisponibilidadeIntervalo } = require("../utils/availability");

function serializarRecurso(r, quantidadeDisponivel) {
  return {
    id: r.id,
    nome: r.nome,
    categoriaId: r.categoriaId,
    categoriaRef: r.categoriaRef ? { id: r.categoriaRef.id, nome: r.categoriaRef.nome } : null,
    descricao: r.descricao,
    fotoUrl: r.fotoUrl,
    quantidadeTotal: r.quantidadeTotal,
    quantidadeDisponivel,
  };
}

async function listar(req, res) {
  try {
    const where = { ativo: true };
    if (req.query.categoriaId) where.categoriaId = req.query.categoriaId;

    const recursos = await Resource.findAll({
      where,
      include: [{ model: Category, as: "categoriaRef" }],
      order: [["nome", "ASC"]],
    });

    const comDisponibilidade = await Promise.all(
      recursos.map(async (r) => serializarRecurso(r, await disponibilidadeAgora(r)))
    );
    return res.json(comDisponibilidade);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao listar recursos.", detalhe: err.message });
  }
}

async function obter(req, res) {
  const recurso = await Resource.findByPk(req.params.id, { include: [{ model: Category, as: "categoriaRef" }] });
  if (!recurso) return res.status(404).json({ erro: "Recurso nao encontrado." });
  const quantidadeDisponivel = await disponibilidadeAgora(recurso);
  return res.json(serializarRecurso(recurso, quantidadeDisponivel));
}

async function disponibilidadeNoIntervalo(req, res) {
  const recurso = await Resource.findByPk(req.params.id);
  if (!recurso) return res.status(404).json({ erro: "Recurso nao encontrado." });
  const { inicio, fim } = req.query;
  if (!inicio || !fim) return res.status(400).json({ erro: "Informe os parametros 'inicio' e 'fim' (datas ISO)." });
  const resultado = await verificarDisponibilidadeIntervalo(recurso, new Date(inicio), new Date(fim));
  return res.json(resultado);
}

async function validarCategoria(categoriaId) {
  if (!categoriaId) return "Selecione uma categoria.";
  const categoria = await Category.findByPk(categoriaId);
  if (!categoria) return "Categoria informada não existe. Cadastre a categoria antes de usá-la.";
  return null;
}

async function criar(req, res) {
  try {
    const { nome, categoriaId, descricao, quantidadeTotal, fotoUrl } = req.body;
    if (!nome) return res.status(400).json({ erro: "Nome é obrigatório." });

    const erroCategoria = await validarCategoria(categoriaId);
    if (erroCategoria) return res.status(400).json({ erro: erroCategoria });

    const caminhoFoto = req.file ? `/uploads/${req.file.filename}` : fotoUrl || null;

    const recurso = await Resource.create({
      nome,
      categoriaId: Number(categoriaId),
      descricao,
      fotoUrl: caminhoFoto,
      quantidadeTotal: quantidadeTotal !== undefined ? Number(quantidadeTotal) : 1,
    });

    const comCategoria = await Resource.findByPk(recurso.id, { include: [{ model: Category, as: "categoriaRef" }] });
    return res.status(201).json(serializarRecurso(comCategoria, comCategoria.quantidadeTotal));
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao cadastrar recurso.", detalhe: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const recurso = await Resource.findByPk(req.params.id);
    if (!recurso) return res.status(404).json({ erro: "Recurso nao encontrado." });

    const { nome, categoriaId, descricao, quantidadeTotal, fotoUrl, ativo } = req.body;

    if (categoriaId) {
      const erroCategoria = await validarCategoria(categoriaId);
      if (erroCategoria) return res.status(400).json({ erro: erroCategoria });
    }

    const caminhoFoto = req.file ? `/uploads/${req.file.filename}` : fotoUrl ?? recurso.fotoUrl;

    await recurso.update({
      nome: nome ?? recurso.nome,
      categoriaId: categoriaId ? Number(categoriaId) : recurso.categoriaId,
      descricao: descricao ?? recurso.descricao,
      fotoUrl: caminhoFoto,
      quantidadeTotal: quantidadeTotal !== undefined ? Number(quantidadeTotal) : recurso.quantidadeTotal,
      ativo: typeof ativo === "boolean" ? ativo : recurso.ativo,
    });

    const atualizado = await Resource.findByPk(recurso.id, { include: [{ model: Category, as: "categoriaRef" }] });
    return res.json(serializarRecurso(atualizado, atualizado.quantidadeTotal));
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao atualizar recurso.", detalhe: err.message });
  }
}

async function remover(req, res) {
  const recurso = await Resource.findByPk(req.params.id);
  if (!recurso) return res.status(404).json({ erro: "Recurso nao encontrado." });
  await recurso.update({ ativo: false });
  return res.status(204).send();
}

module.exports = { listar, obter, disponibilidadeNoIntervalo, criar, atualizar, remover };
