const express = require('express');
const router = express.Router();
const formandoController = require('../controllers/formandoController');
const authMiddleware = require('../middlewares/authMiddleware');  // importa

router.get('/dashboard', authMiddleware, formandoController.getDashboard);
module.exports = router;
