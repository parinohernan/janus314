module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero eliminamos el ENUM constraint
    await queryInterface.sequelize.query(
      'ALTER TABLE caja_movimientos MODIFY COLUMN TipoDocumento VARCHAR(3);'
    );
  },

  down: async (queryInterface, Sequelize) => {
    // En caso de rollback, volvemos al ENUM original
    await queryInterface.sequelize.query(
      'ALTER TABLE caja_movimientos MODIFY COLUMN TipoDocumento ENUM("factura", "recibo", "nota_credito", "gasto", "otros");'
    );
  }
}; 