const Configuracion = require('../models/configuracion.model');
const ArticuloPreventa = require('../models/preventa/articulo.model');
const ClientePreventa = require('../models/preventa/cliente.model');
const VendedorPreventa = require('../models/preventa/vendedor.model');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Obtener el estado de actualización
exports.getEstadoActualizacion = async (req, res) => {
  try {
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

// Verificar configuración
exports.verificarConfiguracion = async (req, res) => {
  try {
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

// Función para eliminar artículos
const eliminarArticulos = async (transaction, baseDatosPreventa) => {
  console.log(`Eliminando artículos de la tabla t_articulos en la base de datos ${baseDatosPreventa}...`);
  await sequelize.query(`DELETE FROM ${baseDatosPreventa}.t_articulos`, { 
    transaction,
    replacements: [baseDatosPreventa]
  });
  console.log('Eliminación de artículos completada');
};

// Función para copiar artículos
const copiarArticulos = async (transaction, baseDatosPreventa) => {
  // console.log(`Copiando artículos desde la tabla t_articulos de db_sis_fac a la tabla t_articulos de la base de datos ${baseDatosPreventa}...`);
  
  // Primero, ver la estructura de la tabla de origen
  // const estructura = await sequelize.query('DESCRIBE t_articulos', { transaction });
  // console.log('Estructura de la tabla origen:', estructura[0]);

  await sequelize.query(`
    INSERT INTO ${baseDatosPreventa}.t_articulos (
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
    )
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
  `, { 
    transaction,
    replacements: [baseDatosPreventa]
  });
  // console.log('Copia de artículos completada');
};

// Función para eliminar clientes
const eliminarClientes = async (transaction, baseDatosPreventa) => {
  console.log(`Eliminando clientes de la tabla t_clientes en la base de datos ${baseDatosPreventa}...`);
  await sequelize.query(`DELETE FROM ${baseDatosPreventa}.t_clientes`, {
    transaction,
    replacements: [baseDatosPreventa]
  });
  console.log('Eliminación de clientes completada');
};

// Función para copiar clientes
const copiarClientes = async (transaction, baseDatosPreventa) => {
  console.log(`Copiando clientes desde la tabla t_clientes de db_sis_fac a la tabla t_clientes de la base de datos ${baseDatosPreventa}...`);
  // Mapea las columnas de db_sis_fac.t_clientes a preventas.t_clientes
  await sequelize.query(`
    INSERT INTO ${baseDatosPreventa}.t_clientes (
      Codigo, Descripcion, Cuit, Calle, Numero, Piso, Departamento, CodigoPostal, 
      Localidad, Telefono, Mail, ContactoComercial, CategoriaIva, ListaPrecio, 
      ImporteDeuda, CodigoVendedor, Actualizado, SaldoNTCNoAplicado, LimiteCredito
    )
    SELECT 
      Codigo,        -- Fuente: Codigo
      Descripcion,   -- Fuente: Descripcion
      Cuit,          -- Fuente: Cuit
      Calle ,        -- Fuente: Calle
      Numero,        -- Fuente: Numero
      Piso,          -- Fuente: Piso
      Departamento,  -- Fuente: Departamento
      CodigoPostal,  -- Fuente: CodigoPostal
      Localidad,     -- Fuente: Localidad
      Telefono,      -- Fuente: Telefono
      Mail,          -- Fuente: Mail
      ContactoComercial, -- Fuente: ContactoComercial
      CategoriaIva,  -- Fuente: CategoriaIva
      ListaPrecio,   -- Fuente: ListaPrecio
      ImporteDeuda,  -- Fuente: ImporteDeuda
      CodigoVendedor, -- Fuente: CodigoVendedor
      Actualizado,   -- Fuente: Actualizado
      SaldoNTCNoAplicado, -- Fuente: SaldoNTCNoAplicado
      LimiteCredito  -- Fuente: LimiteCredito
    FROM t_clientes
    WHERE Activo = 1
  `, {
    transaction,
    replacements: [baseDatosPreventa]
  });
  console.log('Copia de clientes completada');
};

// Función para eliminar vendedores
const eliminarVendedores = async (transaction, baseDatosPreventa) => {
  console.log(`Eliminando vendedores de la tabla t_vendedores en la base de datos ${baseDatosPreventa}...`);
  await sequelize.query(`DELETE FROM ${baseDatosPreventa}.t_vendedores`, {
    transaction,
    replacements: [baseDatosPreventa]
  });
  console.log('Eliminación de vendedores completada');
};

// Función para copiar vendedores
const copiarVendedores = async (transaction, baseDatosPreventa) => {
  console.log(`Copiando vendedores desde la tabla t_vendedores de db_sis_fac a la tabla t_vendedores de la base de datos ${baseDatosPreventa}...`);
  // Mapea las columnas de db_sis_fac.t_vendedores a preventas.t_vendedores
  // Asume que la tabla origen tiene 'Nombre' que mapea a 'Descripcion'
  // Establece 'Clave' como NULL por defecto
  await sequelize.query(`
    INSERT INTO ${baseDatosPreventa}.t_vendedores (
      Codigo, 
      Descripcion, 
      Clave
    )
    SELECT 
      Codigo, 
      Descripcion,
      Clave
    FROM t_vendedores
    WHERE Activo = 1
  `, {
    transaction,
    replacements: [baseDatosPreventa]
  });
  console.log('Copia de vendedores completada');
};

// Actualizar artículos
exports.actualizarArticulos = async (req, res) => {
  let transaction;
  try {
    // console.log('Iniciando actualización de artículos...');
    
    // Primero, ver todos los códigos disponibles
    const todosLosCodigos = await Configuracion.findAll({
      attributes: ['Codigo', 'Descripcion'],
      raw: true
    });
    // console.log('Códigos de configuración disponibles:', todosLosCodigos.length);
    
    // Obtener la configuración de la base de datos de preventa
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
      // console.log('Configuración incompleta:', config);
      throw new Error('Configuración incompleta para la base de datos de preventa');
    }

    // console.log('Configuración verificada:', config);
    // console.log('Configuración verificada, iniciando transacción...');
    transaction = await sequelize.transaction();

    try {
      await eliminarArticulos(transaction, config.PreventasBaseDeDatos);
      await copiarArticulos(transaction, config.PreventasBaseDeDatos);

      // console.log('Confirmando transacción...');
      await transaction.commit();

      // console.log('Actualización de artículos completada');
      res.json({
        message: 'Artículos actualizados correctamente',
        data: {
          actualizado: true
        }
      });
    } catch (error) {
      console.error('Error durante la transacción:', error);
      if (transaction) {
        console.log('Realizando rollback...');
        await transaction.rollback();
      }
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar artículos:', error);
    res.status(500).json({ 
      error: 'Error al actualizar artículos: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Actualizar clientes
exports.actualizarClientes = async (req, res) => {
  let transaction;
  try {
    // Obtener la configuración de la base de datos de preventa
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

    transaction = await sequelize.transaction();

    try {
      await eliminarClientes(transaction, config.PreventasBaseDeDatos);
      await copiarClientes(transaction, config.PreventasBaseDeDatos);
      await eliminarVendedores(transaction, config.PreventasBaseDeDatos);
      await copiarVendedores(transaction, config.PreventasBaseDeDatos);

      await transaction.commit();

      res.json({
        message: 'Clientes actualizados correctamente',
        data: {
          actualizado: true
        }
      });
    } catch (error) {
      console.error('Error durante la transacción de clientes:', error);
      if (transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar clientes:', error);
    res.status(500).json({ 
      error: 'Error al actualizar clientes: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Actualizar vendedores
exports.actualizarVendedores = async (req, res) => {
  let transaction;
  try {
    // Obtener la configuración de la base de datos de preventa
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

    transaction = await sequelize.transaction();

    try {
      await eliminarVendedores(transaction, config.PreventasBaseDeDatos);
      await copiarVendedores(transaction, config.PreventasBaseDeDatos);

      await transaction.commit();

      res.json({
        message: 'Vendedores actualizados correctamente',
        data: {
          actualizado: true
        }
      });
    } catch (error) {
      console.error('Error durante la transacción de vendedores:', error);
      if (transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar vendedores:', error);
    res.status(500).json({ 
      error: 'Error al actualizar vendedores: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Finalizar actualización
exports.finalizarActualizacion = async (req, res) => {
  try {
    const fechaActual = new Date().toISOString();
    await Configuracion.actualizar('PreventaUltimaActualizacion', fechaActual);

    res.json({
      message: 'Actualización finalizada correctamente',
      data: {
        ultimaActualizacion: fechaActual
      }
    });
  } catch (error) {
    console.error('Error al finalizar actualización:', error);
    res.status(500).json({ error: 'Error al finalizar actualización' });
  }
}; 