const cloudinary = require('cloudinary').v2;
const { remitosFolderFromEmpresaId } = require('../utils/cloudinaryRemitosFolder');

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Sube una imagen a Cloudinary (p. ej. desde teléfono en Compras).
 * POST multipart campo: imagen
 */
exports.subirImagenMovil = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      success: false,
      message:
        'Cloudinary no configurado (faltan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)'
    });
  }

  if (!req.file?.buffer) {
    return res.status(400).json({
      success: false,
      message: 'No se envió ninguna imagen o el archivo no es válido'
    });
  }

  if (!req.file.mimetype?.startsWith('image/')) {
    return res.status(400).json({
      success: false,
      message: 'Solo se permiten archivos de imagen'
    });
  }

  const folder = remitosFolderFromEmpresaId(req.userData?.empresaId);
  if (!folder) {
    return res.status(401).json({
      success: false,
      message: 'No se pudo determinar la empresa del usuario (sesión inválida)'
    });
  }

  configureCloudinary();

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          unique_filename: true,
          overwrite: false
        },
        (err, uploadResult) => {
          if (err) reject(err);
          else resolve(uploadResult);
        }
      );
      stream.end(req.file.buffer);
    });

    return res.json({
      success: true,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      folderPrefix: folder
    });
  } catch (err) {
    console.error('subirImagenMovil Cloudinary:', err.message || err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error al subir la imagen a Cloudinary'
    });
  }
};
