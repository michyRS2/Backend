const express = require("express");
const router = express.Router();
const { Op } = require('sequelize');
const gestorController = require("../controllers/gestorController");
const quizController = require("../controllers/quizController");
const verifyRole = require('../middlewares/verifyRole');
const moduloRoutes = require('./moduloRoutes');
const { ConteudoAula } = require('../models'); 
const { Formando, Formador, Gestor } = require('../models');

router.use(verifyRole('gestor')); // protege todas as rotas abaixo


const multer = require("multer");
const path = require("path");

// proteger todas as rotas abaixo
router.use(verifyRole('gestor'));

// ---------------------- Dashboard ----------------------
router.get("/dashboard", gestorController.getDashboardStats);

// ---------------------- Cursos ----------------------
router.get("/cursos", gestorController.getCursos);
router.get("/cursos/:id", gestorController.getCursoById);
router.post("/cursos", gestorController.createCurso);
router.put("/cursos/:id", gestorController.updateCurso);
router.delete("/cursos/:id", gestorController.deleteCurso);
router.use('/cursos/:cursoId/modulos', moduloRoutes);

// ---------------------- Quizzes ----------------------
router.post("/cursos/:id/quizzes", quizController.criarQuiz);
router.post("/quizzes/:id/perguntas", quizController.adicionarPerguntas);

// ---------------------- Categorias ----------------------
router.get("/categorias", gestorController.getCategorias);
router.post("/categorias", gestorController.createCategoriaCompleta);
router.put("/categorias/:id", gestorController.updateCategoria);
router.delete("/categorias/:id", gestorController.deleteCategoria);

// ---------------------- Áreas ----------------------
router.get("/areas", gestorController.getAreas);
router.post("/areas", gestorController.createArea);
router.put("/areas/:id", gestorController.updateArea);
router.delete("/areas/:id", gestorController.deleteArea);

// ---------------------- Tópicos ----------------------
router.get("/topicos", gestorController.getTopicos);
router.post("/topicos", gestorController.createTopico);
router.put("/topicos/:id", gestorController.updateTopico);
router.delete("/topicos/:id", gestorController.deleteTopico);

// ---------------------- Outros ----------------------
router.get("/percursos", gestorController.getPercursoFormativo);
router.get("/formadores", gestorController.getFormadores);

// ---------------------- Upload de ficheiros ----------------------
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// rota de upload (aceita múltiplos ficheiros)
router.post("/upload", upload.array("files"), async (req, res) => {
  const { ID_Aula } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Nenhum ficheiro enviado" });
  }

  if (!ID_Aula) {
    return res.status(400).json({ error: "ID_Aula é obrigatório" });
  }

  try {
    console.log("Recebido ID_Aula:", ID_Aula);
    req.files.forEach(file => {
      console.log("A criar anexo na BD:", {
        ID_Aula,
        Nome: file.filename,
        Nome_Original: file.originalname,
        URL: `/uploads/${file.filename}`,
        Tipo: file.mimetype
      });
    });

    const anexosCriados = await Promise.all(
      req.files.map((file) =>
        ConteudoAula.create({
          ID_Aula,
          Nome: file.filename,
          Nome_Original: file.originalname,
          URL: `/uploads/${file.filename}`,
          Tipo: file.mimetype,
        })
      )
    );

    res.status(200).json({
      success: true,
      anexos: anexosCriados,
    });
  } catch (err) {
    console.error("Erro ao guardar anexos na BD:", err);
    res.status(500).json({ error: "Erro ao guardar ficheiros na BD." });
  }
});


router.get('/utilizadores', async (req, res) => {
  try {
    const formandos = await Formando.findAll({
      attributes: ['ID_Formando', 'Nome', 'Email', 'Estado', 'Data_Registo']
    });

    const formadores = await Formador.findAll({
      attributes: ['ID_Formador', 'Nome', 'Email', 'Estado', 'Data_Registo']
    });

    const gestores = await Gestor.findAll({
      attributes: ['ID_Gestor', 'Nome', 'Email', 'Estado', 'Data_Registo']
    });

    // Transformar os dados para um formato comum
    const utilizadores = [
      ...formandos.map(f => ({
        id: f.ID_Formando,
        nome: f.Nome,
        email: f.Email,
        tipo: 'formando',
        estado: f.Estado || 'ativo',
        dataRegisto: f.Data_Registo
      })),
      ...formadores.map(f => ({
        id: f.ID_Formador,
        nome: f.Nome,
        email: f.Email,
        tipo: 'formador',
        estado: f.Estado || 'ativo',
        dataRegisto: f.Data_Registo
      })),
      ...gestores.map(g => ({
        id: g.ID_Gestor,
        nome: g.Nome,
        email: g.Email,
        tipo: 'gestor',
        estado: g.Estado || 'ativo',
        dataRegisto: g.Data_Registo
      }))
    ];

    res.json(utilizadores);
  } catch (error) {
    console.error('Erro ao obter utilizadores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /gestor/pedidos-registo - Listar pedidos de registo pendentes
router.get('/pedidos-registo', async (req, res) => {
  try {
    // Esta função assume que tens um campo 'Estado' com valor 'pendente' nos utilizadores
    const formandosPendentes = await Formando.findAll({
      where: { Estado: 'pendente' },
      attributes: ['ID_Formando', 'Nome', 'Email', 'Data_Registo']
    });

    const formadoresPendentes = await Formador.findAll({
      where: { Estado: 'pendente' },
      attributes: ['ID_Formador', 'Nome', 'Email', 'Data_Registo']
    });

    const pedidos = [
      ...formandosPendentes.map(f => ({
        id: f.ID_Formando,
        nome: f.Nome,
        email: f.Email,
        tipo: 'formando',
        dataPedido: f.Data_Registo
      })),
      ...formadoresPendentes.map(f => ({
        id: f.ID_Formador,
        nome: f.Nome,
        email: f.Email,
        tipo: 'formador',
        dataPedido: f.Data_Registo
      }))
    ];

    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao obter pedidos de registo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /gestor/pedidos-registo/:id/aceitar - Aceitar pedido de registo
router.put('/pedidos-registo/:id/aceitar', async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo } = req.body;

    let modelo;
    if (tipo === 'formando') {
      modelo = Formando;
    } else if (tipo === 'formador') {
      modelo = Formador;
    } else {
      return res.status(400).json({ error: 'Tipo de utilizador inválido' });
    }

    await modelo.update(
      { Estado: 'ativo' },
      { where: { [modelo.primaryKeyAttribute]: id } }
    );

    res.json({ message: 'Pedido de registo aceite com sucesso' });
  } catch (error) {
    console.error('Erro ao aceitar pedido de registo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /gestor/pedidos-registo/:id/rejeitar - Rejeitar pedido de registo
router.put('/pedidos-registo/:id/rejeitar', async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo } = req.body;

    let modelo;
    if (tipo === 'formando') {
      modelo = Formando;
    } else if (tipo === 'formador') {
      modelo = Formador;
    } else {
      return res.status(400).json({ error: 'Tipo de utilizador inválido' });
    }

    await modelo.destroy({ where: { [modelo.primaryKeyAttribute]: id } });

    res.json({ message: 'Pedido de registo rejeitado com sucesso' });
  } catch (error) {
    console.error('Erro ao rejeitar pedido de registo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /gestor/utilizadores/:id - Alterar estado do utilizador
router.put('/utilizadores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, tipo } = req.body;

    let modelo;
    if (tipo === 'formando') {
      modelo = Formando;
    } else if (tipo === 'formador') {
      modelo = Formador;
    } else if (tipo === 'gestor') {
      modelo = Gestor;
    } else {
      return res.status(400).json({ error: 'Tipo de utilizador inválido' });
    }

    await modelo.update(
      { Estado: estado },
      { where: { [modelo.primaryKeyAttribute]: id } }
    );

    res.json({ message: 'Estado do utilizador atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar estado do utilizador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
