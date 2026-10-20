function partesFecha(fecha) {
  if (fecha === null || fecha === undefined || fecha === "") return null;

  const str = String(fecha).trim();
  if (!str) return null;

  const dmy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) {
    return { day: dmy[1], month: dmy[2], year: dmy[3] };
  }

  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return { day: iso[3], month: iso[2], year: iso[1] };
  }

  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;

  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    year: String(d.getFullYear()),
  };
}

// Función para formatear números a moneda
exports.formatearNumero = (numero) => {
  if (!numero) return "0.00";
  return numero.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/** Fecha visible en reportes/PDF: DD-MM-AAAA */
exports.formatearFecha = (fecha) => {
  if (fecha === null || fecha === undefined || fecha === "") return "";
  const str = String(fecha).trim();
  if (str === "No especificado") return str;

  const partes = partesFecha(fecha);
  if (!partes) return str.slice(0, 10);
  return `${partes.day}-${partes.month}-${partes.year}`;
};
