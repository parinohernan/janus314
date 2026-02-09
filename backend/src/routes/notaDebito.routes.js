const express = require('express');
const router = express.Router();
const notaDebitoController = require('../controllers/notaDebito.controller');
const pdfController = require('../controllers/pdf.controller');

// Obtener todas las notas de débito (con filtros y paginación)
router.get('/', notaDebitoController.getAllNotasDebito);

// Generar PDF de nota de débito
router.get('/pdf/:tipo/:sucursal/:numero', pdfController.generarNotaDebitoPDF);

// Obtener una nota de débito por ID (tipo, sucursal, número)
router.get('/:tipo/:sucursal/:numero', notaDebitoController.getNotaDebitoById);

// Crear una nueva nota de débito
router.post('/', notaDebitoController.createNotaDebito);

// Actualizar una nota de débito
router.put('/:tipo/:sucursal/:numero', notaDebitoController.updateNotaDebito);

// Anular una nota de débito
router.post('/:tipo/:sucursal/:numero/anular', notaDebitoController.anularNotaDebito);

module.exports = router; 