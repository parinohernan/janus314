const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/cliente.controller");
const pdfController = require("../controllers/pdf.controller");
const getEmpresaConnection = require("../middleware/dbConnection");

// Rutas para clientes
router.get("/", clienteController.getAllClientes);
router.get("/cuentascorrientes", clienteController.getCuentasCorrientes);
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
