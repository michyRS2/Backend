const { Area, Topico } = require("../models");

exports.getAreas = async (req, res) => {
  try {
    const { categoriaId } = req.query;

    const whereClause = categoriaId ? { ID_Categoria: categoriaId } : {};

    const areas = await Area.findAll({ where: whereClause });

    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter áreas" });
  }
};


exports.getTopicosByArea = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await Area.findByPk(id, {
      include: {
        model: Topico,
        as: "topicos"
      }
    });

    if (!area) {
      return res.status(404).json({ error: "Área não encontrada" });
    }

    res.json(area.topicos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter tópicos da área" });
  }
};
