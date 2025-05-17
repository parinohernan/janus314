const express = require('express');
const router = express.Router();
const masterDB = require('../config/masterDB');
const Empresa = require('../models/Empresa');
const DBManager = require('../utils/DBManager');

router.get('/', async (req, res) => {
  const health = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    services: {
      masterDB: { status: 'checking' },
      empresaDB: { status: 'checking' },
      api: { status: 'up' }
    }
  };

  try {
    // Verificar conexión a base de datos maestra
    await masterDB.testConnection();
    health.services.masterDB.status = 'up';

    // Obtener una empresa de prueba
    const empresaPrueba = await Empresa.findOne({
      where: { estado: 'activo' }
    });

    if (empresaPrueba) {
      try {
        // Intentar conectar a la base de datos de la empresa
        const connection = await DBManager.getConnection(empresaPrueba.id);
        await connection.authenticate();
        health.services.empresaDB = {
          status: 'up',
          testedWith: empresaPrueba.id
        };
      } catch (error) {
        health.services.empresaDB = {
          status: 'down',
          error: error.message
        };
      }
    } else {
      health.services.empresaDB = {
        status: 'unknown',
        error: 'No hay empresas activas para probar'
      };
    }

    // Determinar estado general
    const allServicesUp = Object.values(health.services)
      .every(service => service.status === 'up');

    health.status = allServicesUp ? 'healthy' : 'degraded';

    // Enviar respuesta con código de estado apropiado
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.services.masterDB = {
      status: 'down',
      error: error.message
    };
    res.status(503).json(health);
  }
});

module.exports = router; 