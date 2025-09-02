const express = require('express');
const router = express.Router();
const topicoController = require('../controllers/topicoController');


// Rota GET /topicos
router.get('/', topicoController.getTopicos);

// Rota GET /topicos/:id/cursos
router.get('/:id/cursos', topicoController.getCursosPorTopico);

module.exports = router;