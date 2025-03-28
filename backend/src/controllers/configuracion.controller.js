const Configuracion = require("../models/configuracion.model");

// Obtener una configuración por su código
exports.getConfiguracionPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    // console.log("CCCCCCCCCCCCCCCCCCODIGO", codigo);
    if (!codigo) {
      return res.status(400).json({
        success: false,
        message: "El código de configuración es requerido",
      });
    }

    // Consultar la configuración
    const config = await Configuracion.buscarPorCodigo(codigo);

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
    const configs = await Configuracion.obtenerTodos();

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
