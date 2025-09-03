const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require("path");

// Rotas
const authRoutes = require("./routes/auth");
const PerfilRoutes = require("./routes/PerfilRoutes");
const formandoRoutes = require('./routes/formandoRoutes');
const formadorRoutes = require("./routes/formadorRoutes");
const cursoRoutes = require('./routes/cursoRoutes');
const inscricaoRoutes = require('./routes/inscricaoRoutes');
const gestorRoutes = require('./routes/gestorRoutes');
const categoriaRoutes = require("./routes/categoriaRoutes");
const areaRoutes = require('./routes/areaRoutes');
const topicoRoutes = require('./routes/topicoRoutes');
const moduloRoutes = require('./routes/moduloRoutes');
const forumRoutes = require('./routes/forumRoutes');
const notificacoesRoutes = require('./routes/notificacoes');
const quizRoutes = require("./routes/quizRoutes");

// Modelos
const db = require("./models/index");

// Configurações
app.set("port", process.env.PORT || 3000);

const allowedOrigins = [
  'http://localhost:5173',               // Frontend local
  'https://frontend-qipy.onrender.com'   // Frontend online
];

// CORS com função para múltiplas origens
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Postman, curl, etc
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // necessário para cookies
}));

// Middlewares
app.use(cookieParser());
app.use(express.json());

// Sincronização das tabelas
db.sequelize.sync({ alter: true })
  .then(() => console.log("Tabelas sincronizadas com sucesso."))
  .catch(err => console.error("Erro ao sincronizar as tabelas: ", err));

// Rotas
app.use("/auth", authRoutes);
app.use("/formando", formandoRoutes);
app.use("/gestor", gestorRoutes);
app.use('/gestor/cursos', moduloRoutes);
app.use("/formador", formadorRoutes);
app.use("/cursos", cursoRoutes);
app.use("/api/cursos", cursoRoutes);
app.use("/inscricoes", inscricaoRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/areas", areaRoutes);
app.use("/topicos", topicoRoutes);
app.use("/perfil", PerfilRoutes);
app.use("/forum", forumRoutes);
app.use("/api", quizRoutes);
app.use('/notificacoes', notificacoesRoutes);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/teste', (req, res) => {
  res.send('✅ O servidor está a funcionar corretamente!');
});


app.listen(app.get("port"), () => {
  console.log("Start server on port " + app.get("port"));
});
