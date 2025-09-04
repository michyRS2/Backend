const {
  Curso,
  Formador,
  Topico,
  Area,
  Categoria,
  Modulo,
  Aula,
  Inscricao,
  ConteudoAula,
  Sequelize,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

// Função para sanitizar a query de busca (remove caracteres especiais)
const sanitizeQuery = (str) => {
  return str.replace(/[^\w\sÀ-ÿ]/gi, ""); // Mantém letras, números e espaços
};

//Criar Curso
const criarCurso = async (req, res) => {
  try {
    const {
      Nome_Curso, Tipo_Curso, Descricao, Data_Inicio, Data_Fim, Imagem, ID_Topico,
      Vagas, ID_Formador, Objetivos, Includes
    } = req.body;

    const novoCurso = await Curso.create({
      Nome_Curso,
      Tipo_Curso,
      Descricao,
      Data_Inicio,
      Data_Fim,
      Imagem,
      ID_Topico,
      Vagas: Vagas || null,
      ID_Formador: ID_Formador || null,
      Objetivos: Objetivos ? JSON.stringify(Objetivos) : null,
      Includes: Includes ? JSON.stringify(Includes) : null,
    });

    return res.status(201).json({ ID_Curso: novoCurso.ID_Curso });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar curso." });
  }
};

// Buscar detalhes completos de um curso pelo ID
const getCursoDetalhado = async (req, res) => {
  const { id } = req.params;

  try {
    const curso = await Curso.findByPk(parseInt(id), {
      include: [
        {
          model: Topico,
          as: "topico",
          include: [
            {
              model: Area,
              as: "area",
              include: [
                {
                  model: Categoria,
                  as: "categoria",
                  attributes: ["Nome"],
                },
              ],
            },
          ],
        },
        {
          model: Formador,
          as: "formador",
          attributes: ["Nome"],
        },
        {
          model: Modulo,
          include: [
            {
              model: Aula,
              as: 'aulas',
              include: [
                {
                  model: ConteudoAula,
                  as: "conteudos",
                  attributes: ["ID_Conteudo", "Nome_Original", "URL", "Tipo"],
                }
              ]
            }
          ]
        }
      ],
    });

    if (!curso) {
      return res.status(404).json({ erro: "Curso não encontrado" });
    }

    // avaliação do utilizador logado (se existir)
    const idFormando = req.user?.id;
    let minhaAvaliacao = null;
    if (idFormando) {
      const insc = await Inscricao.findOne({
        where: { ID_Formando: idFormando, ID_Curso: curso.ID_Curso },
        attributes: ["Avaliacao"]
      });
      minhaAvaliacao = insc?.Avaliacao ?? null;
    }

    // Monta resposta simplificada
    const categoriaNome = curso.topico?.area?.categoria?.Nome || "N/A";
    const formadorNome = curso.formador?.Nome || "N/A";

    const cursoDetalhado = {
      ID_Curso: curso.ID_Curso,
      Nome_Curso: curso.Nome_Curso,
      Imagem: curso.Imagem,
      Tipo_Curso: curso.Tipo_Curso,
      Categoria: categoriaNome,
      Formador: formadorNome,
      ID_Topico: curso.ID_Topico,
      Data_Inicio: curso.Data_Inicio,
      Data_Fim: curso.Data_Fim,
      Descricao: curso.Descricao,
      Vagas: curso.Vagas,
      Rating: Number(curso.Rating ?? 0),
      Numero_Avaliacoes: Number(curso.Numero_Avaliacoes ?? 0),
      Rating: curso.Rating,
      Objetivos: curso.Objetivos,
      Includes: curso.Includes,
      modulos: curso.modulos,
      CriadoPor: curso.CriadoPor,
      AtualizadoPor: curso.AtualizadoPor,
      Minha_Avaliacao: minhaAvaliacao
    };

    res.json(cursoDetalhado);
  } catch (error) {
    console.error("Erro ao buscar curso:", error);
    res.status(500).json({ erro: "Erro interno ao buscar curso" });
  }
};

// Buscar cursos pela query de pesquisa - VERSÃO CORRIGIDA
const searchCursos = async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim() === "") {
    return res.status(400).json({ erro: "O termo de pesquisa é obrigatório" });
  }

  const sanitizedQuery = sanitizeQuery(query);
  const ID_Formando = req.user?.id;

  try {
    const cursos = await Curso.findAll({
      limit: 20,
      include: [
        {
          model: Topico,
          as: "topico",
          include: [
            {
              model: Area,
              as: "area",
              include: [
                {
                  model: Categoria,
                  as: "categoria",
                  attributes: ["ID_Categoria", "Nome"]
                },
              ],
              attributes: ["ID_Area", "Nome"]
            },
          ],
          attributes: ["ID_Topico", "Nome"]
        },
        {
          model: Formador,
          as: "formador",
          attributes: ["ID_Formador", "Nome", "Email"]
        },
      ],
      where: {
        [Op.or]: [
          { Nome_Curso: { [Op.iLike]: `%${sanitizedQuery}%` } },
          { Descricao: { [Op.iLike]: `%${sanitizedQuery}%` } },
          { Tipo_Curso: { [Op.iLike]: `%${sanitizedQuery}%` } },
          { "$topico.Nome$": { [Op.iLike]: `%${sanitizedQuery}%` } },
          { "$topico.area.Nome$": { [Op.iLike]: `%${sanitizedQuery}%` } },
          { "$topico.area.categoria.Nome$": { [Op.iLike]: `%${sanitizedQuery}%` } },
        ],
      },
      order: [['Nome_Curso', 'ASC']]
    });

    // Obter os IDs dos cursos encontrados
    const cursoIds = cursos.map((c) => c.ID_Curso);

    // inscrições do utilizador para estes cursos (com Avaliacao)
    const inscricoes = await Inscricao.findAll({
      where: { ID_Formando, ID_Curso: cursoIds },
      attributes: ["ID_Curso", "Avaliacao"]
    });

    // Buscar as inscrições do formando nesses cursos (se estiver autenticado)
    let cursosInscritos = [];
    if (ID_Formando) {
      const inscricoes = await Inscricao.findAll({
        where: {
          ID_Formando: ID_Formando,
          ID_Curso: cursoIds,
        },
      });
      cursosInscritos = inscricoes.map((i) => i.ID_Curso);
    }

    const mapAvaliacao = new Map(inscricoes.map((i) => [i.ID_Curso, i.Avaliacao]));


    // Construir resposta completa
    const resultados = cursos.map((curso) => {
      const categoria = curso.topico?.area?.categoria?.Nome || "Sem categoria";
      const formador = curso.formador?.Nome || "Não especificado";

      return {
        id: curso.ID_Curso,
        ID_Curso: curso.ID_Curso,
        title: curso.Nome_Curso,
        Nome_Curso: curso.Nome_Curso,
        Descricao: curso.Descricao,
        Tipo_Curso: curso.Tipo_Curso,
        Estado_Curso: curso.Estado_Curso,
        Data_Inicio: curso.Data_Inicio,
        Data_Fim: curso.Data_Fim,
        Vagas: curso.Vagas,
        Imagem: curso.Imagem,
        Rating: curso.Rating || 0,
        Objetivos: curso.Objetivos,
        Includes: curso.Includes,
        category: categoria,
        formador: formador,
        startDate: curso.Data_Inicio,
        endDate: curso.Data_Fim,
        period: curso.Data_Inicio && curso.Data_Fim
          ? Math.ceil((new Date(curso.Data_Fim) - new Date(curso.Data_Inicio)) / (1000 * 60 * 60 * 24))
          : 0,
        inscrito: cursosInscritos.includes(curso.ID_Curso),
        rating: Number(curso.Rating ?? 0),
        numeroAvaliacoes: Number(curso.Numero_Avaliacoes ?? 0),
        minhaAvaliacao: mapAvaliacao.get(curso.ID_Curso) ?? null,
        topico: curso.topico ? {
          ID_Topico: curso.topico.ID_Topico,
          Nome: curso.topico.Nome,
          area: curso.topico.area ? {
            ID_Area: curso.topico.area.ID_Area,
            Nome: curso.topico.area.Nome,
            categoria: curso.topico.area.categoria ? {
              ID_Categoria: curso.topico.area.categoria.ID_Categoria,
              Nome: curso.topico.area.categoria.Nome
            } : null
          } : null
        } : null
      };
    });

    res.json(resultados);
  } catch (error) {
    console.error("Erro na busca de cursos:", error);
    res.status(500).json({
      erro: "Erro interno ao buscar cursos",
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================= Avaliar curso ==============================
// Regras:
// - Primeira avaliação: grava em Inscricao.Avaliacao, incrementa Numero_Avaliacoes, recalcula média
// - Atualização da avaliação: ajusta média substituindo a nota anterior, sem mexer no contador

const avaliarCurso = async (req, res) => {
  const idCurso = Number(req.params.id);
  const valor = Number(req.body.nota);
  const idFormando = req.user?.id;

  if (!Number.isFinite(valor) || valor < 0 || valor > 5) {
    return res.status(400).json({ error: "Nota inválida (0 a 5)." });
  }
  if (!idFormando) return res.status(401).json({ error: "Não autenticado." });

  try {
    // tem de existir inscrição do utilizador para este curso
    const insc = await Inscricao.findOne({
      where: { ID_Formando: idFormando, ID_Curso: idCurso },
      attributes: ["ID_Inscricao", "Avaliacao"]
    });
    if (!insc) return res.status(403).json({ error: "Necessita estar inscrito para avaliar." });

    const t = await sequelize.transaction();

    try {
      // atualizar ou remover avaliação
      if (valor === 0) {
        await Inscricao.update(
          { Avaliacao: null },
          { where: { ID_Inscricao: insc.ID_Inscricao }, transaction: t }
        );
      } else {
        await Inscricao.update(
          { Avaliacao: valor },
          { where: { ID_Inscricao: insc.ID_Inscricao }, transaction: t }
        );
      }

      // recalcular média e nº avaliações a partir da tabela Inscricao
      const stats = await Inscricao.findOne({
        where: { ID_Curso: idCurso, Avaliacao: { [Op.ne]: null } },
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("Avaliacao")), "num"],
          [sequelize.fn("AVG", sequelize.col("Avaliacao")), "media"]
        ],
        raw: true,
        transaction: t
      });

      const novaMedia = Number(stats.media ?? 0);
      const novoNum = Number(stats.num ?? 0);

      await Curso.update(
        {
          Rating: novaMedia,
          Numero_Avaliacoes: novoNum
        },
        { where: { ID_Curso: idCurso }, transaction: t }
      );

      await t.commit();

      const atualizado = await Curso.findByPk(idCurso, {
        attributes: ["ID_Curso", "Nome_Curso", "Rating", "Numero_Avaliacoes"]
      });
      if (!atualizado) return res.status(404).json({ error: "Curso não encontrado." });

      return res.json({
        ID_Curso: atualizado.ID_Curso,
        Nome_Curso: atualizado.Nome_Curso,
        Rating: Number(atualizado.Rating ?? 0),
        Numero_Avaliacoes: Number(atualizado.Numero_Avaliacoes ?? 0),
        Minha_Avaliacao: valor === 0 ? null : valor
      });
    } catch (errTx) {
      await t.rollback();
      throw errTx;
    }
  } catch (err) {
    console.error("Erro ao avaliar curso:", err);
    return res.status(500).json({ error: "Erro ao atualizar avaliação." });
  }
};


module.exports = {
  getCursoDetalhado,
  searchCursos,
  criarCurso,
  avaliarCurso
};