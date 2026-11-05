const { Reservation, Resource, User, sequelize } = require("../models");
const { verificarDisponibilidadeIntervalo } = require("../utils/availability");
const { validarHorarioDeAula, slotDoDia, listarDias } = require("../utils/horarioAula");

async function criar(req, res) {
  try {
    const { resourceId, dataInicio, dataFimPrevista, observacoes } = req.body;
    if (!resourceId || !dataInicio || !dataFimPrevista) {
      return res.status(400).json({ erro: "Informe resourceId, dataInicio e dataFimPrevista." });
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFimPrevista);

    if (isNaN(inicio.getTime()) || isNaN(fim.getTime()) || inicio >= fim) {
      return res.status(400).json({ erro: "Periodo invalido. A devolucao prevista deve ser posterior ao inicio." });
    }
    if (inicio < new Date(Date.now() - 5 * 60 * 1000)) {
      return res.status(400).json({ erro: "Nao e possivel reservar em um horario no passado." });
    }

    const erroHorario = validarHorarioDeAula(inicio, fim);
    if (erroHorario) return res.status(400).json({ erro: erroHorario });

    const recurso = await Resource.findByPk(resourceId);
    if (!recurso || !recurso.ativo) {
      return res.status(404).json({ erro: "Recurso nao encontrado ou indisponivel para reserva." });
    }

    const { disponivel, quantidadeDisponivel } = await verificarDisponibilidadeIntervalo(recurso, inicio, fim);
    if (!disponivel) {
      return res.status(409).json({
        erro: `Sem unidades disponiveis de "${recurso.nome}" no periodo solicitado.`,
        quantidadeDisponivel,
      });
    }

    const reserva = await Reservation.create({
      resourceId, userId: req.usuario.id, dataInicio: inicio, dataFimPrevista: fim, observacoes, status: "ativa",
    });
    return res.status(201).json(reserva);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao criar reserva.", detalhe: err.message });
  }
}

async function criarPorPeriodo(req, res) {
  try {
    const { resourceId, dataInicio, dataFim, observacoes } = req.body;
    if (!resourceId || !dataInicio || !dataFim) {
      return res.status(400).json({ erro: "Informe resourceId, dataInicio e dataFim (dia inicial e dia final)." });
    }

    const diaInicial = new Date(dataInicio);
    const diaFinal = new Date(dataFim);
    if (isNaN(diaInicial.getTime()) || isNaN(diaFinal.getTime()) || diaInicial > diaFinal) {
      return res.status(400).json({ erro: "Intervalo de dias invalido." });
    }

    const dias = listarDias(diaInicial, diaFinal);
    if (dias.length > 90) {
      return res.status(400).json({ erro: "O período solicitado é muito longo (máximo de 90 dias)." });
    }

    const recurso = await Resource.findByPk(resourceId);
    if (!recurso || !recurso.ativo) {
      return res.status(404).json({ erro: "Recurso nao encontrado ou indisponivel para reserva." });
    }

    const slots = dias.map((dia) => slotDoDia(dia));

    const diasSemEstoque = [];
    for (const { inicio, fim } of slots) {
      const { disponivel } = await verificarDisponibilidadeIntervalo(recurso, inicio, fim);
      if (!disponivel) diasSemEstoque.push(inicio.toLocaleDateString("pt-BR"));
    }

    if (diasSemEstoque.length > 0) {
      return res.status(409).json({
        erro: `Sem unidades disponíveis de "${recurso.nome}" nos seguintes dias: ${diasSemEstoque.join(", ")}.`,
        diasSemEstoque,
      });
    }

    const reservasCriadas = await sequelize.transaction(async (t) => {
      const criadas = [];
      for (const { inicio, fim } of slots) {
        const r = await Reservation.create(
          { resourceId, userId: req.usuario.id, dataInicio: inicio, dataFimPrevista: fim, observacoes, status: "ativa" },
          { transaction: t }
        );
        criadas.push(r);
      }
      return criadas;
    });

    return res.status(201).json({ totalCriadas: reservasCriadas.length, reservas: reservasCriadas });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao criar reserva por período.", detalhe: err.message });
  }
}

async function minhasReservas(req, res) {
  const { status } = req.query;
  const where = { userId: req.usuario.id };
  if (status) where.status = status;

  const reservas = await Reservation.findAll({
    where,
    include: [{ model: Resource, as: "recurso", attributes: ["id", "nome", "categoriaId", "fotoUrl"], include: [{ model: require("../models").Category, as: "categoriaRef" }] }],
    order: [["dataInicio", "DESC"]],
  });
  return res.json(reservas);
}

async function cancelar(req, res) {
  const reserva = await Reservation.findByPk(req.params.id);
  if (!reserva) return res.status(404).json({ erro: "Reserva nao encontrada." });

  const ehDono = reserva.userId === req.usuario.id;
  const ehAdmin = req.usuario.perfil === "admin";
  if (!ehDono && !ehAdmin) return res.status(403).json({ erro: "Voce nao tem permissao para cancelar esta reserva." });
  if (!["ativa", "em_uso"].includes(reserva.status)) {
    return res.status(400).json({ erro: `Reserva com status "${reserva.status}" nao pode ser cancelada.` });
  }

  await reserva.update({ status: "cancelada" });
  return res.json(reserva);
}

async function listarTodas(req, res) {
  const { status, resourceId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (resourceId) where.resourceId = resourceId;

  const reservas = await Reservation.findAll({
    where,
    include: [
      { model: Resource, as: "recurso", attributes: ["id", "nome", "categoriaId"], include: [{ model: require("../models").Category, as: "categoriaRef" }] },
      { model: User, as: "usuario", attributes: ["id", "nome", "email"] },
    ],
    order: [["dataInicio", "ASC"]],
  });
  return res.json(reservas);
}

async function marcarEmUso(req, res) {
  const reserva = await Reservation.findByPk(req.params.id);
  if (!reserva) return res.status(404).json({ erro: "Reserva nao encontrada." });
  if (reserva.status !== "ativa") {
    return res.status(400).json({ erro: `Apenas reservas ativas podem ser marcadas como em uso (status atual: ${reserva.status}).` });
  }
  await reserva.update({ status: "em_uso" });
  return res.json(reserva);
}

async function registrarDevolucao(req, res) {
  const reserva = await Reservation.findByPk(req.params.id);
  if (!reserva) return res.status(404).json({ erro: "Reserva nao encontrada." });
  if (!["ativa", "em_uso"].includes(reserva.status)) {
    return res.status(400).json({ erro: `Reserva com status "${reserva.status}" nao pode ser devolvida.` });
  }
  await reserva.update({ status: "devolvida", dataDevolucaoReal: new Date() });
  return res.json(reserva);
}

module.exports = { criar, criarPorPeriodo, minhasReservas, cancelar, listarTodas, marcarEmUso, registrarDevolucao };
