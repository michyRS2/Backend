const { Inscricao } = require('../models');

const criarInscricao = async (req, res) => {
  const ID_Formando = req.user.id; // assumindo JWT ou middleware de autenticação
  const { ID_Curso } = req.body;

  try {
    const jaInscrito = await Inscricao.findOne({
      where: { ID_Formando, ID_Curso }
    });

    if (jaInscrito) {
      return res.status(400).json({ erro: 'Já está inscrito neste curso' });
    }

    const novaInscricao = await Inscricao.create({
      ID_Formando,
      ID_Curso,
      Data_Inscricao: new Date(),
      Estado_Inscricao: 'Pendente'
    });

    res.status(201).json(novaInscricao);
  } catch (error) {
    console.error('Erro ao criar inscrição:', error);
    res.status(500).json({ erro: 'Erro ao processar inscrição' });
  }
};

module.exports = {
  criarInscricao
};
