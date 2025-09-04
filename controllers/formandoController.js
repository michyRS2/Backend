const {
  Inscricao,
  Curso,
  Topico,
  Area,
  Categoria,
  Forum,
  Formador,
  Sequelize,
} = require("../models");

const getDashboard = async (req, res) => {
  try {
    const ID_Formando = req.user.id;

    console.log(`Buscando dados para o formando com ID: ${ID_Formando}`);

    const inscricoes = await Inscricao.findAll({
      where: { ID_Formando },
      include: {
        model: Curso,
        as: "curso",
        include: [
          {
            model: Topico,
            as: "topico",
            include: {
              model: Area,
              as: "area",
              include: {
                model: Categoria,
                as: "categoria",
              },
            },
          },
          {
            model: Formador,
            as: "formador",
            attributes: ["Nome"],
          },
        ],
      },
    });

    const cursosInscritos = inscricoes.map((inscricao) => {
      const curso = inscricao.curso; // lowercase conforme alias 'curso'
      const categoria = curso?.topico?.area?.categoria;

      return {
        ID_Curso: curso.ID_Curso,
        Nome_Curso: curso.Nome_Curso,
        Tipo_Curso: curso.Tipo_Curso,
        Estado_Curso: curso.Estado_Curso,
        Data_Inicio: curso.Data_Inicio,
        Data_Fim: curso.Data_Fim,
        Imagem: curso.Imagem,
        Categoria: categoria ? categoria.Nome : null,
        Formador: curso.formador?.Nome || null,
        Rating: Number(curso.Rating ?? 0),
        Numero_Avaliacoes: Number(curso.Numero_Avaliacoes ?? 0),
        Minha_Avaliacao: inscricao.Avaliacao ?? null,
        inscrito: true,
      };
    });

    // Cursos recomendados: excluir os IDs de cursos já inscritos
    const idsCursosInscritos = inscricoes
      .map((i) => i.ID_Curso)
      .filter(Boolean);

    const cursosRecomendados = await Curso.findAll({
      where: {
        ID_Curso: {
          [Sequelize.Op.notIn]: idsCursosInscritos,
        },
      },
      limit: 10,
      include: [
        {
          model: Topico,
          as: "topico",
          include: {
            model: Area,
            as: "area",
            include: {
              model: Categoria,
              as: "categoria",
            },
          },
        },
        {
          model: Formador,
          as: "formador",
          attributes: ["Nome"],
        },
      ],
    });

    const recomendados = cursosRecomendados.map((curso) => {
      const categoria = curso?.topico?.area?.categoria;

      return {
        ID_Curso: curso.ID_Curso,
        Nome_Curso: curso.Nome_Curso,
        Tipo_Curso: curso.Tipo_Curso,
        Estado_Curso: curso.Estado_Curso,
        Imagem: curso.Imagem,
        Categoria: categoria ? categoria.Nome : null,
        Formador: curso.formador?.Nome || null,
        Rating: Number(curso.Rating ?? 0),
        Numero_Avaliacoes: Number(curso.Numero_Avaliacoes ?? 0),
        Minha_Avaliacao: null,
        inscrito: false
      };
    });

    const percursoFormativo = inscricoes.map((inscricao) => {
      const curso = inscricao.curso;
      const categoria = curso?.topico?.area?.categoria;

      return {
        ID_Curso: curso.ID_Curso,
        Nome_Curso: curso.Nome_Curso,
        Imagem: curso.Imagem,
        Categoria: categoria ? categoria.Nome : null,
        Progresso: inscricao.Progresso || 0,
        Formador: curso.formador?.Nome || null,
      };
    });

    const topicosForum = await Forum.findAll({
  limit: 5,
  order: [['Data_Criacao', 'DESC']],
});

const forum = await Promise.all(topicosForum.map(async (topico) => {
  let autorNome = 'Utilizador';

  if (topico.Autor_Tipo === 'formando') {
    const f = await Formando.findByPk(topico.Autor_ID);
    autorNome = f ? f.Nome : autorNome;
  } else if (topico.Autor_Tipo === 'formador') {
    const f = await Formador.findByPk(topico.Autor_ID);
    autorNome = f ? f.Nome : autorNome;
  } else if (topico.Autor_Tipo === 'gestor') {
    const g = await Gestor.findByPk(topico.Autor_ID);
    autorNome = g ? g.Nome : autorNome;
  }

  return {
    ID_Forum: topico.ID_Forum,
    Titulo: topico.Titulo,
    Descricao: topico.Descricao,
    Autor: autorNome,
    Autor_ID: topico.Autor_ID,
    Autor_Tipo: topico.Autor_Tipo,
    Data_Criacao: topico.Data_Criacao,
  };
}));


    res.json({
      cursosInscritos,
      cursosRecomendados: recomendados,
      percursoFormativo,
      forum,
    });
  } catch (err) {
    console.error("Erro ao obter dashboard do formando:", err);
    res.status(500).json({ error: "Erro ao carregar dashboard do formando" });
  }
};

module.exports = {
  getDashboard,
};
