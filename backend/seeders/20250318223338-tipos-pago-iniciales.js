"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "t_tiposdepago",
      [
        {
          Codigo: "CO",
          Descripcion: "Contado",
          Activo: true,
          aplicaSaldo: false,
          recargoPorcentaje: 0,
        },
        {
          Codigo: "CC",
          Descripcion: "Cuenta Corriente",
          Activo: true,
          aplicaSaldo: true,
          recargoPorcentaje: 0,
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("t_tiposdepago", null, {});
  },
};
