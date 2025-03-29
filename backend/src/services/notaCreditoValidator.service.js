/**
 * Servicio para validar datos de notas de crédito
 */
const NotaCreditoValidator = {
  /**
   * Valida que los datos de la nota de crédito sean correctos
   * @param {Object} notaCreditoData - Datos de la nota de crédito a validar
   * @returns {Object} - Resultado de la validación
   */
  validarNotaCredito(notaCreditoData) {
    const errors = [];

    // Validar campos obligatorios
    if (!notaCreditoData.DocumentoTipo) {
      errors.push("El tipo de documento es obligatorio");
    }

    if (!notaCreditoData.DocumentoSucursal) {
      errors.push("La sucursal es obligatoria");
    }

    if (!notaCreditoData.CodigoCliente) {
      errors.push("El código de cliente es obligatorio");
    }

    if (!notaCreditoData.Fecha) {
      errors.push("La fecha es obligatoria");
    }

    // Validar items
    if (
      !notaCreditoData.Items ||
      !Array.isArray(notaCreditoData.Items) ||
      notaCreditoData.Items.length === 0
    ) {
      errors.push("Debe incluir al menos un ítem en la nota de crédito");
    } else {
      // Validar cada item
      notaCreditoData.Items.forEach((item, index) => {
        if (!item.CodigoArticulo) {
          errors.push(`El ítem ${index + 1} debe tener un código de artículo`);
        }
        if (!item.Cantidad || item.Cantidad <= 0) {
          errors.push(`El ítem ${index + 1} debe tener una cantidad válida`);
        }
        if (!item.PrecioUnitario || item.PrecioUnitario < 0) {
          errors.push(
            `El ítem ${index + 1} debe tener un precio unitario válido`
          );
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

module.exports = NotaCreditoValidator;
