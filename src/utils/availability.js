const { Op } = require("sequelize");
const { Reservation } = require("../models");

async function contarReservasSobrepostas(resourceId, dataInicio, dataFim, { ignorarReservaId } = {}) {
  const where = {
    resourceId,
    status: { [Op.in]: ["ativa", "em_uso"] },
    dataInicio: { [Op.lt]: dataFim },
    dataFimPrevista: { [Op.gt]: dataInicio },
  };
  if (ignorarReservaId) where.id = { [Op.ne]: ignorarReservaId };
  return Reservation.count({ where });
}

async function disponibilidadeAgora(resource) {
  const agora = new Date();
  const emUso = await Reservation.count({
    where: {
      resourceId: resource.id,
      status: { [Op.in]: ["ativa", "em_uso"] },
      dataInicio: { [Op.lte]: agora },
      dataFimPrevista: { [Op.gte]: agora },
    },
  });
  return Math.max(resource.quantidadeTotal - emUso, 0);
}

async function verificarDisponibilidadeIntervalo(resource, dataInicio, dataFim, opts = {}) {
  const comprometidas = await contarReservasSobrepostas(resource.id, dataInicio, dataFim, opts);
  const quantidadeDisponivel = Math.max(resource.quantidadeTotal - comprometidas, 0);
  return { disponivel: quantidadeDisponivel > 0, quantidadeDisponivel };
}

module.exports = { contarReservasSobrepostas, disponibilidadeAgora, verificarDisponibilidadeIntervalo };
