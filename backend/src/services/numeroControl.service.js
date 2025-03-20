const NumeroControl = require("../models/numerosControl.model");

/**
 * Servicio para manejar los números de control de documentos
 */
const NumeroControlService = {
  /**
   * Obtiene y actualiza el próximo número disponible
   * @param {string} tipo - Tipo de documento
   * @param {string} sucursal - Código de sucursal
   * @param {Object} transaction - Transacción de Sequelize
   * @returns {string} - Próximo número formateado
   */
  async obtenerYActualizarNumero(tipo, sucursal, transaction) {
    try {
      // Obtener registro actual
      const numeroControl = await NumeroControl.findOne({
        where: {
          tipo,
          sucursal,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!numeroControl) {
        throw new Error(
          `No existe configuración para tipo ${tipo} sucursal ${sucursal}`
        );
      }

      // Obtener el número actual
      const numeroActual = numeroControl.numeroProximo;

      // Actualizar para el próximo
      await numeroControl.update(
        {
          numeroProximo: numeroActual + 1,
        },
        { transaction }
      );

      // Formatear el número para que tenga 8 dígitos
      return numeroActual.toString().padStart(8, "0");
    } catch (error) {
      console.error(`Error al obtener/actualizar número de control:`, error);
      throw error;
    }
  },
};

module.exports = NumeroControlService;
