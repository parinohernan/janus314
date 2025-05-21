const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegram.controller');
const getEmpresaConnection = require('../middleware/dbConnection');

// Middleware para agregar los servicios al request
const addServices = (req, res, next) => {
  // Solo agregar los servicios si existe la conexión a la base de datos
  if (req.db && req.models) {
    // Los servicios ya están disponibles a través de req.models
    req.services = {
      ConfiguracionService: {
        obtenerConfiguracion: async (clave) => {
          try {
            const result = await req.db.query(
              "SELECT ValorConfig FROM configuracion WHERE NombreConfig = ?",
              {
                replacements: [clave],
                type: req.db.QueryTypes.SELECT
              }
            );
            return { valor: result && result.length > 0 ? result[0].ValorConfig : null };
          } catch (error) {
            console.error("Error al obtener configuración:", error);
            return { valor: null };
          }
        }
      },
      numeroControlService: {
        obtenerYActualizarNumero: async (codigo, sucursal) => {
          const t = await req.db.transaction();
          try {
            // Obtener con bloqueo
            const [numeroControl] = await req.db.query(
              `SELECT Codigo, Sucursal, Descripcion, NumeroProximo, Copias 
               FROM t_numeroscontrol 
               WHERE Codigo = ? AND Sucursal = ? 
               FOR UPDATE`,
              {
                replacements: [codigo, sucursal],
                type: req.db.QueryTypes.SELECT,
                transaction: t,
              }
            );
        
            if (!numeroControl) {
              await t.rollback();
              throw new Error(`No se encontró configuración para el comprobante ${codigo} y sucursal ${sucursal}`);
            }
        
            const numeroActual = numeroControl.NumeroProximo;
        
            // Actualizar inmediatamente
            await req.db.query(
              `UPDATE t_numeroscontrol 
               SET NumeroProximo = NumeroProximo + 1 
               WHERE Codigo = ? AND Sucursal = ?`,
              {
                replacements: [codigo, sucursal],
                type: req.db.QueryTypes.UPDATE,
                transaction: t,
              }
            );
        
            await t.commit();
        
            // Formatear el número como string con ceros a la izquierda (8 dígitos)
            const numeroFormateado = numeroActual.toString().padStart(8, "0");
            
            return {
              tipo: numeroControl.Codigo,
              sucursal: numeroControl.Sucursal,
              descripcion: numeroControl.Descripcion,
              numeroAsignado: numeroActual,
              numeroFormateado: numeroFormateado,
              copias: numeroControl.Copias,
            };
          } catch (error) {
            await t.rollback();
            console.error("Error al obtener y actualizar número:", error);
            throw error;
          }
        }
      }
    };
  }
  next();
};

// Endpoint para recibir actualizaciones de Telegram (webhook)
router.post('/webhook', telegramController.processWebhook);

// Endpoint para actualizar estado de una venta y notificar al usuario
router.post('/notify/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ success: false, message: 'Se requiere userId y message' });
    }
    
    const sent = await telegramController.sendNotification(userId, message);
    
    if (sent) {
      return res.status(200).json({ success: true, message: 'Notificación enviada' });
    } else {
      return res.status(500).json({ success: false, message: 'Error al enviar notificación' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint para crear factura desde Telegram
router.post("/facturas", getEmpresaConnection, addServices, telegramController.crearFactura);

// Endpoint para crear o actualizar un producto
router.post("/productos", getEmpresaConnection, addServices, telegramController.crearProducto);

// Endpoint para obtener datos básicos
router.get("/datos", getEmpresaConnection, addServices, telegramController.obtenerDatos);

module.exports = router; 