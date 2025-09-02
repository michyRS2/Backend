const Sequelize = require("sequelize");
const sequelize = require("../config/database");

// Importação dos módulos
const formandos = require("./formandos");
const formadores = require("./formadores");
const gestores = require("./gestores");
const outrasTabelas = require("./outrasTabelas");

//
// Relacionamentos - Formando
//
formandos.Formando.hasMany(formandos.Inscricao, { foreignKey: "ID_Formando" });
formandos.Inscricao.belongsTo(formandos.Formando, { foreignKey: "ID_Formando" });

formandos.Formando.hasMany(formandos.SubmissaoTrabalho, { foreignKey: "ID_Formando" });
formandos.SubmissaoTrabalho.belongsTo(formandos.Formando, { foreignKey: "ID_Formando" });

formandos.Formando.hasMany(formandos.AvaliacaoFormando, { foreignKey: "ID_Formando" });
formandos.AvaliacaoFormando.belongsTo(formandos.Formando, { foreignKey: "ID_Formando" });

// Relacionamento N:N entre Formando e Curso via RespostaFormando
formandos.Formando.belongsToMany(outrasTabelas.Curso, {
  through: formandos.RespostaFormando,
  foreignKey: "ID_Formando",
  otherKey: "ID_Curso",
  as: 'cursosResposta'
});
outrasTabelas.Curso.belongsToMany(formandos.Formando, {
  through: formandos.RespostaFormando,
  foreignKey: "ID_Curso",
  otherKey: "ID_Formando",
  as: 'formandosResposta'
});

// Relacionamento entre Curso e Inscrição
outrasTabelas.Curso.hasMany(formandos.Inscricao, { foreignKey: "ID_Curso" });
formandos.Inscricao.belongsTo(outrasTabelas.Curso, { foreignKey: "ID_Curso" });

//
// Relacionamentos - Formador (1:N)
//
formadores.Formador.hasMany(outrasTabelas.Curso, { foreignKey: "ID_Formador", as: 'cursos' });
outrasTabelas.Curso.belongsTo(formadores.Formador, { foreignKey: "ID_Formador", as: 'formador' });

//
// Relacionamentos - Gestor
//
gestores.Gestor.belongsToMany(outrasTabelas.Curso, {
  through: gestores.GestorCurso,
  foreignKey: "ID_Gestor",
  otherKey: "ID_Curso",
  as: 'cursosGestor'
});
outrasTabelas.Curso.belongsToMany(gestores.Gestor, {
  through: gestores.GestorCurso,
  foreignKey: "ID_Curso",
  otherKey: "ID_Gestor",
  as: 'gestors'
});

//
// Estrutura do Curso - Categoria, Área, Tópico
//
outrasTabelas.Categoria.hasMany(outrasTabelas.Area, { as: 'areas', foreignKey: "ID_Categoria", onDelete:"CASCADE", });
outrasTabelas.Area.belongsTo(outrasTabelas.Categoria, { as: 'categoria', foreignKey: "ID_Categoria" });

outrasTabelas.Area.hasMany(outrasTabelas.Topico, { as: 'topicos', foreignKey: "ID_Area", onDelete: 'CASCADE', });
outrasTabelas.Topico.belongsTo(outrasTabelas.Area, { as: 'area', foreignKey: "ID_Area" });

outrasTabelas.Topico.hasMany(outrasTabelas.Curso, { as: 'cursos', foreignKey: "ID_Topico" });
outrasTabelas.Curso.belongsTo(outrasTabelas.Topico, { as: 'topico', foreignKey: "ID_Topico" });

//
// Relacionamentos - Fórum e Notificações
//
outrasTabelas.Forum.hasMany(outrasTabelas.ForumComentario, { foreignKey: 'ID_Forum', as: 'comentarios'});

outrasTabelas.ForumComentario.belongsTo(outrasTabelas.Forum, {foreignKey: 'ID_Forum', as: 'post'});
outrasTabelas.Forum.hasMany(outrasTabelas.ForumVoto, {foreignKey: 'ID_Forum', as: 'votos'});
outrasTabelas.ForumVoto.belongsTo(outrasTabelas.Forum, {foreignKey: 'ID_Forum', as: 'post'});
outrasTabelas.Notificacao.belongsTo(outrasTabelas.Forum, { foreignKey: "ID_Forum" });

formadores.NotificacaoFormador.belongsTo(formadores.Formador, { foreignKey: "ID_Formador" });
gestores.NotificacaoGestor.belongsTo(gestores.Gestor, { foreignKey: "ID_Gestor" });
formandos.NotificacaoFormando.belongsTo(formandos.Formando, { foreignKey: "ID_Formando" });

//
// Estrutura dos Módulos e Aulas do Curso
//
outrasTabelas.Curso.hasMany(outrasTabelas.Modulo, { foreignKey: 'ID_Curso' });
outrasTabelas.Modulo.belongsTo(outrasTabelas.Curso, { foreignKey: 'ID_Curso' });

outrasTabelas.Modulo.hasMany(outrasTabelas.Aula, { 
  foreignKey: 'ID_Modulo',
  as: 'aulas',
  onDelete: 'CASCADE'

});
outrasTabelas.Aula.belongsTo(outrasTabelas.Modulo, { 
  foreignKey: 'ID_Modulo',
  as: 'modulo'
});

// ------------------ Conteúdos (Anexos) das Aulas ------------------
outrasTabelas.Aula.hasMany(outrasTabelas.ConteudoAula, { 
  foreignKey: 'ID_Aula',
  as: 'conteudos',
  onDelete: 'CASCADE'
});
outrasTabelas.ConteudoAula.belongsTo(outrasTabelas.Aula, { 
  foreignKey: 'ID_Aula',
  as: 'aula'
});


//
// Exportação dos modelos e instância do Sequelize
//
module.exports = {
  sequelize,
  Sequelize,
  ...formandos,
  ...formadores,
  ...gestores,
  ...outrasTabelas
};
