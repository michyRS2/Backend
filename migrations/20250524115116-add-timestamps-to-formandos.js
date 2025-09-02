'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Formando', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()')
    });
    await queryInterface.addColumn('Formando', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()')
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Formando', 'createdAt');
    await queryInterface.removeColumn('Formando', 'updatedAt');
  }
};
