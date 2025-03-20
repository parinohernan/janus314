/**
 * Servicio para validar los datos de una factura
 */
const FacturaValidator = {
  /**
   * Valida los datos de una factura
   * @param {Object} factura - Datos de la factura a validar
   * @returns {Object} - Resultado de la validación {isValid, errors}
   */
  validarFactura(factura) {
    const errors = [];

    if (!factura.DocumentoTipo) {
      errors.push("El tipo de documento es obligatorio");
    }

    if (!factura.DocumentoSucursal) {
      errors.push("La sucursal es obligatoria");
    }

    if (!factura.Fecha) {
      errors.push("La fecha es obligatoria");
    }

    if (!factura.ClienteCodigo) {
      errors.push("El cliente es obligatorio");
    }

    if (!factura.Items || factura.Items.length === 0) {
      errors.push("La factura debe tener al menos un ítem");
    } else {
      factura.Items.forEach((item, index) => {
        if (!item.ArticuloCodigo) {
          errors.push(`El artículo del ítem ${index + 1} es obligatorio`);
        }
        if (!item.Cantidad || item.Cantidad <= 0) {
          errors.push(
            `La cantidad del ítem ${index + 1} debe ser mayor a cero`
          );
        }
        if (!item.PrecioUnitario || item.PrecioUnitario <= 0) {
          errors.push(`El precio del ítem ${index + 1} debe ser mayor a cero`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

module.exports = FacturaValidator;
