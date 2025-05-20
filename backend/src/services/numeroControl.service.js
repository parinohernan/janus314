/**
 * Servicio para manejar los números de control de documentos
 */
const NumeroControlService = {
  /**
   * Obtiene y actualiza el próximo número disponible
   * @param {string} tipo - Tipo de documento
   * @param {string} sucursal - Código de sucursal
   * @param {Object} transaction - Transacción de Sequelize
   * @param {Object} NumeroControl - Modelo dinámico (requerido)
   * @returns {string} - Próximo número formateado
   */
  async obtenerYActualizarNumero(tipo, sucursal, transaction, NumeroControl) {
    try {
      // Validar que se proporcionó el modelo dinámico
      if (!NumeroControl) {
        throw new Error("Debe proporcionar el modelo NumerosControl de la empresa específica");
      }
      
      // Obtener registro actual usando el modelo dinámico de la empresa
      const numeroControl = await NumeroControl.findOne({
        where: {
          Codigo: tipo,
          Sucursal: sucursal,
        },
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : null,
      });

      if (!numeroControl) {
        throw new Error(
          `No existe configuración para tipo ${tipo} sucursal ${sucursal}`
        );
      }

      // Obtener el número actual
      const numeroActual = numeroControl.NumeroProximo;

      // Actualizar para el próximo
      await numeroControl.update(
        {
          NumeroProximo: numeroActual + 1,
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
