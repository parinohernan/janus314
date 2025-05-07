const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegram.controller');

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
router.post("/facturas", telegramController.crearFactura);

// Endpoint para obtener datos básicos
router.get("/datos", telegramController.obtenerDatos);

module.exports = router; 