const fs = require("fs");
const path = require("path");

const CARPETA_LOGOS_TICKET = path.join(__dirname, "../../storage/logos-ticket");

function rutaLogoTicket(empresaId) {
  const id = String(empresaId || "").replace(/\D/g, "");
  if (!id) return null;
  return path.join(CARPETA_LOGOS_TICKET, `logoTicket_${id}.png`);
}

/** El número de empresa sale del token, así cada empresa solo descarga su propio logo. */
exports.getLogoTicket = (req, res) => {
  const ruta = rutaLogoTicket(req.empresaData?.id);
  if (!ruta || !fs.existsSync(ruta)) {
    return res.status(404).json({ success: false, message: "La empresa no tiene logo de ticket" });
  }
  res.set("Cache-Control", "private, max-age=300");
  return res.type("png").sendFile(ruta);
};

exports.rutaLogoTicket = rutaLogoTicket;
exports.CARPETA_LOGOS_TICKET = CARPETA_LOGOS_TICKET;
