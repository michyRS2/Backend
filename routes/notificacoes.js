const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { Notificacao, Gestor } = require('../models');
// DELETE /notificacoes/lidas - Remover apenas notificações LIDAS do usuário
router.delete('/lidas', authMiddleware, async (req, res) => {
  try {
    console.log('Recebido pedido para remover notificações lidas');
    console.log('User ID:', req.user.id);
    console.log('User Role:', req.user.role);
    
    const count = await Notificacao.destroy({
      where: {
        ID_Utilizador: req.user.id,
        Tipo_Utilizador: req.user.role,
        Lida: true
      }
    });
    
    res.json({ 
      message: `Notificações lidas removidas (${count} removidas)`,
      count: count
    });
    
  } catch (error) {
    console.error('Erro na rota de remover notificações lidas:', error);
    res.status(500).json({ 
      error: 'Erro ao remover notificações lidas',
      details: error.message 
    });
  }
});

// GET /notificacoes - Listar notificações do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const notificacoes = await Notificacao.findAll({
      where: {
        ID_Utilizador: req.user.id,
        Tipo_Utilizador: req.user.role
      },
      order: [['Data_Criacao', 'DESC']],
      limit
    });
    res.json(notificacoes);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// GET /notificacoes/nao-lidas - Contar não lidas
router.get('/nao-lidas', authMiddleware, async (req, res) => {
  try {
    const count = await Notificacao.count({
      where: {
        ID_Utilizador: req.user.id,
        Tipo_Utilizador: req.user.role,
        Lida: false
      }
    });
    res.json({ count });
  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    res.status(500).json({ error: 'Erro ao contar notificações' });
  }
});

// PUT /notificacoes/:id/ler - Marcar como lida
router.put('/:id/ler', authMiddleware, async (req, res) => {
  try {
    await Notificacao.update(
      {
        Lida: true,
        Data_Leitura: new Date()
      },
      {
        where: { ID_Notificacao: req.params.id }
      }
    );
    res.json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação' });
  }
});

// PUT /notificacoes/ler-todas - Marcar todas como lidas
router.put('/ler-todas', authMiddleware, async (req, res) => {
  try {
    await Notificacao.update(
      {
        Lida: true,
        Data_Leitura: new Date()
      },
      {
        where: {
          ID_Utilizador: req.user.id,
          Tipo_Utilizador: req.user.role,
          Lida: false
        }
      }
    );
    res.json({ message: 'Todas as notificações marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar notificações:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações' });
  }
});

// DELETE /notificacoes/:id - Remover uma notificação específica
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Notificacao.destroy({
      where: {
        ID_Notificacao: req.params.id,
        ID_Utilizador: req.user.id,
        Tipo_Utilizador: req.user.role
      }
    });
    
    if (result === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada ou não pertence ao utilizador' });
    }
    
    res.json({ message: 'Notificação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover notificação:', error);
    res.status(500).json({ error: 'Erro ao remover notificação' });
  }
});

// DELETE /notificacoes/todas - Remover TODAS as notificações do usuário
router.delete('/todas', authMiddleware, async (req, res) => {
  try {
    const count = await Notificacao.destroy({
      where: {
        ID_Utilizador: req.user.id,
        Tipo_Utilizador: req.user.role
      }
    });
    
    res.json({ 
      message: `Todas as notificações removidas (${count} removidas)` 
    });
  } catch (error) {
    console.error('Erro ao remover notificações:', error);
    res.status(500).json({ error: 'Erro ao remover notificações' });
  }
});
// POST /notificacoes/novo-pedido-registo - Criar notificação para novo pedido
router.post('/novo-pedido-registo', async (req, res) => {
  try {
    const { utilizador } = req.body; // { Nome, Email, etc }
    
    // Encontrar todos os gestores
    const gestores = await Gestor.findAll();
    
    const notificacoes = [];
    
    for (const gestor of gestores) {
      const notificacao = await Notificacao.create({
        ID_Utilizador: gestor.ID_Gestor,
        Tipo_Utilizador: 'gestor',
        Titulo: 'Novo Pedido de Registo',
        Mensagem: `Novo pedido de registo de ${utilizador.Nome} (${utilizador.Email}) aguarda aprovação.`,
        Tipo: 'registro',
        Link_Acão: '/gestor/gerir-utilizadores', // ← LINK AQUI
        Prioridade: 'alta'
      });
      
      notificacoes.push(notificacao);
    }
    
    res.json({ message: 'Notificações criadas com sucesso', notificacoes });
  } catch (error) {
    console.error('Erro ao criar notificações:', error);
    res.status(500).json({ error: 'Erro ao criar notificações' });
  }
});



module.exports = router;