const express = require('express');
const router = express.Router();
const multer = require('multer');
const getEmpresaConnection = require('../middleware/dbConnection');
const remitoController = require('../controllers/remito.controller');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imágenes'));
    }
    cb(null, true);
  }
});

router.post(
  '/analizar-imagen',
  getEmpresaConnection,
  upload.single('imagen'),
  remitoController.analizarImagen
);

module.exports = router;