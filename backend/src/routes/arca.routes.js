const express = require("express");
const multer = require("multer");
const router = express.Router();
const arcaController = require("../controllers/arca.controller");
const arcaAdminController = require("../controllers/arcaAdmin.controller");
const requireAdminOrSuperadm = require("../middleware/requireAdminOrSuperadm");

// Rutas para operaciones con AFIP/ARCA
router.post("/grabar-cae", arcaController.obtenerCae);
router.get("/estado-completo", arcaController.obtenerEstadoCompleto);
router.post("/ultimo-comprobante", arcaController.obtenerUltimoComprobante);
router.post("/colocar-cae-manualmente", arcaController.colocarCaeManualmente);
router.get("/facturas-sin-cae", arcaController.listarFacturasSinCae);

// Administración de la instancia atrarca de esta empresa.
// La clave x-admin-key se inyecta solo del lado del servidor y nunca llega al navegador.
const uploadAdminEmpresa = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 }
});

function handleMulterAdminEmpresa(req, res, next) {
  uploadAdminEmpresa.fields([
    { name: "certificado", maxCount: 1 },
    { name: "key", maxCount: 1 }
  ])(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "El archivo supera el máximo permitido (100 KB por archivo)."
      });
    }
    return res.status(err.status || 400).json({
      success: false,
      error: err.message || "Error al subir el archivo"
    });
  });
}

router.use("/admin-empresa", requireAdminOrSuperadm);
router.get("/admin-empresa", arcaAdminController.obtener);
router.put("/admin-empresa", handleMulterAdminEmpresa, arcaAdminController.actualizar);
router.post(
  "/admin-empresa/certificado",
  handleMulterAdminEmpresa,
  arcaAdminController.renovarCertificado
);
router.post("/admin-empresa/verificar", arcaAdminController.verificar);

module.exports = router;
