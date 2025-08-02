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
   * @param {Object} Articulo - Modelo de artículo dinámico
   */
  async actualizarStock(codigoArticulo, cantidad, transaction, Articulo) {
    console.log("????????????actualizarStock", codigoArticulo, cantidad, transaction, Articulo);
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
   * @param {Object} MovimientoStock - Modelo de movimiento stock dinámico
   */
  async registrarMovimiento(movimiento, transaction, MovimientoStock) {
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
   * @param {Object} models - Modelos dinámicos (opcional)
   */
  async procesarStockFactura(
    items,
    documentoTipo,
    documentoSucursal,
    documentoNumero,
    fecha,
    transaction,
    models = null
  ) {
    console.log("🔍 procesarStockFactura INICIADO");
    console.log("🔍 documentoTipo:", documentoTipo);
    console.log(" items recibidos:", items);
    
    try {
      // Usar modelos dinámicos si están disponibles, de lo contrario importar modelos estáticos
      let Articulo, MovimientoStock;
      if (models) {
        Articulo = models.Articulo;
        MovimientoStock = models.MovimientoStock;
        console.log(" Usando modelos dinámicos");
      } else {
        // Importar de forma dinámica solo si es necesario (fallback)
        Articulo = require("../models/articulo.model");
        MovimientoStock = require("../models/movimientoStock");
        console.log("🔍 Usando modelos estáticos");
      }
      
      // Determinar tipo de movimiento según tipo de documento
      const esVenta = ["FAA", "FAB", "FCA", "FCB","PRF"].includes(documentoTipo);
      const esDevolucion = ["NCA", "NCB","NCF"].includes(documentoTipo);

      console.log(" esVenta:", esVenta, "esDevolucion:", esDevolucion);

      // El signo depende del tipo de documento
      const signo = esVenta ? -1 : esDevolucion ? 1 : 0;

      console.log(" signo calculado:", signo);

      if (signo === 0) {
        console.log("🔍 No afecta stock, saliendo");
        return; // No afecta stock
      }

      console.log("🔍 Procesando items...");
      for (const item of items) {
        console.log(" Procesando item:", item);
        console.log("🔍 item.ArticuloCodigo:", item.ArticuloCodigo);
        console.log("🔍 item.Cantidad:", item.Cantidad);
        
        // Actualizar stock (solo descuento, sin crear movimiento)
        await this.actualizarStock(
          item.ArticuloCodigo,
          signo * item.Cantidad,
          transaction,
          Articulo
        );
      }
      console.log("🔍 procesarStockFactura COMPLETADO");
    } catch (error) {
      console.error(`Error al procesar stock para factura:`, error);
      throw error;
    }
  },

  /**
   * Procesa el stock para una nota de crédito
   * @param {Array} items - Ítems de la nota de crédito
   * @param {string} documentoTipo - Tipo de documento
   * @param {string} documentoSucursal - Sucursal
   * @param {string} documentoNumero - Número de documento
   * @param {Date} fecha - Fecha del movimiento
   * @param {Object} transaction - Transacción de Sequelize
   * @param {Object} models - Modelos dinámicos (opcional)
   */
  async procesarStockNotaCredito(
    items,
    documentoTipo,
    documentoSucursal,
    documentoNumero,
    fecha,
    transaction,
    models = null
  ) {
    try {
      // Usar modelos dinámicos si están disponibles, de lo contrario importar modelos estáticos
      let Articulo;
      if (models) {
        Articulo = models.Articulo;
      } else {
        // Importar de forma dinámica solo si es necesario (fallback)
        Articulo = require("../models/articulo.model");
      }
      
      // Las notas de crédito aumentan el stock (devuelven mercadería)
      for (const item of items) {
        const articulo = await Articulo.findByPk(item.CodigoArticulo, {
          transaction,
        });

        if (!articulo) {
          throw new Error(
            `Artículo con código ${item.CodigoArticulo} no encontrado`
          );
        }

        // Actualizar existencia
        const nuevoStock =
          parseFloat(articulo.Existencia) + parseFloat(item.Cantidad);
        await articulo.update({ Existencia: nuevoStock }, { transaction });

        // Registrar movimiento de stock si existe la funcionalidad
        if (this.registrarMovimientoStock) {
          await this.registrarMovimientoStock(
            item.CodigoArticulo,
            documentoTipo,
            documentoSucursal,
            documentoNumero,
            fecha,
            item.Cantidad,
            "ENTRADA",
            "Nota de Crédito",
            transaction
          );
        }
      }
    } catch (error) {
      console.error("Error procesando stock para nota de crédito:", error);
      throw error;
    }
  },
};

module.exports = StockService;
