require("dotenv").config();
const { UPLOAD_DIR } = require("./middleware/upload");
const express = require("express");
const { sequelize } = require("./models");

const authRoutes = require("./routes/authRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  return next();
});

// /uploads vem depois do CORS para que o Flutter Web/navegador consiga carregar as imagens
app.use("/uploads", express.static(UPLOAD_DIR));


app.get("/api/health", (req, res) => {
  res.json({ status: "ok", servico: "ReservaFans API", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/recursos", resourceRoutes);
app.use("/api/reservas", reservationRoutes);
app.use("/api/relatorios", reportRoutes);
app.use("/api/categorias", categoryRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: "Rota nao encontrada." });
});

app.use((err, req, res, next) => {
  if (err && (err.name === "MulterError" || /imagem/i.test(err.message || ""))) {
    return res.status(400).json({ erro: err.message });
  }
  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor.", detalhe: err.message });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ReservaFans API rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error("Falha ao iniciar a aplicacao:", err);
    process.exit(1);
  }
}

start();

module.exports = app;
