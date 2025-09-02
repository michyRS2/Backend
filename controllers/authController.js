require('dotenv').config();
const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Formando, Gestor, Formador, Notificacao } = require('../models');

const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMPT_PASS
    }
});

const findUserByEmail = async (email) => {
    let user = await db.Formando.findOne({ where: { Email: email } });
    if (user) return { user, type: 'formando' };

    user = await db.Gestor.findOne({ where: { Email: email } });
    if (user) return { user, type: 'gestor' };

    user = await db.Formador.findOne({ where: { Email: email } });
    if (user) return { user, type: 'formador' };

    return null;
};

exports.login = async (req, res) => {
    const { Email, Password } = req.body;
    try {
        let user = await db.Formando.findOne({ where: { Email } });
        let role = 'formando';

        if (!user) {
            user = await db.Gestor.findOne({ where: { Email } });
            role = 'gestor';
        }

        if (!user) {
            user = await db.Formador.findOne({ where: { Email } });
            role = 'formador';
        }

        if (!user) return res.status(401).json({ message: 'Email não encontrado' });

        const isValid = await bcrypt.compare(Password, user.Password);
        if (!isValid) return res.status(401).json({ message: 'Senha incorreta' });

        let userId;
        if (role === 'formando') userId = user.ID_Formando;
        else if (role === 'gestor') userId = user.ID_Gestor;
        else userId = user.ID_Formador;

        const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.json({ token, user, role });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro interno' });
    }
};

exports.register = async (req, res) => {
    const { Nome, Email, Password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(Password, 10);

        const newUser = await db.Formando.create({
            Nome,
            Email,
            Password: hashedPassword,
            Estado: 'pendente'
        });

        // Notificar gestores
        const gestores = await db.Gestor.findAll();
        for (const gestor of gestores) {
            await db.Notificacao.create({
                ID_Utilizador: gestor.ID_Gestor,
                Tipo_Utilizador: 'gestor',
                Titulo: 'Novo Pedido de Registo',
                Mensagem: `Novo pedido de registo de ${newUser.Nome} (${newUser.Email}) aguarda aprovação.`,
                Tipo: 'registro',
                Link_Acão: '/gestor/gerir-utilizadores',
                Prioridade: 'alta'
            });
        }

        res.status(201).json({ message: 'Utilizador registado com sucesso', user: newUser });
    } catch (err) {
        console.error('Erro no registo:', err);
        res.status(500).json({ message: 'Erro ao registar utilizador' });
    }
};

exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    try {
        const userData = await findUserByEmail(email);
        if (!userData) return res.status(404).json({ message: 'Email não registrado' });

        const { user } = userData;
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hora

        await user.update({
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetTokenExpiry
        });

        await transporter.sendMail({
            to: email,
            from: process.env.EMAIL_FROM,
            subject: 'Recuperação de Senha',
            html: `
                <p>Você solicitou a recuperação de senha.</p>
                <p>Clique no link abaixo para redefinir:</p>
                <a href="${process.env.RESET_PASSWORD_URL}?token=${resetToken}&email=${email}">
                    Redefinir senha
                </a>
                <p>O link expira em 1 hora.</p>
            `
        });

        res.json({ message: 'Email de recuperação enviado' });
        console.log(`Email de recuperação enviado para: ${email}, token: ${resetToken}`);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao processar solicitação' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, email, currentPassword, newPassword } = req.body;
    try {
        const userData = await findUserByEmail(email);
        if (!userData) return res.status(404).json({ message: 'Email não registrado' });

        const { user } = userData;

        if (user.resetPasswordToken !== token || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: 'Token inválido ou expirado' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.Password);
        if (!isMatch) return res.status(400).json({ message: 'Senha atual incorreta' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({
            Password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });

        res.json({ message: 'Senha redefinida com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao redefinir senha' });
    }
};
