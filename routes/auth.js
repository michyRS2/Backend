const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');


const verifyToken = (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token) return res.status(401).json({ message: 'Não autenticado' });

    try {
        req.user = jwt.verify(token, 'your_jwt_secret');
        next();
    } catch (err) {
        res.status(403).json({ message: 'Token inválido' });
    }
};


// Rotas existentes
router.post('/register', authController.register);//registo de formando
router.post('/register-formador', authController.registerFormador);//registo de formador

router.post('/login', authController.login);
router.get('/check', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Autenticado', user: req.user });
});
router.post('/logout', authController.logout);

// Solicitar recuperação de senha
router.post('/request-password-reset', authController.requestPasswordReset);

// Redefinir senha (via token)
router.post('/reset-password', authController.resetPassword);

module.exports = router;