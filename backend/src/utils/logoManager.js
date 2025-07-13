const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

class LogoManager {
  constructor() {
    this.logosDir = path.join(__dirname, '../templates/pdf/common/logos');
    this.ensureLogosDirectory();
  }

  /**
   * Asegura que el directorio de logos existe
   */
  ensureLogosDirectory() {
    if (!fs.existsSync(this.logosDir)) {
      fs.mkdirSync(this.logosDir, { recursive: true });
      console.log('📁 Directorio de logos creado:', this.logosDir);
    }
  }

  /**
   * Genera un nombre de archivo único basado en la URL
   */
  generateFileNameFromUrl(url) {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const extension = this.getExtensionFromUrl(url);
    return `logo_${hash}${extension}`;
  }

  /**
   * Obtiene la extensión del archivo desde la URL
   */
  getExtensionFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extension = path.extname(pathname).toLowerCase();
      
      // Si no hay extensión o es inválida, usar .png por defecto
      if (!extension || !['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].includes(extension)) {
        return '.png';
      }
      
      return extension;
    } catch (error) {
      console.warn('⚠️ Error parseando URL, usando .png por defecto:', error.message);
      return '.png';
    }
  }

  /**
   * Descarga un archivo desde una URL
   */
  downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      console.log(`📥 Descargando logo desde: ${url}`);
      console.log(`💾 Guardando en: ${filePath}`);
      
      const file = fs.createWriteStream(filePath);
      
      const request = protocol.get(url, (response) => {
        // Verificar que la respuesta sea exitosa
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        // Verificar el tipo de contenido
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          reject(new Error(`Tipo de contenido inválido: ${contentType}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`✅ Logo descargado exitosamente: ${filePath}`);
          resolve(filePath);
        });

        file.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Eliminar archivo parcial
          reject(err);
        });
      });

      request.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Eliminar archivo parcial
        reject(err);
      });

      request.setTimeout(10000, () => {
        request.destroy();
        fs.unlink(filePath, () => {}); // Eliminar archivo parcial
        reject(new Error('Timeout al descargar el logo'));
      });
    });
  }

  /**
   * Obtiene la ruta del logo, descargándolo si es necesario
   */
  async getLogoPath(logoUrl) {
    try {
      // Si no hay URL, usar logo por defecto
      if (!logoUrl) {
        const defaultLogo = path.join(this.logosDir, 'logoempresa.png');
        console.log('📋 Usando logo por defecto:', defaultLogo);
        return defaultLogo;
      }

      // Si es una ruta local, verificar que existe
      if (!logoUrl.startsWith('http://') && !logoUrl.startsWith('https://')) {
        const localPath = path.join(this.logosDir, logoUrl);
        if (fs.existsSync(localPath)) {
          console.log('📋 Usando logo local existente:', localPath);
          return localPath;
        } else {
          console.warn('⚠️ Logo local no encontrado, usando por defecto:', localPath);
          return path.join(this.logosDir, 'logoempresa.png');
        }
      }

      // Es una URL, generar nombre de archivo
      const fileName = this.generateFileNameFromUrl(logoUrl);
      const filePath = path.join(this.logosDir, fileName);

      // Si el archivo ya existe, usarlo
      if (fs.existsSync(filePath)) {
        console.log('📋 Usando logo descargado existente:', filePath);
        return filePath;
      }

      // Descargar el logo
      console.log('🔄 Logo no encontrado localmente, iniciando descarga...');
      await this.downloadFile(logoUrl, filePath);
      return filePath;

    } catch (error) {
      console.error('❌ Error obteniendo logo:', error.message);
      
      // En caso de error, usar logo por defecto
      const defaultLogo = path.join(this.logosDir, 'logoempresa.png');
      console.log('📋 Usando logo por defecto debido a error:', defaultLogo);
      return defaultLogo;
    }
  }

  /**
   * Limpia logos descargados antiguos (opcional)
   */
  async cleanupOldLogos(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 días por defecto
    try {
      const files = fs.readdirSync(this.logosDir);
      const now = Date.now();
      
      for (const file of files) {
        if (file.startsWith('logo_')) {
          const filePath = path.join(this.logosDir, file);
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Logo antiguo eliminado: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error limpiando logos antiguos:', error.message);
    }
  }
}

// Crear instancia singleton
const logoManager = new LogoManager();

module.exports = logoManager; 