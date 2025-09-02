const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const { DataTypes } = Sequelize;

// Categoria
//exemplo de categoria: desenvolvimento
const Categoria = sequelize.define(
  "categoria",
  {
    ID_Categoria: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Nome: Sequelize.STRING(100),
  },
  {
    tableName: "Categoria",
    timestamps: false,
  }
);

// Área
//exemplo de área pertencente a categoria desenvolvimento: Desenvolvimento mobile
const Area = sequelize.define(
  "area",
  {
    ID_Area: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Nome: Sequelize.STRING(100),
    ID_Categoria: Sequelize.INTEGER,
  },
  {
    tableName: "Area",
    timestamps: false,
  }
);

// Tópico
//exemplo de tópico pertencente a Desenvolvimento mobile: Flutter
const Topico = sequelize.define(
  "topico",
  {
    ID_Topico: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Nome: Sequelize.STRING(100),
    ID_Area: Sequelize.INTEGER,
  },
  {
    tableName: "Topico",
    timestamps: false,
  }
);

// Curso
const Curso = sequelize.define(
  "curso",
  {
    ID_Curso: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_Gestor: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    Nome_Curso: Sequelize.STRING(100),
    Tipo_Curso: Sequelize.STRING(20),
    Estado_Curso: Sequelize.STRING(20),
    Descricao: Sequelize.TEXT,
    Data_Inicio: Sequelize.DATE,
    Data_Fim: Sequelize.DATE,
    Vagas: Sequelize.INTEGER,
    Imagem: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ID_Topico: Sequelize.INTEGER,
    Rating: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
    Numero_Avaliacoes: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Objetivos: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    },
    Includes: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    },
    CriadoPor: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    AtualizadoPor: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "Curso",
    timestamps: false,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  }
);

const ConteudoAula = sequelize.define("ConteudoAula", {
  ID_Conteudo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ID_Aula: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  Nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Nome_Original: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  URL: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Tipo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Módulo
const Modulo = sequelize.define(
  "modulo",
  {
    ID_Modulo: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_Curso: Sequelize.INTEGER,
    Titulo: Sequelize.STRING(100),
  },
  {
    tableName: "Modulo",
    timestamps: false,
  }
);

// Aula
const Aula = sequelize.define(
  "aula",
  {
    ID_Aula: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    ID_Modulo: Sequelize.INTEGER,
    Titulo: Sequelize.STRING(100),
    Descricao: Sequelize.TEXT,
  },
  {
    tableName: "Aula",
    timestamps: false,
  }
);

// Conteúdo Curso
const ConteudoCurso = sequelize.define(
  "conteudo_curso",
  {
    ID_Conteudo: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_Curso: Sequelize.INTEGER,
    Tipo_Conteudo: Sequelize.STRING(20),
    URL: Sequelize.TEXT,
    Descricao: Sequelize.TEXT,
  },
  {
    tableName: "ConteudoCurso",
    timestamps: false,
  }
);

// Quiz
const Quiz = sequelize.define(
  "quiz",
  {
    ID_Quiz: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_Curso: Sequelize.INTEGER,
    Titulo: Sequelize.STRING(100),
  },
  {
    tableName: "Quiz",
    timestamps: false,
  }
);

// Pergunta
const Pergunta = sequelize.define(
  "pergunta",
  {
    ID_Pergunta: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_Quiz: Sequelize.INTEGER,
    Texto: Sequelize.TEXT,
  },
  {
    tableName: "Pergunta",
    timestamps: false,
  }
);

// Resposta
const Resposta = sequelize.define(
  "resposta",
  {
    ID_Resposta: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_Pergunta: Sequelize.INTEGER,
    Texto: Sequelize.TEXT,
    Correta: Sequelize.BOOLEAN,
  },
  {
    tableName: "Resposta",
    timestamps: false,
  }
);

// Fórum
const Forum = sequelize.define(
  "forum",
  {
    ID_Forum: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Titulo: Sequelize.STRING(100),
    Descricao: Sequelize.TEXT,
    // Novos campos para suportar o fórum
    Autor_ID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    Autor_Tipo: {
      type: Sequelize.ENUM("formando", "formador", "gestor"),
      allowNull: false,
    },
    Upvotes: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    Downvotes: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    Visivel: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "Forum",
    timestamps: true,
    createdAt: "Data_Criacao",
    updatedAt: "Data_Atualizacao",
  }
);

const ForumComentario = sequelize.define(
  "forum_comentario",
  {
    ID_Comentario: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_Forum: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    ID_Comentario_Pai: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    Conteudo: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    Autor_ID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    Autor_Tipo: {
      type: Sequelize.ENUM("formando", "formador", "gestor"),
      allowNull: false,
    },
    Upvotes: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    Downvotes: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "ForumComentario",
    timestamps: true,
    createdAt: "Data_Criacao",
    updatedAt: "Data_Atualizacao",
  }
);

const ForumComentarioVoto = sequelize.define(
  "forum_comentario_voto",
  {
    ID_Voto: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_Comentario: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    Autor_ID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    Autor_Tipo: {
      type: Sequelize.ENUM("formando", "formador", "gestor"),
      allowNull: false,
    },
    Tipo: {
      type: Sequelize.ENUM("up", "down"),
      allowNull: false,
    },
  },
  {
    tableName: "ForumComentarioVoto",
    timestamps: true,
    createdAt: "Data_Criacao",
    updatedAt: "Data_Atualizacao",
    indexes: [
      {
        unique: true,
        fields: ["ID_Comentario", "Autor_ID", "Autor_Tipo"],
      },
    ],
  }
);

const ForumVoto = sequelize.define(
  "forum_voto",
  {
    ID_Voto: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_Forum: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    Autor_ID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    Autor_Tipo: {
      type: Sequelize.ENUM("formando", "formador", "gestor"),
      allowNull: false,
    },
    Tipo: {
      type: Sequelize.ENUM("up", "down"),
      allowNull: false,
    },
  },
  {
    tableName: "ForumVoto",
    timestamps: true,
    createdAt: "Data_Criacao",
    updatedAt: "Data_Atualizacao",
    indexes: [
      {
        unique: true,
        fields: ["ID_Forum", "Autor_ID", "Autor_Tipo"],
      },
    ],
  }
);

// Notificação
const Notificacao = sequelize.define(
  "notificacao",
  {
    ID_Notificacao: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_Utilizador: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    Tipo_Utilizador: {
      type: Sequelize.ENUM("formando", "formador", "gestor"),
      allowNull: false,
    },
    Titulo: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    Mensagem: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    Tipo: {
      type: Sequelize.STRING(50),
      defaultValue: "sistema",
    },
    Lida: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    Data_Leitura: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    Link_Acão: {
      type: Sequelize.STRING(500),
      allowNull: true,
    },
    Prioridade: {
      type: Sequelize.ENUM("baixa", "media", "alta", "urgente"),
      defaultValue: "media",
    },
    Data_Criacao: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    tableName: "Notificacao",
    timestamps: false,
  }
);

module.exports = {
  Categoria,
  Area,
  Topico,
  Curso,
  ConteudoAula,
  Modulo,
  Aula,
  ConteudoCurso,
  Quiz,
  Pergunta,
  Resposta,
  Forum,
  ForumComentario,
  ForumComentarioVoto,
  ForumVoto,
  Notificacao,
};



