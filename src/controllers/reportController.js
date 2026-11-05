const { Op } = require("sequelize");
const { Reservation, Resource, Category } = require("../models");

async function resumo(req, res) {
  const agora = new Date();
  const inicioDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const fimDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);

  const [itensCadastrados, emUsoAgora, reservasHoje, devolucoesAtrasadas] = await Promise.all([
    Resource.count({ where: { ativo: true } }),
    Reservation.count({
      where: { status: { [Op.in]: ["ativa", "em_uso"] }, dataInicio: { [Op.lte]: agora }, dataFimPrevista: { [Op.gte]: agora } },
    }),
    Reservation.count({ where: { dataInicio: { [Op.gte]: inicioDoDia, [Op.lt]: fimDoDia } } }),
    Reservation.count({ where: { status: { [Op.in]: ["ativa", "em_uso"] }, dataFimPrevista: { [Op.lt]: agora } } }),
  ]);

  return res.json({ itensCadastrados, emUsoAgora, reservasHoje, devolucoesAtrasadas });
}

async function maisSolicitados(req, res) {
  const resultado = await Reservation.findAll({
    attributes: ["resourceId", [Reservation.sequelize.fn("COUNT", Reservation.sequelize.col("Reservation.id")), "totalReservas"]],
    include: [{ model: Resource, as: "recurso", attributes: ["nome", "categoriaId"], include: [{ model: Category, as: "categoriaRef" }] }],
    group: ["resourceId", "recurso.id", "recurso->categoriaRef.id"],
    order: [[Reservation.sequelize.literal("totalReservas"), "DESC"]],
    limit: 10,
  });
  return res.json(resultado);
}

module.exports = { resumo, maisSolicitados };
