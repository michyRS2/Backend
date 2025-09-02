var Sequelize = require("sequelize");
var sequelize = require("../config/database");

const Formador = sequelize.define("formador", {
  ID_Formador: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Nome: Sequelize.STRING(100),
  Email: {
    type: Sequelize.STRING(100),
    unique: true
  },
  Password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  resetPasswordToken: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  resetPasswordExpires: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
    Estado: {
    type: Sequelize.STRING(20),
    defaultValue: 'pendente' // ou 'ativo' se quiseres que sejam ativos por padrão
  },
  Data_Registo: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  Data_Nascimento: Sequelize.DATE
}, {
  tableName: 'Formador',
  timestamps: false
});

const Curso_Formador = sequelize.define("curso_formador", {
  ID_Curso: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Formador: {
    type: Sequelize.INTEGER,
    primaryKey: true
  }
}, {
  tableName: 'Curso_Formador',
  timestamps: false
});

const NotificacaoFormador = sequelize.define("notificacao_formador", {
  ID_Notificacao: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Formador: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  Lida: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'NotificacaoFormador',
  timestamps: false
});

module.exports = {
  Formador,
  Curso_Formador,
  NotificacaoFormador
};
