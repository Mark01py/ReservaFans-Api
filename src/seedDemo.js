require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, User, Resource, Category, Reservation } = require("./models");
const { slotDoDia } = require("./utils/horarioAula");

// Banco de DEMONSTRACAO para a apresentacao (apaga e recria tudo, como o seed.js).
// Datas relativas a hoje: dia(0) = hoje, dia(1) = amanha, dia(-2) = ha dois dias...
const dia = (offset) => {
  const h = new Date();
  return slotDoDia(new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), h.getUTCDate() + offset)));
};

async function seedDemo() {
  await sequelize.sync({ force: true });

  const usuarios = {};
  for (const [chave, nome, email, senha, perfil] of [
    ["admin", "Administrador ReservaFans", "admin@fans.edu.br", "admin123", "admin"],
    ["teste", "Aluno Teste", "aluno.teste@fans.edu.br", "teste123", "usuario"],
    ["ana", "Ana Paula Ribeiro", "ana.ribeiro@fans.edu.br", "professor123", "usuario"],
    ["bruno", "Bruno Henrique Alves", "bruno.alves@fans.edu.br", "professor123", "usuario"],
    ["carla", "Carla Mendes", "carla.mendes@fans.edu.br", "professor123", "usuario"],
  ]) {
    usuarios[chave] = await User.create({ nome, email, senhaHash: await bcrypt.hash(senha, 10), perfil });
  }

  const cat = {};
  for (const nome of ["Sala de Aula", "Auditório", "Equipamento Audiovisual", "Laboratório"]) {
    cat[nome] = await Category.create({ nome });
  }

  const recursos = {};
  for (const [nome, categoria, descricao, qtd] of [
    ["Sala 12", "Sala de Aula", "Sala com capacidade para 40 alunos.", 1],
    ["Sala 14", "Sala de Aula", "Sala com capacidade para 35 alunos.", 1],
    ["Sala 21", "Sala de Aula", "Sala com capacidade para 50 alunos.", 1],
    ["Auditório Principal", "Auditório", "Auditório com capacidade para 120 pessoas.", 1],
    ["Projetor Epson", "Equipamento Audiovisual", "Projetor multimídia portátil.", 5],
    ["Microfone sem fio", "Equipamento Audiovisual", "Microfone de mão sem fio com receptor.", 4],
    ["Conversor VGA-HDMI", "Equipamento Audiovisual", "Adaptador conversor de sinal VGA para HDMI.", 6],
    ["Cabo HDMI 5m", "Equipamento Audiovisual", "Cabo HDMI de 5 metros.", 8],
    ["Caixa de som portátil", "Equipamento Audiovisual", "Caixa de som com entrada P2 e Bluetooth.", 3],
    ["Laboratório de Informática 1", "Laboratório", "Laboratório com 25 computadores.", 1],
  ]) {
    recursos[nome] = await Resource.create({ nome, categoriaId: cat[categoria].id, descricao, quantidadeTotal: qtd });
  }

  const reservas = [];
  const add = (recurso, usuario, offset, status = "ativa", obs = null) => {
    const { inicio, fim } = dia(offset);
    reservas.push({
      resourceId: recursos[recurso].id, userId: usuarios[usuario].id, dataInicio: inicio, dataFimPrevista: fim,
      status, observacoes: obs, dataDevolucaoReal: status === "devolvida" ? fim : null,
    });
  };

  // Historico (devolvidas) para os relatorios
  add("Projetor Epson", "ana", -6, "devolvida");
  add("Projetor Epson", "bruno", -5, "devolvida");
  add("Microfone sem fio", "ana", -5, "devolvida");
  add("Auditório Principal", "carla", -4, "devolvida", "Palestra de abertura");
  add("Projetor Epson", "carla", -3, "devolvida");
  // Em uso hoje e uma devolucao ATRASADA (fim previsto ja passou)
  add("Projetor Epson", "bruno", 0, "em_uso");
  add("Cabo HDMI 5m", "ana", 0, "em_uso");
  add("Microfone sem fio", "carla", -1, "em_uso", "Aguardando devolução");
  // Proximas reservas
  add("Sala 12", "ana", 1);
  add("Auditório Principal", "bruno", 2, "ativa", "Apresentação de projetos");
  add("Conversor VGA-HDMI", "carla", 1);
  add("Caixa de som portátil", "ana", 2);
  add("Laboratório de Informática 1", "bruno", 3);
  add("Projetor Epson", "teste", 2, "cancelada");
  // Reserva por periodo (uma reserva por dia): Projetor Epson, 5 dias seguidos
  for (let d = 3; d <= 7; d++) add("Projetor Epson", "ana", d, "ativa", "Uso semanal nas aulas");

  await Reservation.bulkCreate(reservas);

  console.log("Seed de demonstracao concluido.");
  console.log("Admin:   admin@fans.edu.br / admin123");
  console.log("Teste:   aluno.teste@fans.edu.br / teste123");
  process.exit(0);
}

seedDemo().catch((err) => { console.error("Erro no seed de demonstracao:", err); process.exit(1); });
