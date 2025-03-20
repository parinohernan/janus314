const MovimientoStock = require("../models/MovimientoStock");
const Articulo = require("../models/articulo.model");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

/**
 * Servicio para manejar las operaciones de stock
 */
const StockService = {
  /**
   * Actualiza el stock de un artículo
   * @param {string} codigoArticulo - Código del artículo
   * @param {number} cantidad - Cantidad a modificar (negativo para decrementar)
   * @param {Object} transaction - Transacción de Sequelize
   */
  async actualizarStock(codigoArticulo, cantidad, transaction) {
    try {
      // Actualizar stock en la tabla de artículos
      await Articulo.update(
        {
          Existencia: sequelize.literal(`Existencia + ${cantidad}`),
        },
        {
          where: { Codigo: codigoArticulo },
          transaction,
        }
      );
    } catch (error) {
      console.error(
        `Error al actualizar stock del artículo ${codigoArticulo}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Registra un movimiento de stock
   * @param {Object} movimiento - Datos del movimiento de stock
   * @param {Object} transaction - Transacción de Sequelize
   */
  async registrarMovimiento(movimiento, transaction) {
    try {
      await MovimientoStock.create(movimiento, { transaction });
    } catch (error) {
      console.error(`Error al registrar movimiento de stock:`, error);
      throw error;
    }
  },

  /**
   * Actualiza el stock para todos los ítems de una factura
   * @param {Array} items - Items de la factura
   * @param {string} documentoTipo - Tipo de documento
   * @param {string} documentoSucursal - Sucursal
   * @param {string} documentoNumero - Número de documento
   * @param {string} fecha - Fecha del movimiento
   * @param {Object} transaction - Transacción de Sequelize
   */
  async procesarStockFactura(
    items,
    documentoTipo,
    documentoSucursal,
    documentoNumero,
    fecha,
    transaction
  ) {
    try {
      // Determinar tipo de movimiento según tipo de documento
      const esVenta = ["FAA", "FAB", "FCA", "FCB"].includes(documentoTipo);
      const esDevolucion = ["NCA", "NCB"].includes(documentoTipo);

      // El signo depende del tipo de documento
      const signo = esVenta ? -1 : esDevolucion ? 1 : 0;

      if (signo === 0) {
        return; // No afecta stock
      }

      for (const item of items) {
        // Actualizar stock
        await this.actualizarStock(
          item.ArticuloCodigo,
          signo * item.Cantidad,
          transaction
        );

        // Registrar movimiento
        await this.registrarMovimiento(
          {
            DocumentoTipo: documentoTipo,
            DocumentoSucursal: documentoSucursal,
            DocumentoNumero: documentoNumero,
            Fecha: fecha,
            CodigoArticulo: item.ArticuloCodigo,
            Cantidad: signo * item.Cantidad,
            Motivo: esVenta ? "VENTA" : "DEVOLUCION",
          },
          transaction
        );
      }
    } catch (error) {
      console.error(`Error al procesar stock para factura:`, error);
      throw error;
    }
  },
};

module.exports = StockService;
