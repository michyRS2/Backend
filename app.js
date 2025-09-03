const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require("path");
const bcrypt = require('bcrypt');

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
  'http://localhost:5173',
  'https://frontend-qipy.onrender.com'
];

// Middlewares
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// === FUNÇÃO PARA CRIAR GESTOR PADRÃO SE NÃO EXISTIR ===
const createDefaultGestor = async () => {
  try {
    const existingGestor = await db.Gestor.findOne({ where: { Email: 'admin@softskills.com' } });
    if (existingGestor) {
      console.log('✅ Gestor já existe. Nada a criar.');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const newGestor = await db.Gestor.create({
      Nome: 'Administrador',
      Email: 'admin@softskills.com',
      Password: hashedPassword,
      Estado: 'ativo'
    });

    console.log('✅ Gestor criado automaticamente:', newGestor.Email);
  } catch (err) {
    console.error('❌ Erro ao criar gestor:', err);
  }
};

// Sincronização das tabelas e criação do gestor
db.sequelize.sync({ alter: true })
  .then(async () => {
    console.log("Tabelas sincronizadas com sucesso.");
    await createDefaultGestor(); // cria gestor antes de iniciar o servidor
  })
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

app.get("/publico", (req, res) => {
  res.json({ mensagem: "Esta é uma rota pública, não precisa de token!" });
});

// Start do servidor
app.listen(app.get("port"), () => {
  console.log("Start server on port " + app.get("port"));
});
