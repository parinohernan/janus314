const sequelize = require("../config/database");

/**
 * Servicio para manejar transacciones de base de datos
 */
const TransactionService = {
  /**
   * Inicia una nueva transacción
   * @returns {Object} - Objeto de transacción de Sequelize
   */
  async iniciarTransaccion() {
    return await sequelize.transaction();
  },

  /**
   * Confirma una transacción
   * @param {Object} transaction - Transacción a confirmar
   */
  async confirmarTransaccion(transaction) {
    if (transaction && !transaction.finished) {
      await transaction.commit();
    }
  },

  /**
   * Revierte una transacción
   * @param {Object} transaction - Transacción a revertir
   */
  async revertirTransaccion(transaction) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
  },

  /**
   * Ejecuta una función dentro de una transacción
   * @param {Function} callback - Función a ejecutar dentro de la transacción
   * @returns {any} - Resultado de la función callback
   */
  async ejecutarEnTransaccion(callback) {
    const transaction = await this.iniciarTransaccion();

    try {
      const resultado = await callback(transaction);
      await this.confirmarTransaccion(transaction);
      return resultado;
    } catch (error) {
      await this.revertirTransaccion(transaction);
      throw error;
    }
  },
};

module.exports = TransactionService;
