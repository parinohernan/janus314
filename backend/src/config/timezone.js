const DatosEmpresa = require("../models/datosEmpresa.model");

// Función para obtener la zona horaria configurada
const getTimezone = async () => {
  try {
    const datosEmpresa = await DatosEmpresa.findOne();
    return datosEmpresa?.Timezone || "America/Argentina/Buenos_Aires";
  } catch (error) {
    console.error("Error al obtener zona horaria:", error);
    return "America/Argentina/Buenos_Aires";
  }
};

// Función para formatear fechas en la zona horaria configurada
const formatDate = async (date) => {
  const timezone = await getTimezone();
  return new Date(date).toLocaleString("es-AR", {
    timeZone: timezone,
  });
};

// Función para obtener la fecha actual en la zona horaria configurada
const getNow = async () => {
  const timezone = await getTimezone();
  return new Date().toLocaleString("es-AR", {
    timeZone: timezone,
  });
};

module.exports = {
  getTimezone,
  formatDate,
  getNow,
};
