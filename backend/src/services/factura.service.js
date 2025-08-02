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
    const { FacturaCabeza, FacturaItem, NumerosControl, Articulo, MovimientoStock } = models;
    
    // ✅ Usar la transacción existente, no crear una nueva
    const t = transaction;
    
    try {
      // ✅ No obtener número aquí, ya viene asignado desde el controlador
      if (!facturaData.DocumentoNumero) {
        throw new Error('DocumentoNumero es requerido');
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
          DocumentoNumero: facturaData.DocumentoNumero
        },
        { transaction: t }
      );

      // Crear items de factura
      const facturaItems = await this.crearItemsFactura(
        facturaData.Items,
        facturaData.DocumentoTipo,
        facturaData.DocumentoSucursal,
        facturaData.DocumentoNumero,
        t,
        FacturaItem
      );

      // Procesar stock
      console.log("🔍 Llamando a StockService.procesarStockFactura");
      await StockService.procesarStockFactura(
        facturaData.Items,
        facturaData.DocumentoTipo,
        facturaData.DocumentoSucursal,
        facturaData.DocumentoNumero,
        facturaData.Fecha,
        t,
        { Articulo, MovimientoStock }
      );
      console.log("🔍 StockService.procesarStockFactura completado");

      // ✅ No hacer commit aquí, se hace en el controlador
      return {
        factura: facturaCabeza,
        items: facturaItems
      };
    } catch (error) {
      // ✅ No hacer rollback aquí, se hace en el controlador
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
  async crearItemsFactura(
    items,
    documentoTipo,
    documentoSucursal,
    documentoNumero,
    transaction,
    FacturaItem
  ) {
    try {
      // Preparar items con sus claves primarias y asegurar que ArticuloCodigo no sea nulo
      const itemsConPK = items.map((item) => {
        if (!item.ArticuloCodigo) {
          throw new Error(`El artículo ${item.Descripcion || 'sin descripción'} no tiene código asignado`);
        }
        
        return {
          DocumentoTipo: documentoTipo,
          DocumentoSucursal: documentoSucursal,
          DocumentoNumero: documentoNumero,
          CodigoArticulo: item.ArticuloCodigo,
          Cantidad: item.Cantidad || 0,
          PrecioLista: item.PrecioLista || item.PrecioUnitario || 0,
          PorcentajeBonificado: item.PorcentajeBonificado || 0,
          ImporteBonificado: item.ImporteBonificado || 0,
          PrecioUnitario: item.PrecioUnitario || 0,
          ImporteCosto: item.ImporteCosto || 0
        };
      });

      // Crear todos los items
      return await FacturaItem.bulkCreate(itemsConPK, { transaction });
    } catch (error) {
      console.error("Error al crear items de factura:", error);
      throw error;
    }
  }
};

module.exports = FacturaService;
