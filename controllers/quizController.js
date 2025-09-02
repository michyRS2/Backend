// controllers/quizController.js
const { Quiz, Pergunta, Resposta, Inscricao, sequelize } = require("../models");

// ---------- helpers ----------
const log = (sec, v) => console.log(`[QUIZ] ${sec}:`, v ?? "");

function normalizeProgress(raw) {
  // estrutura esperada em Inscricao.ProgressosQuizes
  // { quizzes: { "30": { percent, data, titulo }, ... }, respondidos, mediaPercent }
  if (!raw) return { quizzes: {}, respondidos: 0, mediaPercent: null };
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== "object") return { quizzes: {}, respondidos: 0, mediaPercent: null };
    if (!obj.quizzes || typeof obj.quizzes !== "object") obj.quizzes = {};
    if (typeof obj.respondidos !== "number") obj.respondidos = 0;
    if (obj.mediaPercent != null && !Number.isFinite(Number(obj.mediaPercent))) obj.mediaPercent = null;
    return obj;
  } catch {
    return { quizzes: {}, respondidos: 0, mediaPercent: null };
  }
}

/* =====================  GESTOR  ===================== */

exports.contarQuizzesDoCurso = async (req, res) => {
  try {
    const ID_Curso = Number(req.params.id);
    if (!Number.isFinite(ID_Curso)) return res.status(400).json({ error: "ID_Curso inválido." });
    const total = await Quiz.count({ where: { ID_Curso } });
    return res.json({ total });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao contar quizzes." });
  }
};

exports.criarQuiz = async (req, res) => {
  try {
    const ID_Curso = Number(req.params.id);
    const { Titulo } = req.body || {};
    if (!Number.isFinite(ID_Curso)) return res.status(400).json({ error: "ID_Curso inválido." });
    if (!Titulo || !Titulo.trim()) return res.status(400).json({ error: "Titulo é obrigatório." });

    const quiz = await Quiz.create({ ID_Curso, Titulo: Titulo.trim() });
    const total = await Quiz.count({ where: { ID_Curso } });

    return res.status(201).json({
      ok: true,
      quiz: { ID_Quiz: quiz.ID_Quiz, ID_Curso, Titulo: quiz.Titulo },
      Num_Quizzes: total,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao criar quiz." });
  }
};

exports.adicionarPerguntas = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const ID_Quiz = Number(req.params.id);
    if (!Number.isFinite(ID_Quiz)) {
      await t.rollback();
      return res.status(400).json({ error: "ID_Quiz inválido." });
    }

    const raw = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body?.perguntas)
      ? req.body.perguntas
      : [];

    if (!raw.length) {
      await t.rollback();
      return res.status(400).json({ error: "Lista de perguntas vazia." });
    }

    let totalPerg = 0;
    let totalResp = 0;

    for (const p of raw) {
      const textoPerg = (p.texto ?? p.Texto ?? p.pergunta ?? p.Pergunta ?? "").toString().trim();
      const respostasRaw = p.respostas ?? p.opcoes ?? p.options ?? p.Opcoes ?? [];
      const corretaIndex = typeof p.corretaIndex === "number" ? p.corretaIndex : null;

      if (!textoPerg || !Array.isArray(respostasRaw) || respostasRaw.length < 2) {
        await t.rollback();
        return res.status(400).json({ error: "Cada pergunta precisa de texto e pelo menos 2 respostas/opções." });
      }

      const perg = await Pergunta.create({ ID_Quiz, Texto: textoPerg }, { transaction: t });
      totalPerg++;

      const respostasNorm = respostasRaw.map((r, i) => {
        const txt = (r.texto ?? r.Texto ?? r.label ?? r.Label ?? "").toString().trim();
        const corr =
          typeof r.correta === "boolean"
            ? r.correta
            : corretaIndex !== null
            ? i === corretaIndex
            : false;

        return { ID_Pergunta: perg.ID_Pergunta, Texto: txt, Correta: !!corr };
      });

      if (!respostasNorm.some((r) => r.Correta)) respostasNorm[0].Correta = true;

      await Resposta.bulkCreate(respostasNorm, { transaction: t });
      totalResp += respostasNorm.length;
    }

    await t.commit();
    return res.json({ ok: true, totalPerguntas: totalPerg, totalRespostas: totalResp });
  } catch (e) {
    console.error(e);
    try { await t.rollback(); } catch {}
    return res.status(500).json({ error: "Erro ao adicionar perguntas." });
  }
};


/* =====================  FORMANDO  ===================== */

exports.listarQuizzesDoCurso = async (req, res) => {
  try {
    const ID_Curso = Number(req.params.id);
    if (!Number.isFinite(ID_Curso)) return res.status(400).json({ error: "ID_Curso inválido." });

    const quizzes = await Quiz.findAll({
      where: { ID_Curso },
      attributes: ["ID_Quiz", "Titulo"],
      order: [["ID_Quiz", "ASC"]],
    });

    return res.json(quizzes);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao listar quizzes." });
  }
};

// GET /api/curso/:id/quizzes/progresso
exports.obterProgressoDoCurso = async (req, res) => {
  try {
    const ID_Curso = Number(req.params.id);
    const ID_Formando = req.user?.id;
    if (!ID_Formando) return res.status(401).json({ error: "Não autenticado." });
    if (!Number.isFinite(ID_Curso)) return res.status(400).json({ error: "ID_Curso inválido." });

    const quizzes = await Quiz.findAll({
      where: { ID_Curso },
      attributes: ["ID_Quiz", "Titulo"],
      order: [["ID_Quiz", "ASC"]],
    });

    const inscr = await Inscricao.findOne({
      where: { ID_Formando, ID_Curso },
      attributes: ["ProgressosQuizes", "AvaliacaoQuizzes"],
    });

    const prog = normalizeProgress(inscr?.ProgressosQuizes);
    console.log("[QUIZ] PROGRESSO: carregado:", prog);

    const items = quizzes.map((q) => {
      const reg = prog.quizzes[String(q.ID_Quiz)]; // <<< CHAVE STRING
      return {
        ID_Quiz: q.ID_Quiz,
        Titulo: q.Titulo,
        feito: !!reg,
        ultimaPercent: reg?.percent ?? null,
        ultimaData: reg?.data ?? null,
      };
    });

    const feitos = items.filter((i) => i.feito);
    const respondidos = feitos.length;
    const mediaPercent = respondidos
      ? Math.round(feitos.reduce((s, i) => s + Number(i.ultimaPercent || 0), 0) / respondidos)
      : null;

    return res.json({
      quizzes: items,
      respondidos,
      total: quizzes.length,
      mediaPercent,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao obter progresso." });
  }
};

exports.obterQuizPorId = async (req, res) => {
  try {
    const rawId =
      req.params?.id ??
      req.params?.quizId ??
      req.params?.ID_Quiz ??
      (req.path ? req.path.split("/").filter(Boolean).pop() : undefined);

    const ID_Quiz = parseInt(rawId, 10);
    if (!Number.isFinite(ID_Quiz)) return res.status(400).json({ error: "ID_Quiz inválido." });

    const quizRow = await Quiz.findByPk(ID_Quiz);
    if (!quizRow) return res.status(404).json({ error: "Quiz não encontrado." });

    const perguntas = await Pergunta.findAll({
      where: { ID_Quiz },
      order: [["ID_Pergunta", "ASC"]],
    });

    const idsPerg = perguntas.map((p) => p.ID_Pergunta);
    const respostas = await Resposta.findAll({
      where: { ID_Pergunta: idsPerg.length ? idsPerg : [-1] },
      order: [["ID_Resposta", "ASC"]],
    });

    const byPerg = new Map();
    for (const r of respostas) {
      const k = r.ID_Pergunta;
      if (!byPerg.has(k)) byPerg.set(k, []);
      byPerg.get(k).push(r.get({ plain: true }));
    }

    const quiz = quizRow.get({ plain: true });
    const perguntasComRespostas = perguntas.map((p) => ({
      ...p.get({ plain: true }),
      respostas: byPerg.get(p.ID_Pergunta) || [],
    }));

    return res.json({ ...quiz, perguntas: perguntasComRespostas });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao obter quiz.", detalhe: e?.message || String(e) });
  }
};

// POST /api/quizzes/:quizId/resolver
exports.resolverQuiz = async (req, res) => {
  try {
    const rawId = req.params?.quizId ?? req.params?.id ?? req.params?.ID_Quiz;
    const ID_Quiz = parseInt(rawId, 10);
    const ID_Formando = req.user?.id;

    if (!ID_Formando) return res.status(401).json({ error: "Não autenticado." });
    if (!Number.isFinite(ID_Quiz)) return res.status(400).json({ error: "ID_Quiz inválido." });

    const quiz = await Quiz.findByPk(ID_Quiz, { attributes: ["ID_Quiz", "ID_Curso", "Titulo"] });
    if (!quiz) return res.status(404).json({ error: "Quiz não encontrado." });

    const inscrito = await Inscricao.findOne({
      where: { ID_Formando, ID_Curso: quiz.ID_Curso },
      attributes: ["ID_Inscricao", "ProgressosQuizes", "AvaliacaoQuizzes"],
    });
    if (!inscrito) return res.status(403).json({ error: "Necessita estar inscrito para responder." });

    const mapa = req.body?.respostas || {};

    const perguntas = await Pergunta.findAll({
      where: { ID_Quiz },
      attributes: ["ID_Pergunta"],
      order: [["ID_Pergunta", "ASC"]],
    });
    if (!perguntas.length) return res.status(404).json({ error: "Quiz sem perguntas." });

    const idsPerguntas = perguntas.map((p) => p.ID_Pergunta);
    const respostas = await Resposta.findAll({
      where: { ID_Pergunta: idsPerguntas },
      attributes: ["ID_Resposta", "ID_Pergunta", "Correta"],
      order: [["ID_Resposta", "ASC"]],
    });

    const respostasPorPergunta = new Map();
    for (const r of respostas) {
      const k = r.ID_Pergunta;
      if (!respostasPorPergunta.has(k)) respostasPorPergunta.set(k, []);
      respostasPorPergunta.get(k).push(r);
    }

    let corretas = 0;
    const total = perguntas.length;
    const detalhes = [];

    for (const p of perguntas) {
      const lista = respostasPorPergunta.get(p.ID_Pergunta) || [];
      const correta = lista.find((r) => r.Correta);
      const escolhida = Number(mapa[p.ID_Pergunta]);
      const acertou = !!(correta && escolhida === correta.ID_Resposta);
      if (acertou) corretas++;

      detalhes.push({
        ID_Pergunta: p.ID_Pergunta,
        correta: correta ? correta.ID_Resposta : null,
        escolhida: Number.isFinite(escolhida) ? escolhida : null,
        acertou,
      });
    }

    const percent = Math.round((corretas / total) * 100);
    const agora = new Date().toISOString();

    // Normaliza e ATUALIZA o JSON de progressos
    const prog = normalizeProgress(inscrito.ProgressosQuizes);
    prog.quizzes[String(ID_Quiz)] = { percent, data: agora, titulo: quiz.Titulo ?? null };

    const vals = Object.values(prog.quizzes)
      .map((v) => Number(v.percent))
      .filter((n) => Number.isFinite(n));
    prog.respondidos = vals.length;
    const media = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    prog.mediaPercent = media != null ? Math.round(media) : null;

    // >>> FORÇA UPDATE dos DOIS campos (jsonb + decimal)
    await Inscricao.update(
      {
        ProgressosQuizes: prog,                         // jsonb
        AvaliacaoQuizzes: media != null ? media : null, // decimal(5,2)
      },
      { where: { ID_Inscricao: inscrito.ID_Inscricao } }
    );

    console.log("[QUIZ] RESOLVER: guardado:", { respondidos: prog.respondidos, mediaPercent: prog.mediaPercent });

    return res.json({
      ok: true,
      total,
      corretas,
      percent,
      detalhes,
      progresso: { respondidos: prog.respondidos, mediaPercent: prog.mediaPercent },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao corrigir quiz." });
  }
};


module.exports = exports;