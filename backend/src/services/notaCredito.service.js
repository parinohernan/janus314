const NotaCreditoCabeza = require("../models/notaCreditoCabeza.model");
const NotaCreditoItem = require("../models/notaCreditoItem.model");
const NotaCreditoValidator = require("./notaCreditoValidator.service");
const StockService = require("./stock.service");
const NumeroControlService = require("./numeroControl.service");
const TransactionService = require("./transaction.service");

/**
 * Servicio para gestionar las operaciones de notas de crédito
 */
const NotaCreditoService = {
  /**
   * Crea una nueva nota de crédito completa (cabecera e ítems)
   * @param {Object} notaCreditoData - Datos de la nota de crédito
   * @returns {Object} - Datos de la nota de crédito creada
   */
  async crearNotaCredito(notaCreditoData) {
    // Validar datos de la nota de crédito
    const validacion = NotaCreditoValidator.validarNotaCredito(notaCreditoData);
    if (!validacion.isValid) {
      throw new Error(
        `Datos de nota de crédito inválidos: ${validacion.errors.join(", ")}`
      );
    }

    // Ejecutar todo el proceso en una transacción
    return await TransactionService.ejecutarEnTransaccion(
      async (transaction) => {
        // Si no se proporcionó un número, obtener el siguiente disponible
        if (!notaCreditoData.DocumentoNumero) {
          notaCreditoData.DocumentoNumero =
            await NumeroControlService.obtenerYActualizarNumero(
              notaCreditoData.DocumentoTipo,
              notaCreditoData.DocumentoSucursal,
              transaction
            );
        }

        // Corregir campos si es necesario
        if (
          notaCreditoData.VendedorCodigo &&
          notaCreditoData.VendedorCodigo.data
        ) {
          notaCreditoData.CodigoVendedor =
            notaCreditoData.VendedorCodigo.data.Codigo;
        } else {
          notaCreditoData.CodigoVendedor =
            notaCreditoData.VendedorCodigo || "1";
        }

        // Crear cabecera de nota de crédito
        const notaCreditoCabeza = await this.crearCabeceraNotaCredito(
          notaCreditoData,
          transaction
        );

        // Crear items de nota de crédito
        const notaCreditoItems = await this.crearItemsNotaCredito(
          notaCreditoData.Items,
          notaCreditoData.DocumentoTipo,
          notaCreditoData.DocumentoSucursal,
          notaCreditoData.DocumentoNumero,
          transaction
        );

        // Procesar stock si corresponde
        if (notaCreditoData.PorStock) {
          await StockService.procesarStockNotaCredito(
            notaCreditoData.Items,
            notaCreditoData.DocumentoTipo,
            notaCreditoData.DocumentoSucursal,
            notaCreditoData.DocumentoNumero,
            notaCreditoData.Fecha,
            transaction
          );
        }

        return {
          ...notaCreditoCabeza.get({ plain: true }),
          Items: notaCreditoItems.map((item) => item.get({ plain: true })),
        };
      }
    );
  },

  /**
   * Crea la cabecera de una nota de crédito
   * @param {Object} notaCreditoData - Datos de la nota de crédito
   * @param {Object} transaction - Transacción de Sequelize
   * @returns {Object} - Cabecera de nota de crédito creada
   */
  async crearCabeceraNotaCredito(notaCreditoData, transaction) {
    try {
      return await NotaCreditoCabeza.create(notaCreditoData, { transaction });
    } catch (error) {
      console.error("Error al crear cabecera de nota de crédito:", error);
      throw error;
    }
  },

  /**
   * Crea los items de una nota de crédito
   * @param {Array} items - Items de la nota de crédito
   * @param {string} documentoTipo - Tipo de documento
   * @param {string} documentoSucursal - Sucursal
   * @param {string} documentoNumero - Número de documento
   * @param {Object} transaction - Transacción de Sequelize
   * @returns {Array} - Items de nota de crédito creados
   */
  async crearItemsNotaCredito(
    items,
    documentoTipo,
    documentoSucursal,
    documentoNumero,
    transaction
  ) {
    try {
      // Preparar items con sus claves primarias
      const itemsConPK = items.map((item) => ({
        ...item,
        DocumentoTipo: documentoTipo,
        DocumentoSucursal: documentoSucursal,
        DocumentoNumero: documentoNumero,
      }));

      // Crear todos los items
      return await NotaCreditoItem.bulkCreate(itemsConPK, { transaction });
    } catch (error) {
      console.error("Error al crear items de nota de crédito:", error);
      throw error;
    }
  },
};

module.exports = NotaCreditoService;
