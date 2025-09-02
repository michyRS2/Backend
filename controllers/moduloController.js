// backend/controllers/moduloController.js
const { Modulo, Aula, ConteudoAula, sequelize } = require("../models");

async function criarModulosEAulas(req, res) {
  const { cursoId } = req.params;
  const { Modulos } = req.body;

  try {
    if (!Array.isArray(Modulos)) {
      return res.status(400).json({ error: 'Envie um array "Modulos"' });
    }

    for (const modulo of Modulos) {
      // evita criar módulos vazios
      if (!modulo.Titulo?.trim()) continue;

      const novoModulo = await Modulo.create({
        ID_Curso: cursoId,
        Titulo: modulo.Titulo.trim(),
      });

      // cria cada aula
      if (Array.isArray(modulo.Aulas)) {
        for (const aula of modulo.Aulas) {
          if (!aula.Titulo?.trim()) continue;
          await Aula.create({
            ID_Modulo: novoModulo.ID_Modulo,
            Titulo: aula.Titulo.trim(),
            Descricao: aula.Descricao?.trim() || null,
          });
        }
      }
    }

    return res
      .status(201)
      .json({ message: "Módulos e aulas criados com sucesso!" });
  } catch (err) {
    console.error("Erro ao criar módulos e aulas:", err);
    return res
      .status(500)
      .json({ error: "Erro interno ao criar módulos e aulas." });
  }
}


const atualizarModulosEAulas = async (req, res) => {
  const {
    Modulos = [],
    RemoverFicheiros = [],
    RemoverAulas = [],
    RemoverModulos = [],
    ID_Curso,
  } = req.body;

  const cursoId = Number(req.params.id ?? ID_Curso);
  if (!cursoId) {
    return res.status(400).json({ error: "ID do curso não fornecido." });
  }

  const t = await sequelize.transaction();
  try {
    // 1) Remoções (ficheiros, aulas, módulos)
    if (RemoverFicheiros.length) {
      await ConteudoAula.destroy({ where: { ID_Conteudo: RemoverFicheiros }, transaction: t });
    }
    if (RemoverAulas.length) {
      await Aula.destroy({ where: { ID_Aula: RemoverAulas }, transaction: t });
    }
    if (RemoverModulos.length) {
      await Modulo.destroy({ where: { ID_Modulo: RemoverModulos }, transaction: t });
    }

    // 2) Criar/Atualizar Módulos e Aulas
    for (const mod of Modulos) {
      let moduloBD;

      if (!mod.ID_Modulo) {
        // criar novo módulo -> **Titulo** e **ID_Curso**
        moduloBD = await Modulo.create(
          {
            Titulo: mod.Titulo || "",
            ID_Curso: cursoId,
          },
          { transaction: t }
        );
        mod.ID_Modulo = moduloBD.ID_Modulo;
      } else {
        // atualizar módulo existente -> **Titulo**
        moduloBD = await Modulo.findByPk(mod.ID_Modulo, { transaction: t });
        if (moduloBD) {
          // ATENÇÃO: é Titulo, não Nome
          moduloBD.Titulo = mod.Titulo || "";
          await moduloBD.save({ transaction: t });
        } else {
          // se não existir, recria
          moduloBD = await Modulo.create(
            {
              Titulo: mod.Titulo || "",
              ID_Curso: cursoId,
            },
            { transaction: t }
          );
          mod.ID_Modulo = moduloBD.ID_Modulo;
        }
      }

      // aulas
      for (const aula of (mod.Aulas || [])) {
        let aulaBD;

        if (!aula.ID_Aula) {
          aulaBD = await Aula.create(
            {
              Titulo: aula.Titulo || "",
              Descricao: aula.Descricao ?? null,
              ID_Modulo: moduloBD.ID_Modulo,
            },
            { transaction: t }
          );
          aula.ID_Aula = aulaBD.ID_Aula;
        } else {
          aulaBD = await Aula.findByPk(aula.ID_Aula, { transaction: t });
          if (aulaBD) {
            aulaBD.Titulo = aula.Titulo || "";
            aulaBD.Descricao = aula.Descricao ?? null;
            await aulaBD.save({ transaction: t });
          } else {
            aulaBD = await Aula.create(
              {
                Titulo: aula.Titulo || "",
                Descricao: aula.Descricao ?? null,
                ID_Modulo: moduloBD.ID_Modulo,
              },
              { transaction: t }
            );
            aula.ID_Aula = aulaBD.ID_Aula;
          }
        }

        // Não criar anexos aqui se ainda não há URL (uploads vêm depois)
        if (Array.isArray(aula.Files)) {
          for (const f of aula.Files) {
            // Só cria se já vier com URL (ex.: reenvio de ficheiros já existentes)
            if (!f.id && !f.toDelete && f.name && f.url) {
              await ConteudoAula.create(
                {
                  ID_Aula: aula.ID_Aula,
                  Nome: f.name,
                  Nome_Original: f.name,
                  URL: f.url,
                  Tipo: f.tipo || null,
                },
                { transaction: t }
              );
            }
          }
        }
      }
    }

    await t.commit();

    // 3) Buscar estado atualizado e normalizar para o frontend
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

    const normalizados = modulosAtualizados.map(m => ({
      ID_Modulo: m.ID_Modulo,
      ID_Curso: m.ID_Curso,
      Titulo: m.Titulo, 
      Aulas: (m.aulas || []).map(a => ({
        ID_Aula: a.ID_Aula,
        Titulo: a.Titulo,
        Descricao: a.Descricao,
        Files: (a.conteudos || []).map(c => ({
          id: c.ID_Conteudo,
          name: c.Nome_Original || c.Nome,
          url: c.URL,
          tipo: c.Tipo,
          toDelete: false,
        })),
      })),
    }));

    return res.json({
      message: "Módulos e aulas atualizados com sucesso",
      Modulos: normalizados, // 👈 o frontend faz data.Modulos
    });
  } catch (err) {
    await t.rollback();
    console.error("Erro ao atualizar módulos e aulas:", err);
    return res.status(500).json({ error: err.message });
  }
};




// Listar todos os módulos e aulas de um curso
// Listar todos os módulos e aulas de um curso com conteúdos
const listarModulosEAulas = async (req, res) => {
  const { cursoId } = req.params;

  try {
    const modulos = await Modulo.findAll({
      where: { ID_Curso: cursoId },
      include: [
        {
          model: Aula,
          as: "aulas",
          include: [
            {
              model: ConteudoAula,
              as: "conteudos",
            },
          ],
        },
      ],
      order: [
        ["ID_Modulo", "ASC"],
        [{ model: Aula, as: "aulas" }, "ID_Aula", "ASC"],
      ],
    });

    // 🔄 transformar para incluir "Files" no formato esperado
    const resposta = modulos.map((modulo) => ({
      ID_Modulo: modulo.ID_Modulo,
      Titulo: modulo.Titulo,
      Aulas: modulo.aulas.map((aula) => ({
        ID_Aula: aula.ID_Aula,
        Titulo: aula.Titulo,
        Descricao: aula.Descricao,
        Files: (aula.conteudos || []).map((c) => ({
          name: c.Nome_Original,
          url: c.URL,
          tipo: c.Tipo,
          id: c.ID_Conteudo,
        })),
      })),
    }));

    res.json(resposta);
  } catch (err) {
    console.error("Erro ao listar módulos e aulas:", err);
    res.status(500).json({ erro: "Erro ao listar módulos e aulas." });
  }
};

module.exports = {
  criarModulosEAulas,
  atualizarModulosEAulas,
  listarModulosEAulas,
};
