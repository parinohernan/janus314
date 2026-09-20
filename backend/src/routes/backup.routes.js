const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const requireAdminOrSuperadm = require('../middleware/requireAdminOrSuperadm');
const requireSuperadm = require('../middleware/requireSuperadm');
const backupController = require('../controllers/backup.controller');
const { uploadMaxBytes } = require('../services/mysqlBackup.service');

const uploadDir = path.join(os.tmpdir(), 'janus-backup-uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: uploadMaxBytes() },
  fileFilter(req, file, cb) {
    const name = String(file.originalname || '').toLowerCase();
    if (!name.endsWith('.gz')) {
      cb(Object.assign(new Error('Solo se aceptan archivos .sql.gz'), { status: 400 }));
      return;
    }
    cb(null, true);
  }
});

function handleMulter(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'El archivo supera el máximo permitido (512 MB comprimido).'
      });
    }
    return res.status(err.status || 400).json({
      success: false,
      error: err.message || 'Error al subir el archivo'
    });
  });
}

const router = express.Router();

router.use(requireAdminOrSuperadm);

router.get('/jobs/:jobId', backupController.obtenerJob);
router.get('/', backupController.listar);
router.post('/', backupController.crear);
router.get('/:id/download', backupController.descargar);
router.post('/restore-upload', requireSuperadm, handleMulter, backupController.restaurarUpload);
router.post('/:id/restore', requireSuperadm, backupController.restaurar);

module.exports = router;
