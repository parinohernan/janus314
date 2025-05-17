const { faker } = require('@faker-js/faker');
const jwt = require('jsonwebtoken');
const Empresa = require('../models/Empresa');
const DBManager = require('../utils/DBManager');
const { logInfo, logError } = require('../utils/logger');

// Configuración de prueba
const TEST_CONFIG = {
  numEmpresas: 3,
  numRequestsPorEmpresa: 5
};

// Generar token JWT para pruebas
function generateTestToken(empresaId, isAdmin = false) {
  return jwt.sign(
    { 
      empresaId,
      isAdmin,
      userId: faker.string.uuid(),
      email: faker.internet.email()
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

// Crear empresa de prueba
async function createTestEmpresa() {
  const empresaData = {
    id: faker.string.uuid(),
    nombre: faker.company.name(),
    db_name: `db_${faker.string.alphanumeric(8)}`,
    db_user: faker.internet.userName(),
    db_password: faker.internet.password(),
    db_host: 'localhost',
    db_port: 3306,
    estado: 'activo'
  };

  try {
    const empresa = await Empresa.create(empresaData);
    logInfo(`Empresa de prueba creada: ${empresa.nombre} (${empresa.id})`);
    return empresa;
  } catch (error) {
    logError(error, { context: 'createTestEmpresa' });
    throw error;
  }
}

// Simular request con autenticación
async function simulateAuthenticatedRequest(empresa, token) {
  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    logInfo('Token verificado correctamente', { empresaId: decoded.empresaId });

    // Intentar obtener conexión
    const connection = await DBManager.getConnection(empresa.id);
    logInfo('Conexión obtenida correctamente', { empresaId: empresa.id });

    // Simular una consulta simple para verificar la conexión
    await connection.query('SELECT 1');
    logInfo('Consulta de prueba exitosa', { empresaId: empresa.id });

    return true;
  } catch (error) {
    logError(error, { 
      context: 'simulateAuthenticatedRequest',
      empresaId: empresa.id
    });
    return false;
  }
}

// Probar acceso administrativo
async function testAdminAccess(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    
    if (!decoded.isAdmin) {
      throw new Error('Token no tiene permisos de administrador');
    }

    // Obtener estado de todas las conexiones (simular endpoint admin)
    const poolStatus = await DBManager.getPoolStatus();
    logInfo('Acceso administrativo exitoso', { poolStatus });

    return true;
  } catch (error) {
    logError(error, { context: 'testAdminAccess' });
    return false;
  }
}

// Ejecutar todas las pruebas
async function runTests() {
  const results = {
    empresasCreadas: 0,
    requestsExitosos: 0,
    requestsFallidos: 0,
    adminTestExitoso: false
  };

  try {
    // Crear empresas de prueba
    const empresas = [];
    for (let i = 0; i < TEST_CONFIG.numEmpresas; i++) {
      const empresa = await createTestEmpresa();
      empresas.push(empresa);
      results.empresasCreadas++;
    }

    // Probar requests normales para cada empresa
    for (const empresa of empresas) {
      const token = generateTestToken(empresa.id);
      
      for (let i = 0; i < TEST_CONFIG.numRequestsPorEmpresa; i++) {
        const success = await simulateAuthenticatedRequest(empresa, token);
        if (success) {
          results.requestsExitosos++;
        } else {
          results.requestsFallidos++;
        }
      }
    }

    // Probar acceso administrativo
    const adminToken = generateTestToken(empresas[0].id, true);
    results.adminTestExitoso = await testAdminAccess(adminToken);

    // Limpiar datos de prueba
    for (const empresa of empresas) {
      await empresa.destroy();
      logInfo(`Empresa eliminada: ${empresa.id}`);
    }

    // Mostrar resultados
    logInfo('Pruebas completadas', {
      results,
      tasaExito: `${(results.requestsExitosos / (results.requestsExitosos + results.requestsFallidos) * 100).toFixed(2)}%`
    });

    return results;
  } catch (error) {
    logError(error, { context: 'runTests' });
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('\nResumen de pruebas:');
      console.log('==================');
      console.log(`Empresas creadas: ${results.empresasCreadas}`);
      console.log(`Requests exitosos: ${results.requestsExitosos}`);
      console.log(`Requests fallidos: ${results.requestsFallidos}`);
      console.log(`Test admin exitoso: ${results.adminTestExitoso ? 'Sí' : 'No'}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en las pruebas:', error);
      process.exit(1);
    });
}

module.exports = { runTests, generateTestToken }; 