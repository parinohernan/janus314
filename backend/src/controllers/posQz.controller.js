const { getCertificate, firmarMensaje, estaConfigurado, firmaHabilitada, ensureDevKeys } = require("../utils/qzSign");

exports.getCert = async (_req, res) => {
  try {
    if (!firmaHabilitada()) {
      return res.status(200).json({
        success: true,
        configurado: false,
        certificado: null,
        message: "Firma QZ desactivada. Allow + Remember funciona en modo sin certificado.",
      });
    }

    ensureDevKeys();
    const certificado = getCertificate();
    if (!certificado) {
      return res.status(200).json({
        success: true,
        configurado: false,
        certificado: null,
        message: "QZ sin certificado. En desarrollo QZ pedirá Allow una vez.",
      });
    }
    return res.status(200).json({
      success: true,
      configurado: estaConfigurado(),
      certificado,
    });
  } catch (error) {
    console.error("Error al leer certificado QZ:", error);
    return res.status(500).json({
      success: false,
      configurado: false,
      message: "No se pudo leer el certificado QZ",
      error: error.message,
    });
  }
};

exports.sign = async (req, res) => {
  try {
    if (!firmaHabilitada()) {
      return res.status(503).json({
        success: false,
        configurado: false,
        message: "Firma QZ desactivada",
      });
    }

    ensureDevKeys();
    const request = req.body?.request || req.query?.request;
    if (!request) {
      return res.status(400).json({
        success: false,
        message: "Falta el campo request a firmar",
      });
    }

    if (!estaConfigurado()) {
      return res.status(503).json({
        success: false,
        configurado: false,
        message: "QZ no tiene clave de firma configurada",
      });
    }

    const firma = firmarMensaje(request);
    return res.status(200).json({
      success: true,
      firma,
    });
  } catch (error) {
    console.error("Error al firmar mensaje QZ:", error);
    return res.status(500).json({
      success: false,
      message: "No se pudo firmar el mensaje QZ",
      error: error.message,
    });
  }
};
