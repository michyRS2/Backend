require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'Não autenticado' });

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: 'Token não fornecido' });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token inválido' });
    }
};

// Rotas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/check', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Autenticado', user: req.user });
});
router.post('/logout', (req, res) => {
    // Apenas no frontend removemos o token do localStorage
    res.status(200).json({ message: 'Sessão terminada com sucesso' });
});
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
