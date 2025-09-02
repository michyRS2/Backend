const { Topico, Curso } = require("../models/outrasTabelas"); // Caminho correto para os modelos

const topicoController = {
  getTopicos: async (req, res) => {
    try {
      const { areaId } = req.query;

      const whereClause = areaId ? { ID_Area: areaId } : {};

      const topicos = await Topico.findAll({ where: whereClause });

      res.json(topicos);
    } catch (error) {
      res.status(500).json({ error: "Erro ao obter tópicos" });
    }
  },

  getCursosPorTopico: async (req, res) => {
    try {
      const { id } = req.params;

      // Verifica se o tópico existe
      const topico = await Topico.findByPk(id);
      if (!topico) {
        return res.status(404).json({ error: "Tópico não encontrado" });
      }

      // Busca os cursos associados ao tópico
      const cursos = await Curso.findAll({
        where: { ID_Topico: id },
        include: [
          {
            model: Topico,
            as: 'topico',
            attributes: ['ID_Topico', 'Nome']
          }
        ],
        order: [['Nome_Curso', 'ASC']]
      });

      res.status(200).json(cursos || []);

    } catch (error) {
      console.error("Erro ao buscar cursos por tópico:", error);
      res.status(500).json({
        error: "Erro ao buscar cursos",
        details: error.message
      });
    }
  }
};

module.exports = topicoController;