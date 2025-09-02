const {
  Curso,
  Formador,
  Topico,
  Area,
  Categoria,
  Modulo,
  Aula,
  ConteudoAula,
  sequelize,
} = require("../models");
const path = require("path");
const fs = require("fs");

exports.uploadFiles = async (req, res) => {
  try {
    const { ID_Aula } = req.body;
    if (!ID_Aula) {
      return res.status(400).json({ error: "ID_Aula é obrigatório" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nenhum ficheiro enviado" });
    }

    const anexosCriados = [];

    for (const file of req.files) {
      // Cria registo no DB
      const novoConteudo = await ConteudoAula.create({
        ID_Aula: ID_Aula,
        Nome_Original: file.originalname,
        URL: `/uploads/${file.filename}`, // caminho público relativo
        Tipo: path.extname(file.originalname).slice(1) || "desconhecido",
      });

      anexosCriados.push({
        ID_Conteudo: novoConteudo.ID_Conteudo,
        Nome_Original: novoConteudo.Nome_Original,
        URL: novoConteudo.URL,
        Tipo: novoConteudo.Tipo,
      });
    }

    return res.status(200).json({ anexos: anexosCriados });
  } catch (err) {
    console.error("Erro no uploadFiles:", err);
    return res
      .status(500)
      .json({ error: "Erro ao fazer upload dos ficheiros" });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const ID_Formador = req.user.id;

    const cursos = await Curso.findAll({
      where: { ID_Formador },
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
      ],
    });

    const cursosDoFormador = cursos.map((curso) => {
      const categoria = curso?.topico?.area?.categoria;
      const area = curso?.topico?.area;
      const topico = curso?.topico;

      return {
        ID_Curso: curso.ID_Curso,
        Nome_Curso: curso.Nome_Curso,
        Tipo_Curso: curso.Tipo_Curso,
        Estado_Curso: curso.Estado_Curso,
        Data_Inicio: curso.Data_Inicio,
        Data_Fim: curso.Data_Fim,
        Imagem: curso.Imagem,
        Categoria: categoria ? categoria.Nome : null,
        Area: area ? area.Nome : null,
        Topico: topico ? topico.Nome : null,
      };
    });

    res.json({
      cursosDoFormador,
    });
  } catch (err) {
    console.error("Erro ao obter dashboard do formador:", err);
    res.status(500).json({ error: "Erro ao carregar dashboard do formador" });
  }
};

exports.getCursoParaEdicao = async (req, res) => {
  const { id } = req.params;
  const ID_Formador = req.user.id;

  try {
    const curso = await Curso.findOne({
      where: { ID_Curso: id, ID_Formador },
      attributes: ["ID_Curso", "Nome_Curso", "Objetivos", "Includes"],
      include: [
        {
          model: Modulo, // sem alias, Sequelize vai reconhecer como 'Modulos'
          include: [
            {
              model: Aula,
              as: "aulas", // este alias deve corresponder à associação
              include: [
                {
                  model: ConteudoAula,
                  as: "conteudos", // este alias deve corresponder à associação
                  attributes: [
                    "ID_Conteudo",
                    "Nome_Original",
                    "URL",
                    "Tipo",
                    "createdAt",
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!curso) {
      return res
        .status(404)
        .json({ error: "Curso não encontrado ou não autorizado." });
    }

    res.json(curso);
  } catch (err) {
    console.error("Erro ao carregar curso para edição:", err);
    res.status(500).json({ error: "Erro ao carregar curso" });
  }
};



exports.atualizarCursoDoFormador = async (req, res) => {
  const cursoId = Number(req.params.cursoId);
  if (!cursoId)
    return res.status(400).json({ error: "ID do curso não fornecido." });

  const {
    Objetivos = [],
    Includes = [],
    Modulos = [],
  } = JSON.parse(req.body.curso || "{}");
  const t = await sequelize.transaction();

  try {
    // === Guardar objetivos e includes no curso ===
    const curso = await Curso.findByPk(cursoId, { transaction: t });
    if (curso) {
      curso.Objetivos = Objetivos;
      curso.Includes = Includes;
      await curso.save({ transaction: t });
    }

    // === Processar módulos ===
    for (const mod of Modulos) {
      if (mod.toDelete && mod.ID_Modulo) {
        await Modulo.destroy({
          where: { ID_Modulo: mod.ID_Modulo },
          transaction: t,
        });
        continue;
      }

      let moduloBD;
      if (!mod.ID_Modulo) {
        moduloBD = await Modulo.create(
          { Titulo: mod.Titulo || "", ID_Curso: cursoId },
          { transaction: t }
        );
        mod.ID_Modulo = moduloBD.ID_Modulo;
      } else {
        moduloBD = await Modulo.findByPk(mod.ID_Modulo, { transaction: t });
        if (moduloBD) {
          moduloBD.Titulo = mod.Titulo || "";
          await moduloBD.save({ transaction: t });
        }
      }

      // === Processar aulas ===
      for (const aula of mod.Aulas || []) {
        if (aula.toDelete && aula.ID_Aula) {
          await Aula.destroy({
            where: { ID_Aula: aula.ID_Aula },
            transaction: t,
          });
          continue;
        }

        let aulaBD;
        if (!aula.ID_Aula) {
          aulaBD = await Aula.create(
            {
              Titulo: aula.Titulo || "",
              Descricao: aula.Descricao || null,
              ID_Modulo: moduloBD.ID_Modulo,
            },
            { transaction: t }
          );
          aula.ID_Aula = aulaBD.ID_Aula;
        } else {
          aulaBD = await Aula.findByPk(aula.ID_Aula, { transaction: t });
          if (aulaBD) {
            aulaBD.Titulo = aula.Titulo || "";
            aulaBD.Descricao = aula.Descricao || null;
            await aulaBD.save({ transaction: t });
          }
        }

        // === Processar ficheiros ===
        if (Array.isArray(aula.conteudosExistentes)) {
          const toRemove = aula.conteudosExistentes
            .filter((f) => f.toDelete)
            .map((f) => f.ID_Conteudo);
          if (toRemove.length) {
            await ConteudoAula.destroy({
              where: { ID_Conteudo: toRemove },
              transaction: t,
            });
          }
        }

        // Criar ficheiros novos
        const keyPrefix1 = `files_${mod.ID_Modulo || mod.tempId}_${
          aula.ID_Aula || aula.tempId
        }`;
        const files = (req.files || []).filter((f) =>
          f.fieldname.startsWith(keyPrefix1)
        );

        for (const f of files) {
          await ConteudoAula.create(
            {
              ID_Aula: aula.ID_Aula,
              Nome: f.filename,
              Nome_Original: f.originalname,
              URL: `/uploads/${f.filename}`,
              Tipo: f.mimetype,
            },
            { transaction: t }
          );
        }
      }
    }

    await t.commit();

    // === Recarregar curso atualizado ===
    const modulosAtualizados = await Modulo.findAll({
      where: { ID_Curso: cursoId },
      include: [
        {
          model: Aula,
          as: "aulas",
          include: [{ model: ConteudoAula, as: "conteudos" }],
        },
      ],
      order: [
        ["ID_Modulo", "ASC"],
        [{ model: Aula, as: "aulas" }, "ID_Aula", "ASC"],
      ],
    });

    const normalizados = modulosAtualizados.map((m) => ({
      ID_Modulo: m.ID_Modulo,
      ID_Curso: m.ID_Curso,
      Titulo: m.Titulo,
      Aulas: (m.aulas || []).map((a) => ({
        ID_Aula: a.ID_Aula,
        Titulo: a.Titulo,
        Descricao: a.Descricao,
        Files: (a.conteudos || []).map((c) => ({
          id: c.ID_Conteudo,
          name: c.Nome_Original || c.Nome,
          url: c.URL,
          tipo: c.Tipo,
          toDelete: false,
        })),
      })),
    }));

    return res.json({
      message: "Atualizado com sucesso",
      Modulos: normalizados,
    });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
