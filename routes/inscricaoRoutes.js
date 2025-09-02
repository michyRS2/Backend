// routes/inscricaoRoutes.js
const express = require('express');
const router = express.Router();
const inscricaoController = require('../controllers/inscricaoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, inscricaoController.criarInscricao);

module.exports = router;
