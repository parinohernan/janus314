"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("datosempresa", "Timezone", {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: "America/Argentina/Buenos_Aires",
      comment: "Zona horaria de la empresa",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("datosempresa", "Timezone");
  },
};
