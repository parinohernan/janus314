'use strict';

// Clave x-admin-key de la instancia atrarca de la empresa (maestra `empresas`).
// Se guarda por empresa porque cada instancia atrarca tiene su propio ADMIN_API_KEY.
// Ejecutar: npm run migrate  (sequelize-cli, desde backend/)
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('empresas', 'arca_admin_key', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'arcaendpoint'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('empresas', 'arca_admin_key');
  }
};
