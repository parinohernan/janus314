// Configurar zona horaria por defecto
process.env.TZ = "America/Argentina/Buenos_Aires";

// Función para formatear fechas en zona horaria argentina
const formatDateArgentina = (date) => {
  return new Date(date).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
};

// Función para obtener la fecha actual en Argentina
const getNowArgentina = () => {
  return new Date().toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
};

module.exports = {
  formatDateArgentina,
  getNowArgentina,
};
