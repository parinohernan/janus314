/**
 * Utilidad para generar códigos QR según especificaciones de AFIP/ARCA
 */
const QRCode = require("qrcode");

/**
 * Genera los datos para el código QR de AFIP/ARCA
 * @param {Object} factura - Datos de la factura
 * @returns {String} - URL con datos codificados para el QR
 */
async function generarDatosQR(factura) {
  try {
    // Determinar el tipo de documento según la categoría (FCB = 6, FCA = 1, etc)
    const tipoComprobante = mapearTipoComprobante(factura.DocumentoTipo);

    // Determinar el tipo de documento del receptor
    const tipoDocReceptor = factura.Cliente.CategoriaIva === "I" ? 80 : 96; // 80=CUIT, 96=DNI

    // Construir objeto JSON según especificaciones
    const datosQR = {
      ver: 1, // Versión del formato
      fecha: formatearFecha(factura.Fecha), // Formato RFC3339 (YYYY-MM-DD)
      cuit: factura.Empresa.Cuit.replace(/[-]/g, ""), // CUIT emisor sin guiones
      ptoVta: parseInt(factura.DocumentoSucursal, 10), // Punto de venta
      tipoCmp: tipoComprobante, // Tipo de comprobante
      nroCmp: parseInt(factura.DocumentoNumero, 10), // Número de comprobante
      importe: parseFloat(factura.ImporteTotal.toFixed(2)), // Importe total con 2 decimales
      moneda: "PES", // Moneda (PES para pesos argentinos)
      ctz: 1, // Cotización (1 para pesos)
      tipoDocRec: tipoDocReceptor, // Tipo de documento del receptor
      nroDocRec: factura.Cliente.Cuit.replace(/[-]/g, ""), // Documento receptor sin guiones
      tipoCodAut: "E", // E para CAE, A para CAEA
      codAut: factura.afip_cae, // Código de autorización (CAE)
    };
    // Convertir a string y codificar en Base64
    const datosQRString = JSON.stringify(datosQR);
    const datosQRBase64 = Buffer.from(datosQRString).toString("base64");

    // Construir URL completa
    const urlQR = `https://www.arca.gob.ar/fe/qr/?p=${datosQRBase64}`;

    return urlQR;
  } catch (error) {
    console.error("Error generando datos para QR AFIP:", error);
    return null;
  }
}

/**
 * Genera el código QR como imagen en formato data URI
 * @param {String} datosQR - URL con datos para el QR
 * @returns {Promise<String>} - QR en formato data URI
 */
async function generarQR(datosQR) {
  try {
    if (!datosQR) return null;

    // Opciones del QR
    const opciones = {
      errorCorrectionLevel: "M", // Nivel medio de corrección de errores
      margin: 2,
      width: 150,
      color: {
        dark: "#000000", // Negro
        light: "#FFFFFF", // Blanco
      },
    };

    // Generar QR como data URI
    return await QRCode.toDataURL(datosQR, opciones);
  } catch (error) {
    console.error("Error generando QR:", error);
    return null;
  }
}

/**
 * Mapea los tipos de documento internos a los códigos de AFIP
 */
function mapearTipoComprobante(tipo) {
  const mapeo = {
    FCB: 6, // Factura B
    FCA: 1, // Factura A
    NCB: 8, // Nota de Crédito B
    NCA: 3, // Nota de Crédito A
    NDB: 7, // Nota de Débito B
    NDA: 2, // Nota de Débito A
  };

  return mapeo[tipo] || 0;
}

/**
 * Formatea una fecha al formato requerido por AFIP (YYYY-MM-DD)
 */
function formatearFecha(fecha) {
  const date = new Date(fecha);
  return date.toISOString().split("T")[0];
}

module.exports = {
  generarDatosQR,
  generarQR,
};
