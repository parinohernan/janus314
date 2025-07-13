const express = require('express');
const router = express.Router();
const sincronizacionController = require('../controllers/sincronizacion.controller');
const getEmpresaConnection = require('../middleware/dbConnection');

console.log('*** Router de sincronización cargado ***'); // Log general

// Rutas para configuración
router.get('/configuracion', getEmpresaConnection, sincronizacionController.getConfiguracion);
router.put('/configuracion', getEmpresaConnection, sincronizacionController.saveConfiguracion);

// Rutas para el estado de actualización
router.get('/estado-actualizacion', getEmpresaConnection, sincronizacionController.getEstadoActualizacion);
router.get('/estado-descarga', getEmpresaConnection, sincronizacionController.getEstadoDescarga);

// Rutas para el proceso de actualización
router.get('/verificar-configuracion', getEmpresaConnection, sincronizacionController.verificarConfiguracion);
router.get('/verificar-conexion', getEmpresaConnection, sincronizacionController.verificarConexion);
router.post('/actualizar-articulos', getEmpresaConnection, sincronizacionController.actualizarArticulos);
router.post('/actualizar-clientes', getEmpresaConnection, sincronizacionController.actualizarClientes);
router.post('/actualizar-vendedores', getEmpresaConnection, sincronizacionController.actualizarVendedores);
router.post('/finalizar-actualizacion', getEmpresaConnection, sincronizacionController.finalizarActualizacion);

// Ruta para descargar preventas
router.post('/descargar-preventas', getEmpresaConnection, sincronizacionController.descargarPreventas);

// Exportar el router
module.exports = router; 