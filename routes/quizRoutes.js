const router = require("express").Router();
const quizController = require("../controllers/quizController");
const verifyRole = require("../middlewares/verifyRole");

// Logs rápidos para ver no terminal o que chega aqui
router.use((req, _res, next) => {
  console.log(`[QUIZ ROUTES] ${req.method} ${req.originalUrl}`);
  next();
});

/* ================= FORMANDO ================= */
router.get("/curso/:id/quizzes", quizController.listarQuizzesDoCurso);
router.get("/curso/:id/quizzes/progresso", verifyRole("formando"), quizController.obterProgressoDoCurso);
router.get("/quizzes/:id", quizController.obterQuizPorId);
router.post("/quizzes/:quizId/resolver", verifyRole("formando"), quizController.resolverQuiz);

/* ================= GESTOR =================== */

router.post("/gestor/cursos/:id/quizzes", verifyRole("gestor"), quizController.criarQuiz);
router.post("/gestor/quizzes/:id/perguntas", verifyRole("gestor"), quizController.adicionarPerguntas);

/* ================= FORMADOR ================= */
// (iguais às do gestor, mas para o role formador)
router.post("/formador/cursos/:id/quizzes", verifyRole("formador"), (req, res, next) => {
  console.log("[FORMADOR] criarQuiz", { params: req.params, body: req.body });
  return quizController.criarQuiz(req, res, next);
});

router.post("/formador/quizzes/:id/perguntas", verifyRole("formador"), (req, res, next) => {
  const count = Array.isArray(req.body) ? req.body.length : (req.body?.perguntas?.length || 0);
  console.log("[FORMADOR] adicionarPerguntas", { params: req.params, perguntas: count });
  return quizController.adicionarPerguntas(req, res, next);
});
router.get("/curso/:id/quizzes/count", quizController.contarQuizzesDoCurso);
module.exports = router;