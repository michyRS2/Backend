const express = require('express');
const router = express.Router();
const PerfilController = require('../controllers/PerfilController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configurar armazenamento para imagens de perfil
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/Perfils'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'Perfil-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Rotas protegidas por autenticação
router.get('/', authMiddleware, PerfilController.getPerfil);
router.put('/', authMiddleware, PerfilController.updatePerfil);
router.put('/image', authMiddleware, upload.single('PerfilImage'), PerfilController.updatePerfilImage);
router.put('/stats', authMiddleware, PerfilController.updateStats);
router.put('/password', authMiddleware, PerfilController.changePassword);

module.exports = router;