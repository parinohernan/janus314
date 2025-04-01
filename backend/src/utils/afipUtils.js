// Función para generar código de barras AFIP
exports.generarCodigoBarrasAfip = (comprobante) => {
  if (!comprobante || !comprobante.afip_cae) return null;

  // Aquí iría la lógica para generar el código de barras según especificaciones de AFIP
  // Por ahora retornamos un placeholder
  return `${comprobante.afip_cae}${comprobante.DocumentoNumero}`;
};
