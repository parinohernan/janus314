const express = require('express');
const multer = require('multer');
const router = express.Router();
const comprasController = require('../controllers/compras.controller');
const comprasUploadController = require('../controllers/comprasUpload.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

router.get('/', comprasController.listarCompras);
router.post('/', comprasController.crearCompra);
router.post(
  '/subir-imagen-cloudinary',
  upload.single('imagen'),
  comprasUploadController.subirImagenMovil
);
router.get('/:tipo/:sucursal/:numero', comprasController.obtenerCompra);

module.exports = router;
