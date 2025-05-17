'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const clientesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/clientes.json'), 'utf8')
    );

    const empresasConTimestamp = clientesData.map(cliente => ({
      ...cliente,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('empresas', empresasConTimestamp, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('empresas', null, {});
  }
}; 