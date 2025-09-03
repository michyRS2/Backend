var Sequelize = require("sequelize");
var sequelize = require("../config/database");


const Gestor = sequelize.define("gestor", {
  ID_Gestor: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true, 
  allowNull: false
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
  tableName: 'Gestor',
  timestamps: false
});

const GestorCurso = sequelize.define("gestor_curso", {
  ID_Gestor: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Curso: {
    type: Sequelize.INTEGER,
    primaryKey: true
  }
}, {
  tableName: 'GestorCurso',
  timestamps: false
});

const NotificacaoGestor = sequelize.define("notificacao_gestor", {
  ID_Notificacao: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Gestor: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  Lida: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'NotificacaoGestor',
  timestamps: false
});

module.exports = {
  Gestor,
  GestorCurso,
  NotificacaoGestor
};
