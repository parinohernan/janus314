"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("t_tiposdepago", {
      Codigo: {
        type: Sequelize.STRING(3),
        primaryKey: true,
        allowNull: false,
      },
      Descripcion: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      Activo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      aplicaSaldo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      recargoPorcentaje: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("t_tiposdepago");
  },
};
