const NotaCreditoCabeza = require("../models/notaCreditoCabeza.model");
const NotaCreditoItem = require("../models/notaCreditoItem.model");
const NotaCreditoValidator = require("./notaCreditoValidator.service");
const StockService = require("./stock.service");
const NumeroControlService = require("./numeroControl.service");
const TransactionService = require("./transaction.service");
const Cliente = require("../models/cliente.model");

/**
 * Servicio para gestionar las operaciones de notas de crédito
 */
const NotaCreditoService = {
  /**
   * Crea una nueva nota de crédito completa (cabecera e ítems)
   * @param {Object} notaCreditoData - Datos de la nota de crédito
   * @param {Object} dbConnection - Conexión a la base de datos de la empresa
   * @returns {Object} - Datos de la nota de crédito creada
   */
  async crearNotaCredito(notaCreditoData, dbConnection) {
    // Validar datos de la nota de crédito
    const validacion = NotaCreditoValidator.validarNotaCredito(notaCreditoData);
    if (!validacion.isValid) {
      throw new Error(
        `Datos de nota de crédito inválidos: ${validacion.errors.join(", ")}`
      );
    }

    // Definir los modelos para esta conexión
    const NotaCreditoCabezaEmpresa = dbConnection.model('NotaCreditoCabeza');
    const NotaCreditoItemEmpresa = dbConnection.model('NotaCreditoItem');
    const ClienteEmpresa = dbConnection.model('Cliente');
    const NumerosControlEmpresa = dbConnection.model('NumerosControl');

    // Ejecutar todo el proceso en una transacción
    return await TransactionService.ejecutarEnTransaccion(
      async (transaction) => {
        // Siempre obtener un nuevo número de control
        notaCreditoData.DocumentoNumero =
          await NumeroControlService.obtenerYActualizarNumero(
            notaCreditoData.DocumentoTipo,
            notaCreditoData.DocumentoSucursal,
            transaction,
            NumerosControlEmpresa
          );

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

        // Si el tipo de pago es CC, actualizar el saldo del cliente
        if (notaCreditoData.FormaPagoCodigo === "CC") {
          // Buscar el cliente
          const cliente = await ClienteEmpresa.findOne({
            where: { Codigo: notaCreditoData.CodigoCliente },
            transaction
          });

          if (!cliente) {
            throw new Error("Cliente no encontrado");
          }

          // Actualizar el saldo del cliente (restar el importe total)
          await ClienteEmpresa.update(
            { 
              ImporteDeuda: dbConnection.literal(`COALESCE(ImporteDeuda, 0) - ${parseFloat(notaCreditoData.ImporteTotal) || 0}`)
            },
            { 
              where: { Codigo: notaCreditoData.CodigoCliente },
              transaction 
            }
          );
        }

        // Crear cabecera de nota de crédito
        const notaCreditoCabeza = await this.crearCabeceraNotaCredito(
          notaCreditoData,
          transaction,
          NotaCreditoCabezaEmpresa
        );

        // Crear items de nota de crédito
        const notaCreditoItems = await this.crearItemsNotaCredito(
          notaCreditoData.Items,
          notaCreditoData.DocumentoTipo,
          notaCreditoData.DocumentoSucursal,
          notaCreditoData.DocumentoNumero,
          transaction,
          NotaCreditoItemEmpresa
        );

        // Procesar stock si corresponde
        if (notaCreditoData.PorStock) {
          await StockService.procesarStockNotaCredito(
            notaCreditoData.Items,
            notaCreditoData.DocumentoTipo,
            notaCreditoData.DocumentoSucursal,
            notaCreditoData.DocumentoNumero,
            notaCreditoData.Fecha,
            transaction,
            { Articulo: dbConnection.model('Articulo') }
          );
        }

        return {
          ...notaCreditoCabeza.get({ plain: true }),
          Items: notaCreditoItems.map((item) => item.get({ plain: true })),
        };
      },
      dbConnection
    );
  },

  /**
   * Crea la cabecera de una nota de crédito
   * @param {Object} notaCreditoData - Datos de la nota de crédito
   * @param {Object} transaction - Transacción de Sequelize
   * @param {Object} NotaCreditoCabezaModel - Modelo de NotaCreditoCabeza para la empresa
   * @returns {Object} - Cabecera de nota de crédito creada
   */
  async crearCabeceraNotaCredito(notaCreditoData, transaction, NotaCreditoCabezaModel) {
    try {
      // Mapear explícitamente los campos para asegurar que se guarden correctamente
      const datosCabecera = {
        DocumentoTipo: notaCreditoData.DocumentoTipo,
        DocumentoSucursal: notaCreditoData.DocumentoSucursal,
        DocumentoNumero: notaCreditoData.DocumentoNumero,
        CodigoCliente: notaCreditoData.CodigoCliente,
        Fecha: notaCreditoData.Fecha,
        ImporteTotal: parseFloat(notaCreditoData.ImporteTotal) || 0,
        ImporteUtilizado: parseFloat(notaCreditoData.ImporteUtilizado) || 0,
        ImporteNeto: parseFloat(notaCreditoData.ImporteNeto) || 0,
        ImporteIva1: parseFloat(notaCreditoData.ImporteIva1) || 0,
        ImporteIva2: parseFloat(notaCreditoData.ImporteIva2) || 0,
        BaseImponible1: parseFloat(notaCreditoData.BaseImponible1) || 0,
        BaseImponible2: parseFloat(notaCreditoData.BaseImponible2) || 0,
        PorcentajeIva1: parseFloat(notaCreditoData.PorcentajeIva1) || 21,
        PorcentajeIva2: parseFloat(notaCreditoData.PorcentajeIva2) || 10.5,
        ImporteBruto: parseFloat(notaCreditoData.ImporteBruto) || 0,
        ImporteBonificado: parseFloat(notaCreditoData.ImporteBonificado) || 0,
        ImporteAdicional: parseFloat(notaCreditoData.ImporteAdicional) || 0,
        ListaNumero: notaCreditoData.ListaNumero || 1,
        Observacion: notaCreditoData.Observacion || '',
        PorStock: notaCreditoData.PorStock ? 1 : 0,
        CodigoUsuario: notaCreditoData.CodigoUsuario || 'admin',
        CajaNumero: notaCreditoData.CajaNumero || null,
        CodigoVendedor: notaCreditoData.CodigoVendedor || '1',
        factura_tipo: notaCreditoData.factura_tipo || null,
        factura_sucursal: notaCreditoData.factura_sucursal || null,
        factura_numero: notaCreditoData.factura_numero || null
      };

      console.log('Datos de cabecera a guardar:', datosCabecera);
      
      return await NotaCreditoCabezaModel.create(datosCabecera, { transaction });
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
   * @param {Object} NotaCreditoItemModel - Modelo de NotaCreditoItem para la empresa
   * @returns {Array} - Items de nota de crédito creados
   */
  async crearItemsNotaCredito(
    items,
    documentoTipo,
    documentoSucursal,
    documentoNumero,
    transaction,
    NotaCreditoItemModel
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
      return await NotaCreditoItemModel.bulkCreate(itemsConPK, { transaction });
    } catch (error) {
      console.error("Error al crear items de nota de crédito:", error);
      throw error;
    }
  },
};

module.exports = NotaCreditoService;
