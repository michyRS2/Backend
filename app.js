const express = require("express");
const app = express();
const cookieParser = require('cookie-parser')
var cors=require('cors');
const authRoutes = require("./routes/auth");
const PerfilRoutes = require("./routes/PerfilRoutes");
const formandoRoutes = require('./routes/formandoRoutes');
const formadorRoutes = require("./routes/formadorRoutes");
const cursoRoutes = require('./routes/cursoRoutes');
const inscricaoRoutes = require('./routes/inscricaoRoutes');
const gestorRoutes = require('./routes/gestorRoutes');
const categoriaRoutes = require("./routes/categoriaRoutes");
const areaRoutes = require("./routes/areaRoutes");
const topicoRoutes = require("./routes/topicoRoutes");
const sequelize = require('./config/database');
const path = require("path");
const moduloRoutes = require('./routes/moduloRoutes');
const forumRoutes = require('./routes/forumRoutes');
const notificacoesRoutes = require('./routes/notificacoes');
const quizRoutes = require("./routes/quizRoutes");



//Configurações
app.set("port", process.env.PORT || 3000);
app.use(cors({origin: 'http://localhost:5173', credentials: true}));

//Middlewares
app.use(cookieParser());
app.use(express.json());



//modelos
const db = require("./models/index");

//sincronização das tabelas
db.sequelize.sync({alter: true})
  .then(() =>{
    console.log("Tabelas sincronizadas com sucesso.");
  })
  .catch((err) =>{
    console.error("Erro ao sincronizar as tabelas: ",err);
  });




//Rotas
app.use("/", authRoutes);
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
app.use("/api", require("./routes/quizRoutes"));


app.use('/notificacoes', notificacoesRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/teste', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'uploads', '1756332933016-render_vite.pdf'));
});

app.listen(app.get("port"), () => {
  console.log("Start server on port " + app.get("port"));
});
