const Configuracion = require("../models/configuracion.model");
const db = require('../config/database');

// Obtener una configuración por su código
exports.getConfiguracionPorCodigo = async (req, res) => {
  try {
    const { Configuracion } = req.models;
    const { codigo } = req.params;
    
    if (!codigo) {
      return res.status(400).json({
        success: false,
        message: "El código de configuración es requerido",
      });
    }

    // Consultar la configuración
    const config = await Configuracion.findOne({
      where: { Codigo: codigo }
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la configuración con código: ${codigo}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener la configuración",
      error: error.message,
    });
  }
};

// Obtener todas las configuraciones
exports.getAllConfiguraciones = async (req, res) => {
  try {
    const { Configuracion } = req.models;
    
    const configs = await Configuracion.findAll();

    return res.status(200).json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error("Error al obtener configuraciones:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las configuraciones",
      error: error.message,
    });
  }
};

/**
 * Actualizar el valor de una configuración
 */
exports.actualizarConfiguracion = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { valor } = req.body;

    if (!codigo) {
      return res.status(400).json({
        success: false,
        message: "El código de configuración es requerido",
      });
    }

    if (valor === undefined) {
      return res.status(400).json({
        success: false,
        message: "El valor de la configuración es requerido",
      });
    }

    // Verificar que la configuración existe
    const configExistente = await Configuracion.buscarPorCodigo(codigo);
    if (!configExistente) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la configuración con código: ${codigo}`,
      });
    }

    // Actualizar la configuración
    const actualizado = await Configuracion.actualizar(codigo, valor);

    if (!actualizado) {
      return res.status(500).json({
        success: false,
        message: "No se pudo actualizar la configuración",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Configuración actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar la configuración",
      error: error.message,
    });
  }
};

// Obtener toda la configuración de sincronización móvil
exports.getConfiguracion = async (req, res) => {
  try {
    const configuraciones = await Configuracion.findAll({
      where: {
        Codigo: [
          'PreventasServidor',
          'PreventasBaseDeDatos',
          'PreventaUsuario',
          'PreventaContraseña',
          'PreventaUltimaDescarga',
          'PreventaUltimaActualizacion'
        ]
      }
    });

    // Transformar los resultados en un objeto más manejable
    const config = configuraciones.reduce((acc, curr) => {
      acc[curr.Codigo] = curr.ValorConfig;
      return acc;
    }, {});

    res.json({
      data: {
        servidor: config.PreventasServidor || '',
        baseDatos: config.PreventasBaseDeDatos || '',
        usuario: config.PreventaUsuario || '',
        password: config.PreventaContraseña || '',
        ultimaDescarga: config.PreventaUltimaDescarga || null,
        ultimaActualizacion: config.PreventaUltimaActualizacion || null
      }
    });
  } catch (error) {
    console.error('Error al obtener la configuración:', error);
    res.status(500).json({ error: 'Error al obtener la configuración' });
  }
};

// Actualizar la configuración
exports.updateConfiguracion = async (req, res) => {
  const { servidor, baseDatos, usuario, password } = req.body;

  try {
    // Actualizar cada configuración individualmente
    await Promise.all([
      Configuracion.actualizar('PreventasServidor', servidor || ''),
      Configuracion.actualizar('PreventasBaseDeDatos', baseDatos || ''),
      Configuracion.actualizar('PreventaUsuario', usuario || ''),
      Configuracion.actualizar('PreventaContraseña', password || '')
    ]);

    res.json({ message: 'Configuración actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
    res.status(500).json({ error: 'Error al actualizar la configuración' });
  }
};

// Actualizar la última fecha de descarga
exports.updateUltimaDescarga = async (req, res) => {
  try {
    const fechaActual = new Date().toISOString();
    await Configuracion.actualizar('PreventaUltimaDescarga', fechaActual);

    res.json({ 
      data: {
        ultimaDescarga: fechaActual
      }
    });
  } catch (error) {
    console.error('Error al actualizar la última descarga:', error);
    res.status(500).json({ error: 'Error al actualizar la última descarga' });
  }
};

// Actualizar la última fecha de actualización
exports.updateUltimaActualizacion = async (req, res) => {
  try {
    const fechaActual = new Date().toISOString();
    await Configuracion.actualizar('PreventaUltimaActualizacion', fechaActual);

    res.json({ 
      data: {
        ultimaActualizacion: fechaActual
      }
    });
  } catch (error) {
    console.error('Error al actualizar la última actualización:', error);
    res.status(500).json({ error: 'Error al actualizar la última actualización' });
  }
};
