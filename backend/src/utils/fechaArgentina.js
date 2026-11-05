const moment = require("moment-timezone");

const ZONA_ARGENTINA = "America/Argentina/Buenos_Aires";

/** Fecha calendario de hoy en Argentina (YYYY-MM-DD) para comprobantes. */
function fechaHoyArgentina() {
  return moment().tz(ZONA_ARGENTINA).format("YYYY-MM-DD");
}

module.exports = {
  ZONA_ARGENTINA,
  fechaHoyArgentina,
};
