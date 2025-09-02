const { Op } = require("sequelize");
const {
  sequelize,
  Curso,
  Formador,
  Categoria,
  Area,
  Topico,
  ConteudoAula,
  Gestor,
  GestorCurso,
  Formando,
  Inscricao,
  Modulo,
  Aula,
  Quiz,
} = require("../models");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUtilizadores = await Formando.count();

    const novosUtilizadores = await Formando.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Utilizadores ativos (com pelo menos uma inscrição)
    const utilizadoresAtivos = await Inscricao.count({
      distinct: true,
      col: "ID_Formando",
    });

    // Agrupar cursos por categoria
    const categorias = await Categoria.findAll({
      include: {
        model: Area,
        as: "areas",
        include: {
          model: Topico,
          as: "topicos",
          include: {
            model: Curso,
            as: "cursos",
          },
        },
      },
    });

    const cursosPorCategoria = categorias.map((categoria) => {
      let totalCursos = 0;
      categoria.areas.forEach((area) =>
        area.topicos.forEach((topico) => (totalCursos += topico.cursos.length))
      );
      return {
        categoria: categoria.Nome,
        total: totalCursos,
      };
    });

    res.json({
      totalUtilizadores,
      novosUtilizadores,
      utilizadoresAtivos,
      cursosPorCategoria,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao obter estatísticas" });
  }
};

//Categorias

exports.getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar categorias" });
  }
};

exports.createCategoriaCompleta = async (req, res) => {
  const { nome, areas } = req.body;

  console.log("Dados recebidos no backend:", req.body);

  try {
    const categoria = await Categoria.create({ Nome: nome });

    for (const area of areas) {
      const novaArea = await Area.create({
        Nome: area.nome,
        ID_Categoria: categoria.ID_Categoria,
      });

      for (const topicoNome of area.topicos) {
        await Topico.create({
          Nome: topicoNome,
          ID_Area: novaArea.ID_Area,
        });
      }
    }

    res.status(201).json({ mensagem: "Categoria criada com sucesso." });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    res
      .status(500)
      .json({ mensagem: "Erro ao criar categoria.", erro: error.message });
  }
};

exports.updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { Nome, Areas = [] } = req.body;

  try {
    // Atualizar o nome da categoria
    await Categoria.update({ Nome }, { where: { ID_Categoria: id } });

    // Array para guardar IDs das áreas após update/criação
    const areaIdsRecebidos = [];

    for (const area of Areas) {
      let areaId;

      if (area.ID_Area) {
        // Atualizar área existente
        await Area.update(
          { Nome: area.Nome },
          { where: { ID_Area: area.ID_Area, ID_Categoria: id } }
        );
        areaId = area.ID_Area;
      } else {
        // Criar nova área e guardar o ID
        const novaArea = await Area.create({
          Nome: area.Nome,
          ID_Categoria: id,
        });
        areaId = novaArea.ID_Area;
      }

      areaIdsRecebidos.push(areaId);

      const topicos = area.Topicos || [];

      // Array para guardar IDs dos tópicos após update/criação
      const topicoIdsRecebidos = [];

      for (const topico of topicos) {
        if (topico.ID_Topico) {
          // Atualizar tópico existente
          await Topico.update(
            { Nome: topico.Nome },
            { where: { ID_Topico: topico.ID_Topico, ID_Area: areaId } }
          );
          topicoIdsRecebidos.push(topico.ID_Topico);
        } else {
          // Criar novo tópico e guardar o ID
          const novoTopico = await Topico.create({
            Nome: topico.Nome,
            ID_Area: areaId,
          });
          topicoIdsRecebidos.push(novoTopico.ID_Topico);
        }
      }

      // Eliminar tópicos que não aparecem no payload (excluindo os que acabámos de guardar)
      if (topicoIdsRecebidos.length > 0) {
        await Topico.destroy({
          where: {
            ID_Area: areaId,
            ID_Topico: { [Op.notIn]: topicoIdsRecebidos },
          },
        });
      } else {
        // Se não existem tópicos recebidos, apaga todos os tópicos da área
        await Topico.destroy({
          where: { ID_Area: areaId },
        });
      }
    }

    // Eliminar áreas que não aparecem no payload
    if (areaIdsRecebidos.length > 0) {
      await Area.destroy({
        where: {
          ID_Categoria: id,
          ID_Area: { [Op.notIn]: areaIdsRecebidos },
        },
      });
    } else {
      // Se não há áreas recebidas, apaga todas as áreas da categoria
      await Area.destroy({
        where: { ID_Categoria: id },
      });
    }

    return res
      .status(200)
      .json({ message: "Categoria e estrutura atualizadas com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return res
      .status(500)
      .json({ error: "Erro ao atualizar categoria", detalhes: error.message });
  }
};

exports.deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await Categoria.destroy({ where: { ID_Categoria: id } });
    res.status(200).json({ message: "Categoria eliminada com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao eliminar categoria" });
  }
};

//Area
exports.getAreas = async (req, res) => {
  try {
    const areas = await Area.findAll({ include: Categoria });
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar áreas" });
  }
};

exports.createArea = async (req, res) => {
  try {
    const novaArea = await Area.create(req.body);
    res.status(201).json(novaArea);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar área" });
  }
};

exports.updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    await Area.update(req.body, { where: { ID_Area: id } });
    res.status(200).json({ message: "Área atualizada com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar área" });
  }
};

exports.deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    await Area.destroy({ where: { ID_Area: id } });
    res.status(200).json({ message: "Área eliminada com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao eliminar área" });
  }
};

// Topicos

exports.getTopicos = async (req, res) => {
  try {
    const topicos = await Topico.findAll({ include: Area });
    res.json(topicos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar tópicos" });
  }
};

exports.createTopico = async (req, res) => {
  try {
    const novoTopico = await Topico.create(req.body);
    res.status(201).json(novoTopico);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar tópico" });
  }
};

exports.updateTopico = async (req, res) => {
  try {
    const { id } = req.params;
    await Topico.update(req.body, { where: { ID_Topico: id } });
    res.status(200).json({ message: "Tópico atualizado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar tópico" });
  }
};

exports.deleteTopico = async (req, res) => {
  try {
    const { id } = req.params;
    await Topico.destroy({ where: { ID_Topico: id } });
    res.status(200).json({ message: "Tópico eliminado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao eliminar tópico" });
  }
};

// Listar cursos
exports.getCursos = async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(
              `(SELECT COUNT(*)::int FROM "Quiz" q WHERE q."ID_Curso" = "curso"."ID_Curso")`
              //              
            ),
            "Num_Quizzes",
          ],
        ],
      },
      include: [
        { model: Formador, as: "formador", attributes: ["ID_Formador", "Nome"] },
        { model: Topico, as: "topico", attributes: ["ID_Topico", "Nome"] },
      ],
      order: [["ID_Curso", "ASC"]],
    });

    // força Number no JSON (evita string vindo do literal)
    const plain = cursos.map((c) => {
      const o = c.get({ plain: true });
      o.Num_Quizzes = Number(o.Num_Quizzes || 0);
      return o;
    });

    res.json(plain);
  } catch (error) {
    console.error("Erro ao obter cursos:", error);
    res.status(500).json({ error: "Erro ao obter cursos" });
  }
};

exports.getCursoById = async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await Curso.findByPk(id, {
      attributes: {
        include: [
          [
            sequelize.literal(
              `(SELECT COUNT(*)::int FROM "Quiz" q WHERE q."ID_Curso" = "curso"."ID_Curso")`
            ),
            "Num_Quizzes",
          ],
        ],
      },
      include: [
        {
          model: Modulo,
          as: "modulos",
          include: [
            {
              model: Aula,
              as: "aulas",
              include: [{ model: ConteudoAula, as: "conteudos" }],
            },
          ],
        },
        { model: Topico, as: "topico", attributes: ["ID_Topico", "Nome"] },
        { model: Formador, as: "formador", attributes: ["ID_Formador", "Nome"] },
      ],
    });

    if (!curso) return res.status(404).json({ error: "Curso não encontrado" });

    const plain = curso.get({ plain: true });
    plain.Num_Quizzes = Number(plain.Num_Quizzes || 0);

    res.json(plain);
  } catch (error) {
    console.error("Erro ao obter curso:", error);
    res.status(500).json({ error: "Erro ao obter curso" });
  }
};

// Criar curso
exports.createCurso = async (req, res) => {
  try {
    const {
      Nome_Curso,
      Tipo_Curso,
      Descricao,
      Data_Inicio,
      Data_Fim,
      Vagas,
      Imagem,
      Objetivos,
      Includes,
      ID_Topico,
      ID_Formador, // opcional
    } = req.body;

    // Validação base
    if (
      !Nome_Curso ||
      !Tipo_Curso ||
      !Descricao ||
      !Data_Inicio ||
      !Data_Fim ||
      !ID_Topico
    ) {
      return res.status(400).json({ error: "Campos obrigatórios em falta." });
    }

    // Validar tipo de curso
    if (Tipo_Curso === "síncrono" && (!Vagas || !ID_Formador)) {
      return res.status(400).json({
        error: "Cursos síncronos requerem formador e número de vagas.",
      });
    }

    // Cálculo do estado automático
    const hoje = new Date();
    const inicio = new Date(Data_Inicio);
    const fim = new Date(Data_Fim);
    if (fim < inicio) {
      return res.status(400).json({
        error: "A data de fim não pode ser anterior à data de início.",
      });
    }
    

    let estadoCalculado = "ativo";
    if (hoje >= inicio && hoje <= fim) {
      estadoCalculado = "em curso";
    } else if (hoje > fim) {
      estadoCalculado = "terminado";
    }

    const novoCurso = await Curso.create({
      Nome_Curso,
      Tipo_Curso,
      Estado_Curso: estadoCalculado,
      Descricao,
      Data_Inicio,
      Data_Fim,
      Vagas: Tipo_Curso === "síncrono" ? Vagas : null,
      Imagem,
      Objetivos: Objetivos || [],
      Includes: Includes || [],
      ID_Topico,
      ID_Formador: Tipo_Curso === "síncrono" ? ID_Formador : null,
      ID_Gestor: req.user.id, // Vem do middleware de autenticação
    });

    res.status(201).json(novoCurso);
  } catch (error) {
    console.error("Erro ao criar curso:", error.message, error.stack);
    res.status(500).json({ error: "Erro ao criar curso" });
  }
};

// Atualizar curso
exports.updateCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({ error: "Curso não encontrado." });
    }

    const {
      Nome_Curso,
      Tipo_Curso,
      Descricao,
      Data_Inicio,
      Data_Fim,
      Vagas,
      Imagem,
      Objetivos,
      Includes,
      ID_Topico,
      ID_Formador,
      modulos // <- esperado do frontend
    } = req.body;

    if (!Nome_Curso || !Tipo_Curso || !Data_Inicio || !Data_Fim || !ID_Topico) {
      return res.status(400).json({ error: "Campos obrigatórios em falta." });
    }

    if (Tipo_Curso === "síncrono" && (!Vagas || !ID_Formador)) {
      return res
        .status(400)
        .json({ error: "Cursos síncronos requerem vagas e formador." });
    }

    const hoje = new Date();
    const inicio = new Date(Data_Inicio);
    const fim = new Date(Data_Fim);
    if (fim < inicio) {
      return res
        .status(400)
        .json({ error: "A data de fim não pode ser anterior à de início." });
    }

    let estadoCalculado = "ativo";
    if (hoje >= inicio && hoje <= fim) {
      estadoCalculado = "em curso";
    } else if (hoje > fim) {
      estadoCalculado = "terminado";
    }

    const dadosAtualizados = {
      Nome_Curso,
      Tipo_Curso,
      Estado_Curso: estadoCalculado,
      Descricao,
      Data_Inicio,
      Data_Fim,
      Imagem: Imagem || null,
      ID_Topico,
      Vagas: Tipo_Curso === "síncrono" ? parseInt(Vagas) : null,
      ID_Formador: Tipo_Curso === "síncrono" ? parseInt(ID_Formador) : null,
    };

    if (Tipo_Curso === "assíncrono") {
      dadosAtualizados.Objetivos = Objetivos || [];
      dadosAtualizados.Includes = Includes || [];
    }

    await Curso.update(dadosAtualizados, { where: { ID_Curso: id } });

    // ------------------- Atualizar módulos/aulas/conteúdos -------------------
    if (modulos && Array.isArray(modulos)) {
      for (const moduloData of modulos) {
        let modulo;
        if (moduloData.ID_Modulo) {
          await Modulo.update(
            { Titulo: moduloData.Titulo },
            { where: { ID_Modulo: moduloData.ID_Modulo } }
          );
          modulo = await Modulo.findByPk(moduloData.ID_Modulo);
        } else {
          modulo = await Modulo.create({ Titulo: moduloData.Titulo, ID_Curso: id });
        }

        if (moduloData.aulas) {
          for (const aulaData of moduloData.aulas) {
            let aula;
            if (aulaData.ID_Aula) {
              await Aula.update(
                { Titulo: aulaData.Titulo, Descricao: aulaData.Descricao },
                { where: { ID_Aula: aulaData.ID_Aula } }
              );
              aula = await Aula.findByPk(aulaData.ID_Aula);
            } else {
              aula = await Aula.create({
                Titulo: aulaData.Titulo,
                Descricao: aulaData.Descricao,
                ID_Modulo: modulo.ID_Modulo,
              });
            }

            // ------------------- Conteúdos da Aula -------------------
            if (aulaData.conteudos) {
              for (const conteudoData of aulaData.conteudos) {
                if (conteudoData.ID_Conteudo) {
                  await ConteudoAula.update(
                    {
                      Nome: conteudoData.Nome,
                      Nome_Original: conteudoData.Nome_Original,
                      URL: conteudoData.URL,
                      Tipo: conteudoData.Tipo,
                    },
                    { where: { ID_Conteudo: conteudoData.ID_Conteudo } }
                  );
                } else {
                  await ConteudoAula.create({
                    ...conteudoData,
                    ID_Aula: aula.ID_Aula,
                  });
                }
              }
            }
          }
        }
      }
    }

    res.status(200).json({ message: "Curso atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar curso:", error);
    res.status(500).json({ error: "Erro interno ao atualizar curso." });
  }
};

// Eliminar curso
exports.deleteCurso = async (req, res) => {
  try {
    const { id } = req.params;
    await Curso.destroy({ where: { ID_Curso: id } });
    res.status(200).json({ message: "Curso eliminado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao eliminar curso" });
  }
};

// Percurso formativo
exports.getPercursoFormativo = async (req, res) => {
  try {
    const percurso = await Formando.findAll({
      include: {
        model: Inscricao,
        include: Curso,
      },
    });
    res.json(percurso);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter percurso formativo" });
  }
};

exports.getFormadores = async (req, res) => {
  try {
    const formadores = await Formador.findAll({
      attributes: ["ID_Formador", "Nome", "Email"],
    });
    res.json(formadores);
  } catch (error) {
    console.error("Erro ao obter formadores:", error);
    res.status(500).json({ error: "Erro ao obter formadores" });
  }
};
