const ArticuloPreventa = require('../models/preventa/articulo.model');
const ClientePreventa = require('../models/preventa/cliente.model');
const VendedorPreventa = require('../models/preventa/vendedor.model');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const NumerosControlController = require('./numerosControl.controller');
const NumeroControlService = require('../services/numeroControl.service');

// Obtener el estado de actualización
exports.getEstadoActualizacion = async (req, res) => {
  try {
    const { Configuracion } = req.models;
    const configuraciones = await Configuracion.findAll({
      where: {
        Codigo: [
          'PreventaUltimaActualizacion'
        ]
      }
    });

    const config = configuraciones.reduce((acc, curr) => {
      acc[curr.Codigo] = curr.ValorConfig;
      return acc;
    }, {});

    res.json({
      data: {
        ultimaActualizacion: config.PreventaUltimaActualizacion || null
      }
    });
  } catch (error) {
    console.error('Error al obtener el estado de actualización:', error);
    res.status(500).json({ error: 'Error al obtener el estado de actualización' });
  }
};

// Obtener el estado de descarga
exports.getEstadoDescarga = async (req, res) => {
  try {
    const { Configuracion } = req.models;
    const configuraciones = await Configuracion.findAll({
      where: {
        Codigo: [
          'PreventaUltimaDescarga'
        ]
      }
    });

    const config = configuraciones.reduce((acc, curr) => {
      acc[curr.Codigo] = curr.ValorConfig;
      return acc;
    }, {});

    res.json({
      data: {
        ultimaDescarga: config.PreventaUltimaDescarga || null
      }
    });
  } catch (error) {
    console.error('Error al obtener el estado de descarga:', error);
    res.status(500).json({ error: 'Error al obtener el estado de descarga' });
  }
};

// Obtener configuración de sincronización
exports.getConfiguracion = async (req, res) => {
  try {
    const { Configuracion } = req.models;
    const configuraciones = await Configuracion.findAll({
      where: {
        Codigo: [
          'PreventasServidor',
          'PreventasBaseDeDatos',
          'PreventaUsuario',
          'PreventaContraseña'
        ]
      }
    });

    const config = configuraciones.reduce((acc, curr) => {
      acc[curr.Codigo] = curr.ValorConfig;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        servidor: config.PreventasServidor || '',
        baseDatos: config.PreventasBaseDeDatos || '',
        usuario: config.PreventaUsuario || '',
        password: config.PreventaContraseña || ''
      }
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener la configuración' 
    });
  }
};

// Guardar configuración de sincronización
exports.saveConfiguracion = async (req, res) => {
  try {
    const { Configuracion } = req.models;
    const { servidor, baseDatos, usuario, password } = req.body;

    // Validar datos requeridos
    if (!servidor || !baseDatos || !usuario || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }

    // Actualizar o crear configuraciones
    const configuraciones = [
      { Codigo: 'PreventasServidor', ValorConfig: servidor },
      { Codigo: 'PreventasBaseDeDatos', ValorConfig: baseDatos },
      { Codigo: 'PreventaUsuario', ValorConfig: usuario },
      { Codigo: 'PreventaContraseña', ValorConfig: password }
    ];

    for (const config of configuraciones) {
      await Configuracion.upsert(config);
    }

    res.json({
      success: true,
      message: 'Configuración guardada correctamente'
    });
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al guardar la configuración' 
    });
  }
};

// Verificar configuración
exports.verificarConfiguracion = async (req, res) => {
  try {
    const { Configuracion } = req.models;
    const configuraciones = await Configuracion.findAll({
      where: {
        Codigo: [
          'PreventasServidor',
          'PreventasBaseDeDatos',
          'PreventaUsuario',
          'PreventaContraseña'
        ]
      }
    });

    const config = configuraciones.reduce((acc, curr) => {
      acc[curr.Codigo] = curr.ValorConfig;
      return acc;
    }, {});

    const configCompleta = config.PreventasServidor && config.PreventasBaseDeDatos && 
                          config.PreventaUsuario && config.PreventaContraseña;

    if (!configCompleta) {
      console.log('Configuración incompleta:', config);
    }

    res.json({
      data: {
        configCompleta,
        config
      }
    });
  } catch (error) {
    console.error('Error al verificar configuración:', error);
    res.status(500).json({ error: 'Error al verificar configuración' });
  }
};

// Verificar conexión a la base de datos de preventas
exports.verificarConexion = async (req, res) => {
  try {
    const { Configuracion } = req.models;
    const configuraciones = await Configuracion.findAll({
      where: {
        Codigo: [
          'PreventasServidor',
          'PreventasBaseDeDatos',
          'PreventaUsuario',
          'PreventaContraseña'
        ]
      }
    });

    const config = configuraciones.reduce((acc, curr) => {
      acc[curr.Codigo] = curr.ValorConfig;
      return acc;
    }, {});

    // Verificar que la configuración esté completa
    if (!config.PreventasServidor || !config.PreventasBaseDeDatos || 
        !config.PreventaUsuario || !config.PreventaContraseña) {
      return res.status(400).json({
        success: false,
        message: 'Configuración incompleta para la conexión',
        data: { config }
      });
    }

    // Crear conexión de prueba
    const { Sequelize } = require('sequelize');
    const testSequelize = new Sequelize(
      config.PreventasBaseDeDatos,
      config.PreventaUsuario,
      config.PreventaContraseña,
      {
        host: config.PreventasServidor,
        port: 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 1,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    try {
      // Probar la conexión
      await testSequelize.authenticate();
      console.log('✅ Conexión a base de datos de preventas exitosa');

      // Verificar que las tablas necesarias existan
      const results = await testSequelize.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME IN ('preventa_cabeza', 'preventa_items', 't_articulos', 't_clientes', 't_vendedores')
      `, {
        replacements: [config.PreventasBaseDeDatos],
        type: testSequelize.QueryTypes.SELECT
      });

      const tablasExistentes = results.map(r => r.TABLE_NAME);
      const tablasRequeridas = ['preventa_cabeza', 'preventa_items', 't_articulos', 't_clientes', 't_vendedores'];
      const tablasFaltantes = tablasRequeridas.filter(tabla => !tablasExistentes.includes(tabla));

      // Contar preventas pendientes
      let preventasPendientes = 0;
      if (tablasExistentes.includes('preventa_cabeza')) {
        const countResults = await testSequelize.query(
          'SELECT COUNT(*) as count FROM preventa_cabeza',
          { type: testSequelize.QueryTypes.SELECT }
        );
        preventasPendientes = countResults[0].count;
      }

      await testSequelize.close();

      res.json({
        success: true,
        message: 'Conexión exitosa a la base de datos de preventas',
        data: {
          config,
          tablasExistentes,
          tablasFaltantes,
          preventasPendientes,
          conexionExitosa: true
        }
      });

    } catch (connectionError) {
      await testSequelize.close();
      console.error('❌ Error de conexión a base de datos de preventas:', connectionError);
      
      res.status(500).json({
        success: false,
        message: 'Error de conexión a la base de datos de preventas',
        error: connectionError.message,
        data: {
          config,
          conexionExitosa: false
        }
      });
    }

  } catch (error) {
    console.error('Error al verificar conexión:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al verificar conexión',
      error: error.message
    });
  }
};

// Función para eliminar artículos
const eliminarArticulos = async (preventasSequelize) => {
  console.log('Eliminando artículos de la tabla t_articulos en la base de datos de preventas...');
  await preventasSequelize.query(`DELETE FROM t_articulos`);
  console.log('Eliminación de artículos completada');
};

// Función para copiar artículos
const copiarArticulos = async (empresaSequelize, preventasSequelize) => {
  console.log('Copiando artículos desde la empresa específica a la base de datos de preventas...');
  
  // Obtener artículos activos de la empresa específica
  const articulos = await empresaSequelize.query(`
    SELECT 
      Codigo, 
      Descripcion, 
      Existencia, 
      ExistenciaMinima, 
      ExistenciaMaxima, 
      PrecioCostoMasImp, 
      PorcentajeIVA1, 
      PorcentajeIVA2, 
      PrecioCosto, 
      UnidadVenta, 
      Lista1, 
      Lista2, 
      Lista3, 
      Lista4, 
      Lista5, 
      ProveedorCodigo, 
      RubroCodigo, 
      Peso, 
      SiempreSeDescarga, 
      Iva2SobreNeto, 
      PorcentajeVendedor, 
      DescuentoXCantidad
    FROM t_articulos
    WHERE Activo = 1
  `, { type: empresaSequelize.QueryTypes.SELECT });

  // Insertar en la base de datos de preventas
  if (articulos.length > 0) {
    const values = articulos.map(articulo => `(
      '${articulo.Codigo || ''}',
      '${(articulo.Descripcion || '').replace(/'/g, "''")}',
      ${articulo.Existencia || 0},
      ${articulo.ExistenciaMinima || 0},
      ${articulo.ExistenciaMaxima || 0},
      ${articulo.PrecioCostoMasImp || 0},
      ${articulo.PorcentajeIVA1 || 0},
      ${articulo.PorcentajeIVA2 || 0},
      ${articulo.PrecioCosto || 0},
      '${articulo.UnidadVenta || ''}',
      ${articulo.Lista1 || 0},
      ${articulo.Lista2 || 0},
      ${articulo.Lista3 || 0},
      ${articulo.Lista4 || 0},
      ${articulo.Lista5 || 0},
      '${articulo.ProveedorCodigo || ''}',
      '${articulo.RubroCodigo || ''}',
      ${articulo.Peso || 0},
      ${articulo.SiempreSeDescarga ? 1 : 0},
      ${articulo.Iva2SobreNeto ? 1 : 0},
      ${articulo.PorcentajeVendedor || 0},
      ${articulo.DescuentoXCantidad || 0}
    )`).join(',');

    await preventasSequelize.query(`
      INSERT INTO t_articulos (
        Codigo, 
        Descripcion, 
        Existencia, 
        ExistenciaMinima, 
        ExistenciaMaxima, 
        PrecioCostoMasImp, 
        PorcentajeIVA1, 
        PorcentajeIVA2, 
        PrecioCosto, 
        UnidadVenta, 
        Lista1, 
        Lista2, 
        Lista3, 
        Lista4, 
        Lista5, 
        ProveedorCodigo, 
        RubroCodigo, 
        Peso, 
        SiempreSeDescarga, 
        Iva2SobreNeto, 
        PorcentajeVendedor, 
        DescuentoXCantidad
      ) VALUES ${values}
    `);
  }
  
  console.log(`Copia de artículos completada: ${articulos.length} artículos copiados`);
};

// Función para eliminar clientes
const eliminarClientes = async (preventasSequelize) => {
  console.log('Eliminando clientes de la tabla t_clientes en la base de datos de preventas...');
  await preventasSequelize.query(`DELETE FROM t_clientes`);
  console.log('Eliminación de clientes completada');
};

// Función para copiar clientes
const copiarClientes = async (empresaSequelize, preventasSequelize) => {
  console.log('Copiando clientes desde la empresa específica a la base de datos de preventas...');
  
  // Obtener clientes activos de la empresa específica
  const clientes = await empresaSequelize.query(`
    SELECT 
      Codigo, Descripcion, Cuit, Calle, Numero, Piso, Departamento, CodigoPostal, 
      Localidad, Telefono, Mail, ContactoComercial, CategoriaIva, ListaPrecio, 
      ImporteDeuda, CodigoVendedor, Actualizado, SaldoNTCNoAplicado, LimiteCredito
    FROM t_clientes
    WHERE Activo = 1
  `, { type: empresaSequelize.QueryTypes.SELECT });

  // Insertar en la base de datos de preventas
  if (clientes.length > 0) {
    const values = clientes.map(cliente => `(
      '${cliente.Codigo || ''}',
      '${(cliente.Descripcion || '').replace(/'/g, "''")}',
      '${cliente.Cuit || ''}',
      '${(cliente.Calle || '').replace(/'/g, "''")}',
      '${cliente.Numero || ''}',
      '${cliente.Piso || ''}',
      '${cliente.Departamento || ''}',
      '${cliente.CodigoPostal || ''}',
      '${(cliente.Localidad || '').replace(/'/g, "''")}',
      '${cliente.Telefono || ''}',
      '${cliente.Mail || ''}',
      '${(cliente.ContactoComercial || '').replace(/'/g, "''")}',
      '${cliente.CategoriaIva || ''}',
      ${cliente.ListaPrecio || 1},
      ${cliente.ImporteDeuda || 0},
      '${cliente.CodigoVendedor || ''}',
      ${cliente.Actualizado ? 1 : 0},
      ${cliente.SaldoNTCNoAplicado || 0},
      ${cliente.LimiteCredito || 0}
    )`).join(',');

    await preventasSequelize.query(`
      INSERT INTO t_clientes (
        Codigo, Descripcion, Cuit, Calle, Numero, Piso, Departamento, CodigoPostal, 
        Localidad, Telefono, Mail, ContactoComercial, CategoriaIva, ListaPrecio, 
        ImporteDeuda, CodigoVendedor, Actualizado, SaldoNTCNoAplicado, LimiteCredito
      ) VALUES ${values}
    `);
  }
  
  console.log(`Copia de clientes completada: ${clientes.length} clientes copiados`);
};

// Función para eliminar vendedores
const eliminarVendedores = async (preventasSequelize) => {
  console.log('Eliminando vendedores de la tabla t_vendedores en la base de datos de preventas...');
  await preventasSequelize.query(`DELETE FROM t_vendedores`);
  console.log('Eliminación de vendedores completada');
};

// Función para copiar vendedores
const copiarVendedores = async (empresaSequelize, preventasSequelize) => {
  console.log('Copiando vendedores desde la empresa específica a la base de datos de preventas...');
  
  // Obtener vendedores activos de la empresa específica
  const vendedores = await empresaSequelize.query(`
    SELECT 
      Codigo, 
      Descripcion,
      Clave
    FROM t_vendedores
    WHERE Activo = 1
  `, { type: empresaSequelize.QueryTypes.SELECT });

  // Insertar en la base de datos de preventas
  if (vendedores.length > 0) {
    const values = vendedores.map(vendedor => `(
      '${vendedor.Codigo || ''}',
      '${(vendedor.Descripcion || '').replace(/'/g, "''")}',
      '${vendedor.Clave || ''}'
    )`).join(',');

    await preventasSequelize.query(`
      INSERT INTO t_vendedores (
        Codigo, 
        Descripcion, 
        Clave
      ) VALUES ${values}
    `);
  }
  
  console.log(`Copia de vendedores completada: ${vendedores.length} vendedores copiados`);
};

// Actualizar artículos
exports.actualizarArticulos = async (req, res) => {
  let preventasSequelize = null;
  try {
    console.log('Iniciando actualización de artículos...');
    
    // Obtener la configuración de la base de datos de preventa usando el modelo
    const { Configuracion } = req.models;
    const configuraciones = await Configuracion.findAll({
      where: {
        Codigo: [
          'PreventasServidor',
          'PreventasBaseDeDatos',
          'PreventaUsuario',
          'PreventaContraseña'
        ]
      }
    });

    const config = configuraciones.reduce((acc, curr) => {
      acc[curr.Codigo] = curr.ValorConfig;
      return acc;
    }, {});

    // Verificar que la configuración esté completa
    if (!config.PreventasServidor || !config.PreventasBaseDeDatos || 
        !config.PreventaUsuario || !config.PreventaContraseña) {
      throw new Error('Configuración incompleta para la base de datos de preventa');
    }

    // Crear conexión directa a la base de datos de preventas
    const { Sequelize } = require('sequelize');
    preventasSequelize = new Sequelize(
      config.PreventasBaseDeDatos,
      config.PreventaUsuario,
      config.PreventaContraseña,
      {
        host: config.PreventasServidor,
        port: 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 1,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    // Probar la conexión
    await preventasSequelize.authenticate();
    console.log('✅ Conexión a base de datos de preventas establecida');

    try {
      await eliminarArticulos(preventasSequelize);
      await copiarArticulos(req.db, preventasSequelize);

      console.log('Actualización de artículos completada');
      res.json({
        success: true,
        message: 'Artículos actualizados correctamente',
        data: {
          actualizado: true
        }
      });
    } catch (error) {
      console.error('Error durante la actualización:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar artículos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al actualizar artículos: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Cerrar la conexión de preventas
    if (preventasSequelize) {
      await preventasSequelize.close();
    }
  }
};

// Actualizar clientes
exports.actualizarClientes = async (req, res) => {
  let preventasSequelize = null;
  try {
    console.log('Iniciando actualización de clientes...');
    
    // Obtener la configuración de la base de datos de preventa usando el modelo
    const { Configuracion } = req.models;
    const configuraciones = await Configuracion.findAll({
      where: {
        Codigo: [
          'PreventasServidor',
          'PreventasBaseDeDatos',
          'PreventaUsuario',
          'PreventaContraseña'
        ]
      }
    });

    const config = configuraciones.reduce((acc, curr) => {
      acc[curr.Codigo] = curr.ValorConfig;
      return acc;
    }, {});

    // Verificar que la configuración esté completa
    if (!config.PreventasServidor || !config.PreventasBaseDeDatos || 
        !config.PreventaUsuario || !config.PreventaContraseña) {
      throw new Error('Configuración incompleta para la base de datos de preventa');
    }

    // Crear conexión directa a la base de datos de preventas
    const { Sequelize } = require('sequelize');
    preventasSequelize = new Sequelize(
      config.PreventasBaseDeDatos,
      config.PreventaUsuario,
      config.PreventaContraseña,
      {
        host: config.PreventasServidor,
        port: 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 1,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    // Probar la conexión
    await preventasSequelize.authenticate();
    console.log('✅ Conexión a base de datos de preventas establecida');

    try {
      await eliminarClientes(preventasSequelize);
      await copiarClientes(req.db, preventasSequelize);
      await eliminarVendedores(preventasSequelize);
      await copiarVendedores(req.db, preventasSequelize);

      console.log('Actualización de clientes y vendedores completada');
      res.json({
        success: true,
        message: 'Clientes y vendedores actualizados correctamente',
        data: {
          actualizado: true
        }
      });
    } catch (error) {
      console.error('Error durante la actualización:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar clientes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al actualizar clientes: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Cerrar la conexión de preventas
    if (preventasSequelize) {
      await preventasSequelize.close();
    }
  }
};

// Actualizar vendedores
exports.actualizarVendedores = async (req, res) => {
  let preventasSequelize = null;
  try {
    console.log('Iniciando actualización de vendedores...');
    
    // Obtener la configuración de la base de datos de preventa usando el modelo
    const { Configuracion } = req.models;
    const configuraciones = await Configuracion.findAll({
      where: {
        Codigo: [
          'PreventasServidor',
          'PreventasBaseDeDatos',
          'PreventaUsuario',
          'PreventaContraseña'
        ]
      }
    });

    const config = configuraciones.reduce((acc, curr) => {
      acc[curr.Codigo] = curr.ValorConfig;
      return acc;
    }, {});

    // Verificar que la configuración esté completa
    if (!config.PreventasServidor || !config.PreventasBaseDeDatos || 
        !config.PreventaUsuario || !config.PreventaContraseña) {
      throw new Error('Configuración incompleta para la base de datos de preventa');
    }

    // Crear conexión directa a la base de datos de preventas
    const { Sequelize } = require('sequelize');
    preventasSequelize = new Sequelize(
      config.PreventasBaseDeDatos,
      config.PreventaUsuario,
      config.PreventaContraseña,
      {
        host: config.PreventasServidor,
        port: 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 1,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    // Probar la conexión
    await preventasSequelize.authenticate();
    console.log('✅ Conexión a base de datos de preventas establecida');

    try {
      await eliminarVendedores(preventasSequelize);
      await copiarVendedores(req.db, preventasSequelize);

      console.log('Actualización de vendedores completada');
      res.json({
        success: true,
        message: 'Vendedores actualizados correctamente',
        data: {
          actualizado: true
        }
      });
    } catch (error) {
      console.error('Error durante la actualización:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar vendedores:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al actualizar vendedores: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Cerrar la conexión de preventas
    if (preventasSequelize) {
      await preventasSequelize.close();
    }
  }
};

// Finalizar actualización
exports.finalizarActualizacion = async (req, res) => {
  try {
    const fechaActual = new Date().toISOString();
    
    // Actualizar la configuración en la empresa específica usando el modelo
    const { Configuracion } = req.models;
    await Configuracion.upsert({
      Codigo: 'PreventaUltimaActualizacion',
      ValorConfig: fechaActual
    });

    res.json({
      success: true,
      message: 'Actualización finalizada correctamente',
      data: {
        ultimaActualizacion: fechaActual
      }
    });
  } catch (error) {
    console.error('Error al finalizar actualización:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al finalizar actualización: ' + error.message 
    });
  }
};

// --- Lógica de Descarga de Preventas ---

/**
 * Procesa una única preventa: la lee del origen, la escribe en el destino 
 * con un nuevo número y la elimina del origen.
 * @param {string} baseDatosPreventa Nombre de la base de datos de preventa (origen).
 * @returns {Promise<boolean>} True si se procesó una preventa, False si no quedaban preventas.
 */
const procesarUnaPreventa = async (config, req) => {
  let cabezaOriginal = null;
  let itemsOriginales = [];
  let testSequelize = null;
  let empresaSequelize = null;

  try {
    // Crear conexión directa a la base de datos de preventas
    const { Sequelize } = require('sequelize');
    testSequelize = new Sequelize(
      config.PreventasBaseDeDatos,
      config.PreventaUsuario,
      config.PreventaContraseña,
      {
        host: config.PreventasServidor,
        port: 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 1,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    // Usar la conexión de la empresa específica para números de control
    empresaSequelize = req.db;

    // 1. Leer una preventa del origen (la más antigua)
    const cabezaResults = await testSequelize.query(
      `SELECT * FROM preventa_cabeza 
       ORDER BY Fecha ASC, DocumentoSucursal ASC, DocumentoNumero ASC 
       LIMIT 1`,
      { type: testSequelize.QueryTypes.SELECT }
    );

    const cabezaResult = cabezaResults[0];

    if (!cabezaResult) {
      console.log('No se encontraron más preventas para procesar.');
      return false; // No hay más preventas
    }
    cabezaOriginal = cabezaResult;

    itemsOriginales = await testSequelize.query(
      `SELECT * FROM preventa_items 
       WHERE DocumentoTipo = ? AND DocumentoSucursal = ? AND DocumentoNumero = ?`,
      {
        replacements: [
          cabezaOriginal.DocumentoTipo,
          cabezaOriginal.DocumentoSucursal,
          cabezaOriginal.DocumentoNumero
        ],
        type: testSequelize.QueryTypes.SELECT,
      }
    );

    // 2. Iniciar transacción en la base de datos destino (db_sis_fac)
    const tDestino = await empresaSequelize.transaction();
    let nuevoNumeroDoc = null;

    try {
      // 3. Obtener y actualizar número de control 'PRV' usando la conexión de la empresa
      nuevoNumeroDoc = await NumeroControlService.obtenerYActualizarNumero(
        'PRV', 
        cabezaOriginal.DocumentoSucursal, 
        tDestino, // transaction
        req.models.NumerosControl // modelo de la empresa específica
      );

      // 4. Insertar Cabeza en Destino (preventa_cabeza en db_sis_fac)
      // Usa la estructura de preventas.preventa_cabeza
      await empresaSequelize.query(
        `INSERT INTO preventa_cabeza (
          DocumentoTipo, DocumentoSucursal, DocumentoNumero, Fecha, FechaHoraEnvio, 
          ClienteCodigo, VendedorCodigo, PagoTipo, ImporteBruto, PorcentajeBonificacion, 
          ImporteBonificado, ImporteNeto, ImporteAdicional, ImporteIva1, ImporteIva2, 
          ImporteTotal, ImportePagado, PorcentajeIva1, PorcentajeIva2, ListaNumero, 
          Observacion
        ) VALUES (
          'PRV', /* Nuevo tipo */
          '${cabezaOriginal.DocumentoSucursal}', 
          '${nuevoNumeroDoc}', /* Nuevo número */
          '${cabezaOriginal.Fecha ? new Date(cabezaOriginal.Fecha).toISOString().slice(0, 19).replace('T', ' ') : null}', 
          '${cabezaOriginal.FechaHoraEnvio ? new Date(cabezaOriginal.FechaHoraEnvio).toISOString().slice(0, 19).replace('T', ' ') : null}', 
          '${cabezaOriginal.ClienteCodigo || ''}', 
          '${cabezaOriginal.VendedorCodigo || ''}', 
          '${cabezaOriginal.PagoTipo || 'CC'}', 
          ${cabezaOriginal.ImporteBruto || 0}, 
          ${cabezaOriginal.PorcentajeBonificacion || 0}, 
          ${cabezaOriginal.ImporteBonificado || 0}, 
          ${cabezaOriginal.ImporteNeto || 0}, 
          ${cabezaOriginal.ImporteAdicional || 0}, 
          ${cabezaOriginal.ImporteIva1 || 0}, 
          ${cabezaOriginal.ImporteIva2 || 0}, 
          ${cabezaOriginal.ImporteTotal || 0}, 
          ${cabezaOriginal.ImportePagado || 0}, 
          ${cabezaOriginal.PorcentajeIva1 || 0}, 
          ${cabezaOriginal.PorcentajeIva2 || 0}, 
          ${cabezaOriginal.ListaNumero || 1}, 
          '${(cabezaOriginal.Observacion || '').replace(/'/g, "''")}'
        )`,
        { transaction: tDestino }
      );
      
      // 5. Insertar Items en Destino (preventa_items en db_sis_fac)
      // Usa la estructura de preventas.preventa_items
      const itemsValues = itemsOriginales.map(item => `(
        'PRV', /* Nuevo tipo de documento */
        '${cabezaOriginal.DocumentoSucursal}', 
        '${nuevoNumeroDoc}', /* Nuevo número de documento */
        '${item.CodigoArticulo}', 
        ${item.Cantidad || 0}, 
        ${item.PrecioUnitario || 0}, 
        ${item.PrecioLista || 0}, 
        ${item.PorcentajeBonificacion || 0}
      )`).join(',');

      if (itemsValues) {
          await empresaSequelize.query(
            `INSERT INTO preventa_items (
              DocumentoTipo, DocumentoSucursal, DocumentoNumero, CodigoArticulo, Cantidad, 
              PrecioUnitario, PrecioLista, PorcentajeBonificacion
            ) VALUES ${itemsValues}`,
            { transaction: tDestino }
          );
      }

      // 6. Commit transacción destino
      await tDestino.commit();
      console.log(`Preventa ${cabezaOriginal.DocumentoSucursal}-${cabezaOriginal.DocumentoNumero} procesada como PRV-${nuevoNumeroDoc}`);

    } catch (error) {
      // Error durante la inserción/obtención de número -> Rollback destino
      await tDestino.rollback();
      console.error(`Error procesando preventa ${cabezaOriginal?.DocumentoSucursal}-${cabezaOriginal?.DocumentoNumero}:`, error);
      throw new Error(`Error al procesar preventa en destino: ${error.message}`); // Propagar para detener el bucle
    }

    // 7. Eliminar del origen (SOLO si la transacción destino fue exitosa)
    try {
      await testSequelize.query(
        `DELETE FROM preventa_items 
         WHERE DocumentoTipo = ? AND DocumentoSucursal = ? AND DocumentoNumero = ?`,
        { 
          replacements: [
            cabezaOriginal.DocumentoTipo,
            cabezaOriginal.DocumentoSucursal,
            cabezaOriginal.DocumentoNumero
          ],
          type: testSequelize.QueryTypes.DELETE
        }
      );
      await testSequelize.query(
        `DELETE FROM preventa_cabeza 
         WHERE DocumentoTipo = ? AND DocumentoSucursal = ? AND DocumentoNumero = ?`,
        { 
          replacements: [
            cabezaOriginal.DocumentoTipo,
            cabezaOriginal.DocumentoSucursal,
            cabezaOriginal.DocumentoNumero
          ],
          type: testSequelize.QueryTypes.DELETE
        }
      );
      console.log(`Preventa ${cabezaOriginal.DocumentoSucursal}-${cabezaOriginal.DocumentoNumero} eliminada del origen.`);
    } catch (error) {
      // Registrar error de eliminación pero no detener el proceso general
      console.error(
        `Error al ELIMINAR la preventa ${cabezaOriginal.DocumentoSucursal}-${cabezaOriginal.DocumentoNumero} del origen (ya fue copiada al destino):`,
        error
      );
      // Considerar marcar la preventa en origen como "procesada con error de borrado" si es necesario
    }

    return true; // Se procesó una preventa

  } catch (error) {
    // Error general (lectura origen, conexión, etc.)
    console.error("Error general en procesarUnaPreventa:", error);
    // Si cabezaOriginal tiene datos, el error probablemente fue en la lectura de items o posterior
    if (cabezaOriginal) {
      throw new Error(`Error procesando preventa ${cabezaOriginal.DocumentoSucursal}-${cabezaOriginal.DocumentoNumero}: ${error.message}`);
    } else {
      throw new Error(`Error al leer preventas del origen: ${error.message}`);
    }
  } finally {
    // Cerrar la conexión de prueba
    if (testSequelize) {
      await testSequelize.close();
    }
    // No cerramos empresaSequelize porque es la conexión principal del request
  }
};

// Descargar preventas
exports.descargarPreventas = async (req, res) => {
  console.log('*** Iniciando descarga de preventas ***');
  try {
    const { Configuracion } = req.models;
    const configuraciones = await Configuracion.findAll({
      where: {
        Codigo: [
          'PreventasServidor',
          'PreventasBaseDeDatos',
          'PreventaUsuario',
          'PreventaContraseña'
        ]
      }
    });
    
    const config = configuraciones.reduce((acc, curr) => {
      acc[curr.Codigo] = curr.ValorConfig;
      return acc;
    }, {});
    
    console.log('*** Configuraciones:', config);
    // Verificar que la configuración esté completa
    if (!config.PreventasServidor || !config.PreventasBaseDeDatos || 
        !config.PreventaUsuario || !config.PreventaContraseña) {
      return res.status(400).json({
        success: false,
        message: 'Configuración incompleta para la descarga de preventas'
      });
    }

    // Ejecutar la lógica para descargar las preventas
    console.log('*** Iniciando procesamiento de preventas ***');
    
    let preventasProcesadas = 0;
    let maxPreventas = 100; // Límite para evitar procesar demasiadas de una vez
    
    // Procesar preventas una por una hasta que no queden más o se alcance el límite
    while (preventasProcesadas < maxPreventas) {
      try {
        const seProcesoUna = await procesarUnaPreventa(config, req);
        if (!seProcesoUna) {
          console.log('No quedan más preventas para procesar');
          break;
        }
        preventasProcesadas++;
        console.log(`Preventa ${preventasProcesadas} procesada`);
      } catch (error) {
        console.error('Error procesando preventa:', error);
        // Continuar con la siguiente preventa en lugar de detener todo el proceso
        break;
      }
    }

    // Actualizar la fecha de última descarga
    await Configuracion.update(
      { ValorConfig: new Date().toISOString() },
      { where: { Codigo: 'PreventaUltimaDescarga' } }
    );

    res.json({
      success: true,
      message: `Proceso de descarga completado. ${preventasProcesadas} preventas procesadas`,
      data: {
        preventasProcesadas,
        maxPreventas
      }
    });

  } catch (error) {
    console.error('Error al descargar preventas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al descargar preventas',
      error: error.message
     });
  }
}; 

module.exports = exports; 