'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('empresas', 'db_port', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 3306,
      after: 'db_host' // Agregar después de db_host para mantener un orden lógico
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('empresas', 'db_port');
  }
}; 