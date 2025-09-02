const express = require("express");
const router = express.Router();
const formadorController = require("../controllers/formadorController");
const verifyRole = require("../middlewares/verifyRole");
const multer = require("multer");

router.use(verifyRole("formador"));

router.get("/dashboard", formadorController.getDashboard);

router.get("/editar-curso/:id", formadorController.getCursoParaEdicao);

// Configuração de storage para uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // já sabemos que a pasta está na raiz do projeto
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Atualizar curso (aceita JSON + possíveis ficheiros)
router.put(
  "/editar-curso/:cursoId/",
  upload.any(),
  formadorController.atualizarCursoDoFormador
);

// Upload de ficheiros isolado (como no gestor)
router.post(
  "/upload",
  upload.array("files"),
  formadorController.uploadFiles
);

module.exports = router;
