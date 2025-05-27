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
   * @param {Object} transaction - Transacción activa (opcional)
   * @param {Object} models - Modelos dinámicos de la empresa
   * @param {Object} connection - Conexión de base de datos (opcional)
   * @returns {Object} - Datos de la factura creada
   */
  async crearFactura(facturaData, transaction, models, connection = null) {
    // Validar datos de la factura
    const validacion = FacturaValidator.validarFactura(facturaData);
    if (!validacion.isValid) {
      throw new Error(
        `Datos de factura inválidos: ${validacion.errors.join(", ")}`
      );
    }

    // Si no se proporcionan los modelos, usar los modelos globales (para compatibilidad)
    const { FacturaCabeza, FacturaItem, Articulo, MovimientoStock, NumerosControl, Cliente } = models || {};

    // Si no hay transacción, crear una nueva
    const shouldCreateTransaction = !transaction;
    const t = transaction || await connection.transaction();

    try {
      // Si no se proporcionó un número, obtener el siguiente disponible
      if (!facturaData.DocumentoNumero) {
        facturaData.DocumentoNumero =
          await NumeroControlService.obtenerYActualizarNumero(
            facturaData.DocumentoTipo,
            facturaData.DocumentoSucursal,
            t,
            NumerosControl
          );
      }

      // Corregir el código del vendedor si viene en formato objeto
      if (facturaData.VendedorCodigo && facturaData.VendedorCodigo.data && facturaData.VendedorCodigo.data.Codigo) {
        facturaData.VendedorCodigo = facturaData.VendedorCodigo.data.Codigo;
      }

      // Configurar PagoTipo e ImportePagado según la forma de pago
      if (facturaData.PagoTipo === "CC") {
        facturaData.ImportePagado = 0;
      } else {
        facturaData.ImportePagado = facturaData.ImporteTotal;
      }
      
      // Crear la factura
      const facturaCabeza = await FacturaCabeza.create(
        {
          ...facturaData,
          DocumentoNumero: facturaData.DocumentoNumero.toString().padStart(8, "0")
        },
        { transaction: t }
      );

      // Crear items de factura con el número formateado
      const facturaItems = await this.crearItemsFactura(
        facturaData.Items,
        facturaData.DocumentoTipo,
        facturaData.DocumentoSucursal,
        facturaData.DocumentoNumero.toString().padStart(8, "0"),
        t,
        FacturaItem
      );

      // Procesar stock
      await StockService.procesarStockFactura(
        facturaData.Items,
        facturaData.DocumentoTipo,
        facturaData.DocumentoSucursal,
        facturaData.DocumentoNumero,
        facturaData.Fecha,
        t,
        { Articulo, MovimientoStock }
      );

      // Solo hacer commit si creamos la transacción aquí
      if (shouldCreateTransaction) {
        await t.commit();
      }

      return {
        ...facturaCabeza.get({ plain: true }),
        Items: facturaItems.map((item) => item.get({ plain: true })),
      };
    } catch (error) {
      // Solo hacer rollback si creamos la transacción aquí
      if (shouldCreateTransaction) {
        await t.rollback();
      }
      throw error;
    }
  },

  /**
   * Crea la cabecera de una factura
   * @param {Object} facturaData - Datos de la factura
   * @param {Object} transaction - Transacción de Sequelize
   * @param {Object} FacturaCabeza - Modelo a utilizar (dinámico)
   * @returns {Object} - Cabecera de factura creada
   */
  async crearCabeceraFactura(facturaData, transaction, FacturaCabeza) {
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
   * @param {Array} items - Array de items a crear
   * @param {string} tipo - Tipo de documento
   * @param {string} sucursal - Sucursal
   * @param {string} numero - Número de documento
   * @param {Object} transaction - Transacción de Sequelize
   * @param {Object} FacturaItem - Modelo a utilizar (dinámico)
   * @returns {Array} - Items de factura creados
   */
  async crearItemsFactura(items, tipo, sucursal, numero, transaction, FacturaItem) {
    try {
      const itemsToCreate = items.map(item => ({
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
        CodigoArticulo: item.CodigoArticulo,
        Cantidad: item.Cantidad,
        PrecioLista: item.PrecioLista || item.PrecioUnitario,
        PorcentajeBonificado: item.PorcentajeBonificado || 0,
        ImporteBonificado: item.ImporteBonificado || 0,
        PrecioUnitario: item.PrecioUnitario,
        ImporteCosto: item.ImporteCosto || 0
      }));

      return await FacturaItem.bulkCreate(itemsToCreate, { transaction });
    } catch (error) {
      console.error("Error al crear items de factura:", error);
      throw error;
    }
  }
};

module.exports = FacturaService;
