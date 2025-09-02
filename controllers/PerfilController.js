const path = require('path');
const fs = require('fs');
const db = require('../models');

// Obter perfil do usuário
exports.getPerfil = async (req, res) => {
    try {
        const { id, role } = req.user;
        console.log(`Buscando perfil para: ${role} com ID: ${id}`);

        let user;
        switch (role) {
            case 'formando':
                user = await db.Formando.findByPk(id);
                break;
            case 'gestor':
                user = await db.Gestor.findByPk(id);
                break;
            case 'formador':
                user = await db.Formador.findByPk(id);
                break;
            default:
                return res.status(400).json({ message: 'Tipo de usuário inválido' });
        }

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        console.log(user);
        res.json(user);
    } catch (error) {
        console.error('Erro ao obter perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};
// Atualizar perfil
exports.updatePerfil = async (req, res) => {
    try {
        const { name, phone, bio, location } = req.body;

        const Perfil = await Perfil.findOne({ where: { userId: req.user.id } });

        if (!Perfil) {
            return res.status(404).json({ message: 'Perfil não encontrado' });
        }

        // Atualizar campos
        Perfil.name = name || Perfil.name;
        Perfil.phone = phone || Perfil.phone;
        Perfil.bio = bio || Perfil.bio;
        Perfil.location = location || Perfil.location;

        await Perfil.save();

        res.json(Perfil);
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Atualizar imagem de perfil
exports.updatePerfilImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhuma imagem enviada' });
        }

        const Perfil = await Perfil.findOne({ where: { userId: req.user.id } });

        if (!Perfil) {
            return res.status(404).json({ message: 'Perfil não encontrado' });
        }

        // Remover imagem antiga se existir
        if (Perfil.PerfilImage) {
            const oldImagePath = path.join(__dirname, '..', 'uploads', Perfil.PerfilImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Atualizar com nova imagem
        Perfil.PerfilImage = req.file.filename;
        await Perfil.save();

        res.json({
            message: 'Imagem de perfil atualizada com sucesso',
            PerfilImage: Perfil.PerfilImage
        });
    } catch (error) {
        console.error('Erro ao atualizar imagem de perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Atualizar estatísticas do perfil
exports.updateStats = async (req, res) => {
    try {
        const { completedCourses, averageProgress, hoursTrained } = req.body;

        const Perfil = await Perfil.findOne({ where: { userId: req.user.id } });

        if (!Perfil) {
            return res.status(404).json({ message: 'Perfil não encontrado' });
        }

        Perfil.completedCourses = completedCourses !== undefined ? completedCourses : Perfil.completedCourses;
        Perfil.averageProgress = averageProgress !== undefined ? averageProgress : Perfil.averageProgress;
        Perfil.hoursTrained = hoursTrained !== undefined ? hoursTrained : Perfil.hoursTrained;

        await Perfil.save();

        res.json(Perfil);
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Alterar senha
exports.changePassword = async (req, res) => {
    try {

        // Aqui você precisaria integrar com seu sistema de autenticação
        // Esta é uma implementação de exemplo

        // 1. Verificar se a senha atual está correta
        // 2. Se correta, atualizar para a nova senha

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};