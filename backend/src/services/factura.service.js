const FacturaCabeza = require("../models/facturaCabeza.model");
const FacturaItem = require("../models/facturaItem.model");
const FacturaValidator = require("./facturaValidator.service");
const StockService = require("./stock.service");
const NumeroControlService = require("./numeroControl.service");
const TransactionService = require("./transaction.service");

/**
 * Servicio para gestionar las operaciones de facturas
 */
const FacturaService = {
  /**
   * Crea una nueva factura completa (cabecera e ítems)
   * @param {Object} facturaData - Datos de la factura
   * @returns {Object} - Datos de la factura creada
   */
  async crearFactura(facturaData) {
    // Validar datos de la factura
    const validacion = FacturaValidator.validarFactura(facturaData);
    if (!validacion.isValid) {
      throw new Error(
        `Datos de factura inválidos: ${validacion.errors.join(", ")}`
      );
    }

    // Ejecutar todo el proceso en una transacción
    return await TransactionService.ejecutarEnTransaccion(
      async (transaction) => {
        // Si no se proporcionó un número, obtener el siguiente disponible
        if (!facturaData.DocumentoNumero) {
          facturaData.DocumentoNumero =
            await NumeroControlService.obtenerYActualizarNumero(
              facturaData.DocumentoTipo,
              facturaData.DocumentoSucursal,
              transaction
            );
        }
        // corregir el codigo del vendedor
        facturaData.VendedorCodigo = facturaData.VendedorCodigo.data.Codigo;
        // Crear cabecera de factura
        const facturaCabeza = await this.crearCabeceraFactura(
          facturaData,
          transaction
        );

        // Crear items de factura
        const facturaItems = await this.crearItemsFactura(
          facturaData.Items,
          facturaData.DocumentoTipo,
          facturaData.DocumentoSucursal,
          facturaData.DocumentoNumero,
          transaction
        );

        // Procesar stock
        await StockService.procesarStockFactura(
          facturaData.Items,
          facturaData.DocumentoTipo,
          facturaData.DocumentoSucursal,
          facturaData.DocumentoNumero,
          facturaData.Fecha,
          transaction
        );

        return {
          ...facturaCabeza.get({ plain: true }),
          Items: facturaItems.map((item) => item.get({ plain: true })),
        };
      }
    );
  },

  /**
   * Crea la cabecera de una factura
   * @param {Object} facturaData - Datos de la factura
   * @param {Object} transaction - Transacción de Sequelize
   * @returns {Object} - Cabecera de factura creada
   */
  async crearCabeceraFactura(facturaData, transaction) {
    console.log("______facturaData", facturaData);
    try {
      return await FacturaCabeza.create(facturaData, { transaction });
    } catch (error) {
      console.error("Error al crear cabecera de factura:", error);
      throw error;
    }
  },

  /**
   * Crea los items de una factura
   * @param {Array} items - Items de la factura
   * @param {string} documentoTipo - Tipo de documento
   * @param {string} documentoSucursal - Sucursal
   * @param {string} documentoNumero - Número de documento
   * @param {Object} transaction - Transacción de Sequelize
   * @returns {Array} - Items de factura creados
   */
  async crearItemsFactura(
    items,
    documentoTipo,
    documentoSucursal,
    documentoNumero,
    transaction
  ) {
    try {
      // Preparar items con sus claves primarias
      const itemsConPK = items.map((item, index) => ({
        ...item,
        CodigoArticulo: item.ArticuloCodigo,
        DocumentoTipo: documentoTipo,
        DocumentoSucursal: documentoSucursal,
        DocumentoNumero: documentoNumero,
        ItemNumero: index + 1,
      }));
      // Crear todos los items
      return await FacturaItem.bulkCreate(itemsConPK, { transaction });
    } catch (error) {
      console.error("Error al crear items de factura:", error);
      throw error;
    }
  },
};

module.exports = FacturaService;
