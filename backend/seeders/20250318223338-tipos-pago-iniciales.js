"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "t_tiposdepago",
      [
        {
          Codigo: "EFE",
          Descripcion: "Efectivo",
          Activo: true,
          aplicaSaldo: false,
          recargoPorcentaje: 0,
        },
        {
          Codigo: "TAR",
          Descripcion: "Tarjeta",
          Activo: true,
          aplicaSaldo: false,
          recargoPorcentaje: 5.0,
        },
        {
          Codigo: "TRA",
          Descripcion: "Transferencia",
          Activo: true,
          aplicaSaldo: false,
          recargoPorcentaje: 0,
        },
        {
          Codigo: "CTA",
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
