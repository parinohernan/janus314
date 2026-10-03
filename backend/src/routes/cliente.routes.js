const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/cliente.controller");
const pdfController = require("../controllers/pdf.controller");
const getEmpresaConnection = require("../middleware/dbConnection");
const multer = require("multer");

const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("archivo");

// Rutas para clientes (localidades debe ir antes de /:id)
router.get("/", clienteController.getAllClientes);
router.post("/importar", (req, res, next) => {
  uploadCsv(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "No se pudo leer el archivo" });
    next();
  });
}, clienteController.importarClientes);
router.get("/localidades", clienteController.getLocalidadesDistinct);
router.get("/cuentascorrientes", clienteController.getCuentasCorrientes);
router.post("/pos/ensure-cf", clienteController.ensurePosCf);
router.get("/:id/comprobantes", clienteController.getComprobantesCliente);
router.get("/:id", clienteController.getClienteById);
router.post("/", clienteController.createCliente);
router.put("/:id", clienteController.updateCliente);
router.put("/:id/toggleActivo", clienteController.toggleActivoCliente);
router.put("/:id/actualizarSaldo", clienteController.actualizarSaldoCliente);

// Ruta para obtener el saldo del cliente
router.get('/:codigo/saldo', clienteController.obtenerSaldoCliente);

// Ruta para generar PDF de cuenta corriente
router.get('/:codigoCliente/cuenta-corriente/pdf', getEmpresaConnection, pdfController.generarCuentaCorrientePDF);

module.exports = router;
