"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("datosempresa", "InicioActividades", {
      type: Sequelize.DATE,
      allowNull: true,
      after: "IngresosBrutos",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("datosempresa", "InicioActividades");
  },
};
