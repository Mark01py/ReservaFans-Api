require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, User, Resource, Category } = require("./models");

async function seed() {
  await sequelize.sync({ force: true });

  const senhaAdmin = await bcrypt.hash("admin123", 10);
  const senhaProf = await bcrypt.hash("professor123", 10);

  await User.bulkCreate([
    { nome: "Administrador ReservaFans", email: "admin@fans.edu.br", senhaHash: senhaAdmin, perfil: "admin" },
    { nome: "Daniel Lucas de Souza Lelis", email: "daniel.lelis@fans.edu.br", senhaHash: senhaProf, perfil: "usuario" },
  ]);

  const [salaDeAula, auditorio, equipamento] = await Promise.all([
    Category.create({ nome: "Sala de Aula" }),
    Category.create({ nome: "Auditório" }),
    Category.create({ nome: "Equipamento Audiovisual" }),
  ]);

  await Resource.bulkCreate([
    { nome: "Sala 12", categoriaId: salaDeAula.id, descricao: "Sala de aula com capacidade para 40 alunos.", quantidadeTotal: 1 },
    { nome: "Auditório Principal", categoriaId: auditorio.id, descricao: "Auditório com capacidade para 120 pessoas.", quantidadeTotal: 1 },
    { nome: "Projetor Epson", categoriaId: equipamento.id, descricao: "Projetor multimídia portátil.", quantidadeTotal: 5 },
    { nome: "Microfone sem fio", categoriaId: equipamento.id, descricao: "Microfone de mão sem fio com receptor.", quantidadeTotal: 4 },
    { nome: "Conversor VGA-HDMI", categoriaId: equipamento.id, descricao: "Adaptador conversor de sinal VGA para HDMI.", quantidadeTotal: 6 },
  ]);

  console.log("Seed concluido: usuarios, categorias e recursos iniciais criados.");
  console.log("Login admin: admin@fans.edu.br / admin123");
  console.log("Login usuario: daniel.lelis@fans.edu.br / professor123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Erro ao executar o seed:", err);
  process.exit(1);
});
