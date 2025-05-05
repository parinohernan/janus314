const Configuracion = require('../models/configuracion.model');
const ArticuloPreventa = require('../models/preventa/articulo.model');
const ClientePreventa = require('../models/preventa/cliente.model');
const VendedorPreventa = require('../models/preventa/vendedor.model');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const NumerosControlController = require('./numerosControl.controller');

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

// --- Lógica de Descarga de Preventas ---

/**
 * Procesa una única preventa: la lee del origen, la escribe en el destino 
 * con un nuevo número y la elimina del origen.
 * @param {string} baseDatosPreventa Nombre de la base de datos de preventa (origen).
 * @returns {Promise<boolean>} True si se procesó una preventa, False si no quedaban preventas.
 */
const procesarUnaPreventa = async (baseDatosPreventa) => {
  let cabezaOriginal = null;
  let itemsOriginales = [];

  try {
    // 1. Leer una preventa del origen (la más antigua)
    const [cabezaResult] = await sequelize.query(
      `SELECT * FROM ${baseDatosPreventa}.preventa_cabeza 
       ORDER BY Fecha ASC, DocumentoSucursal ASC, DocumentoNumero ASC 
       LIMIT 1`,
      { type: QueryTypes.SELECT, replacements: [baseDatosPreventa] }
    );

    if (!cabezaResult) {
      console.log('No se encontraron más preventas para procesar.');
      return false; // No hay más preventas
    }
    cabezaOriginal = cabezaResult;

    itemsOriginales = await sequelize.query(
      `SELECT * FROM ${baseDatosPreventa}.preventa_items 
       WHERE DocumentoTipo = ? AND DocumentoSucursal = ? AND DocumentoNumero = ?`,
      {
        replacements: [
          cabezaOriginal.DocumentoTipo,
          cabezaOriginal.DocumentoSucursal,
          cabezaOriginal.DocumentoNumero,
          baseDatosPreventa
        ],
        type: QueryTypes.SELECT,
      }
    );

    // 2. Iniciar transacción en la base de datos destino (db_sis_fac)
    const tDestino = await sequelize.transaction();
    let nuevoNumeroDoc = null;

    try {
      // 3. Obtener y actualizar número de control 'PRV'
      const numeroInfo = await NumerosControlController.actualizarNumeroDirecto(
        'PRV', 
        cabezaOriginal.DocumentoSucursal, 
        { transaction: tDestino } // Pasar la transacción
      );
      nuevoNumeroDoc = numeroInfo.numeroUtilizado.toString().padStart(8, '0');

      // 4. Insertar Cabeza en Destino (preventa_cabeza en db_sis_fac)
      // Usa la estructura de preventas.preventa_cabeza
      await sequelize.query(
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
          await sequelize.query(
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
      await sequelize.query(
        `DELETE FROM ${baseDatosPreventa}.preventa_items 
         WHERE DocumentoTipo = ? AND DocumentoSucursal = ? AND DocumentoNumero = ?`,
        { 
          replacements: [
            cabezaOriginal.DocumentoTipo,
            cabezaOriginal.DocumentoSucursal,
            cabezaOriginal.DocumentoNumero,
            baseDatosPreventa
          ],
          type: QueryTypes.DELETE
        }
      );
      await sequelize.query(
        `DELETE FROM ${baseDatosPreventa}.preventa_cabeza 
         WHERE DocumentoTipo = ? AND DocumentoSucursal = ? AND DocumentoNumero = ?`,
        { 
          replacements: [
            cabezaOriginal.DocumentoTipo,
            cabezaOriginal.DocumentoSucursal,
            cabezaOriginal.DocumentoNumero,
            baseDatosPreventa
          ],
          type: QueryTypes.DELETE
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
  }
};

// Descargar Preventas
exports.descargarPreventas = async (req, res) => {
  console.log('Iniciando descarga de preventas...');
  let procesadasCount = 0;

  try {
    // Obtener configuración de la BD de preventa
    const configuraciones = await Configuracion.findAll({
      where: { Codigo: ['PreventasBaseDeDatos'] }
    });
    const config = configuraciones.reduce((acc, curr) => {
      acc[curr.Codigo] = curr.ValorConfig;
      return acc;
    }, {});

    if (!config.PreventasBaseDeDatos) {
      throw new Error('Configuración incompleta: Falta PreventasBaseDeDatos');
    }

    // Bucle para procesar preventas una por una
    while (true) {
      const seProcesoUna = await procesarUnaPreventa(config.PreventasBaseDeDatos);
      if (seProcesoUna) {
        procesadasCount++;
      } else {
        break; // No hay más preventas
      }
      // Opcional: Pausa breve para no sobrecargar la BD
      // await new Promise(resolve => setTimeout(resolve, 50)); 
    }

    // Actualizar fecha de última descarga
    const fechaActual = new Date().toISOString();
    await Configuracion.update(
        { ValorConfig: fechaActual },
        { where: { Codigo: 'PreventaUltimaDescarga' } }
    );
     // Si no existe, crearla
     const existe = await Configuracion.findOne({ where: { Codigo: 'PreventaUltimaDescarga' } });
     if (!existe) {
         await Configuracion.create({ Codigo: 'PreventaUltimaDescarga', ValorConfig: fechaActual, Descripcion: 'Fecha de última descarga de preventas' });
     }

    console.log(`Descarga de preventas completada. ${procesadasCount} preventas procesadas.`);
    res.json({
      message: `Descarga completada. ${procesadasCount} preventas procesadas.`, 
      data: { 
        descargado: true, 
        cantidad: procesadasCount,
        ultimaDescarga: fechaActual
      }
    });

  } catch (error) {
    console.error('Error durante la descarga de preventas:', error);
    res.status(500).json({ 
      error: 'Error en la descarga de preventas: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
     });
  }
}; 