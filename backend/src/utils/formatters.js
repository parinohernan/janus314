// Función para formatear números a moneda
exports.formatearNumero = (numero) => {
  if (!numero) return "0.00";
  return numero.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Función para formatear fechas
exports.formatearFecha = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-AR");
};
