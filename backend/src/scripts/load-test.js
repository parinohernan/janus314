const { faker } = require('@faker-js/faker');
const Empresa = require('../models/Empresa');
const DBManager = require('../utils/DBManager');
const { logInfo, logError } = require('../utils/logger');

// Configuración
const NUM_EMPRESAS = 100;
const NUM_REQUESTS = 1000;
const CONCURRENT_REQUESTS = 10;

// Generar datos de prueba para una empresa
const generateEmpresaData = () => ({
  id: faker.string.uuid(),
  nombre: faker.company.name(),
  db_name: `db_${faker.string.alphanumeric(8)}`,
  db_user: faker.internet.userName(),
  db_password: faker.internet.password(),
  db_host: 'localhost',
  estado: 'activo'
});

// Crear empresas de prueba
async function createTestEmpresas() {
  logInfo('Creando empresas de prueba...');
  const empresas = [];

  for (let i = 0; i < NUM_EMPRESAS; i++) {
    try {
      const empresa = await Empresa.create(generateEmpresaData());
      empresas.push(empresa);
      logInfo(`Empresa creada: ${empresa.id}`);
    } catch (error) {
      logError(error, { context: 'createTestEmpresas' });
    }
  }

  return empresas;
}

// Simular requests concurrentes
async function simulateRequests(empresas) {
  logInfo('Iniciando simulación de requests...');
  const stats = {
    total: 0,
    successful: 0,
    failed: 0,
    avgResponseTime: 0
  };

  const batch = async () => {
    const empresa = empresas[Math.floor(Math.random() * empresas.length)];
    const start = Date.now();

    try {
      await DBManager.getConnection(empresa.id);
      const duration = Date.now() - start;
      
      stats.successful++;
      stats.avgResponseTime = (stats.avgResponseTime * (stats.total) + duration) / (stats.total + 1);
    } catch (error) {
      stats.failed++;
      logError(error, { 
        context: 'simulateRequests',
        empresaId: empresa.id
      });
    }

    stats.total++;
  };

  // Ejecutar requests en lotes
  for (let i = 0; i < NUM_REQUESTS; i += CONCURRENT_REQUESTS) {
    const promises = [];
    for (let j = 0; j < CONCURRENT_REQUESTS && (i + j) < NUM_REQUESTS; j++) {
      promises.push(batch());
    }
    await Promise.all(promises);

    // Mostrar progreso
    if (i % 100 === 0) {
      logInfo(`Progreso: ${i}/${NUM_REQUESTS} requests completadas`);
      logInfo('Estadísticas actuales:', stats);
    }
  }

  return stats;
}

// Limpiar datos de prueba
async function cleanup(empresas) {
  logInfo('Limpiando datos de prueba...');
  for (const empresa of empresas) {
    try {
      await empresa.destroy();
    } catch (error) {
      logError(error, { 
        context: 'cleanup',
        empresaId: empresa.id
      });
    }
  }
}

// Ejecutar prueba de carga
async function runLoadTest() {
  try {
    const empresas = await createTestEmpresas();
    const stats = await simulateRequests(empresas);
    
    logInfo('Prueba de carga completada', stats);
    logInfo(`Tasa de éxito: ${(stats.successful / stats.total * 100).toFixed(2)}%`);
    logInfo(`Tiempo promedio de respuesta: ${stats.avgResponseTime.toFixed(2)}ms`);
    
    await cleanup(empresas);
  } catch (error) {
    logError(error, { context: 'runLoadTest' });
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runLoadTest()
    .then(() => process.exit(0))
    .catch(error => {
      logError(error, { context: 'main' });
      process.exit(1);
    });
}

module.exports = { runLoadTest }; 