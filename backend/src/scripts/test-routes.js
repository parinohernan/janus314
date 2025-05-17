const axios = require('axios');
const { generateTestToken } = require('./test-auth-tenant');
const { logInfo, logError } = require('../utils/logger');

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Configuración de pruebas
const TEST_ROUTES = {
  // Rutas públicas
  public: [
    { method: 'GET', path: '/health' },
  ],
  // Rutas que requieren autenticación
  authenticated: [
    { method: 'GET', path: '/api/usuarios/perfil' },
    { method: 'GET', path: '/api/clientes' },
    { method: 'GET', path: '/api/articulos' }
  ],
  // Rutas que requieren permisos de administrador
  admin: [
    { method: 'GET', path: '/api/admin/db-status' },
    { method: 'POST', path: '/api/admin/validate-schemas' }
  ]
};

// Probar ruta específica
async function testRoute(route, token = null) {
  const config = {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  };

  try {
    const response = await axios({
      method: route.method,
      url: `${API_URL}${route.path}`,
      ...config
    });

    logInfo(`Ruta ${route.path} probada exitosamente`, {
      status: response.status,
      method: route.method
    });

    return {
      success: true,
      status: response.status
    };
  } catch (error) {
    logError(error, {
      context: 'testRoute',
      route: route.path,
      method: route.method,
      status: error.response?.status
    });

    return {
      success: false,
      status: error.response?.status || 500,
      error: error.message
    };
  }
}

// Probar todas las rutas
async function testAllRoutes(empresaId) {
  const results = {
    public: [],
    authenticated: [],
    admin: []
  };

  // Generar tokens
  const userToken = generateTestToken(empresaId);
  const adminToken = generateTestToken(empresaId, true);

  // Probar rutas públicas
  logInfo('Probando rutas públicas...');
  for (const route of TEST_ROUTES.public) {
    const result = await testRoute(route);
    results.public.push({
      route: route.path,
      ...result
    });
  }

  // Probar rutas autenticadas
  logInfo('Probando rutas autenticadas...');
  for (const route of TEST_ROUTES.authenticated) {
    // Probar sin token (debe fallar)
    const withoutToken = await testRoute(route);
    // Probar con token (debe funcionar)
    const withToken = await testRoute(route, userToken);

    results.authenticated.push({
      route: route.path,
      withoutToken,
      withToken
    });
  }

  // Probar rutas admin
  logInfo('Probando rutas de administrador...');
  for (const route of TEST_ROUTES.admin) {
    // Probar con token normal (debe fallar)
    const withUserToken = await testRoute(route, userToken);
    // Probar con token admin (debe funcionar)
    const withAdminToken = await testRoute(route, adminToken);

    results.admin.push({
      route: route.path,
      withUserToken,
      withAdminToken
    });
  }

  return results;
}

// Analizar resultados
function analyzeResults(results) {
  const analysis = {
    public: {
      total: results.public.length,
      successful: results.public.filter(r => r.success).length
    },
    authenticated: {
      total: results.authenticated.length,
      correctlySecured: results.authenticated.filter(r => 
        !r.withoutToken.success && r.withToken.success
      ).length
    },
    admin: {
      total: results.admin.length,
      correctlySecured: results.admin.filter(r =>
        !r.withUserToken.success && r.withAdminToken.success
      ).length
    }
  };

  return analysis;
}

// Ejecutar pruebas
async function runRouteTests(empresaId) {
  try {
    logInfo('Iniciando pruebas de rutas...', { empresaId });
    
    const results = await testAllRoutes(empresaId);
    const analysis = analyzeResults(results);

    logInfo('Pruebas de rutas completadas', { analysis });

    console.log('\nResumen de pruebas de rutas:');
    console.log('==========================');
    console.log(`Rutas públicas: ${analysis.public.successful}/${analysis.public.total} exitosas`);
    console.log(`Rutas autenticadas: ${analysis.authenticated.correctlySecured}/${analysis.authenticated.total} correctamente aseguradas`);
    console.log(`Rutas admin: ${analysis.admin.correctlySecured}/${analysis.admin.total} correctamente aseguradas`);

    return { results, analysis };
  } catch (error) {
    logError(error, { context: 'runRouteTests' });
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  // Usar un ID de empresa de prueba
  const testEmpresaId = 'test-empresa-1';
  
  runRouteTests(testEmpresaId)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error en las pruebas de rutas:', error);
      process.exit(1);
    });
}

module.exports = { runRouteTests, testRoute }; 