const DatosEmpresa = require("../models/datosEmpresa.model");

// Obtener datos de la empresa (hay solo un registro)
exports.getDatosEmpresa = async (req, res) => {
  try {
    // Como solo hay un registro, siempre tomamos el primero
    const datosEmpresa = await DatosEmpresa.findOne();

    if (!datosEmpresa) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron datos de empresa configurados",
      });
    }

    res.json({
      success: true,
      data: datosEmpresa,
    });
  } catch (error) {
    console.error("Error al obtener datos de empresa:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos de empresa",
      error: error.message,
    });
  }
};

// Actualizar datos de la empresa
exports.updateDatosEmpresa = async (req, res) => {
  try {
    const datos = req.body;

    // Verificar que se proporcionó un registro
    if (!datos || !datos.RazonSocial) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar datos válidos con RazonSocial",
      });
    }

    // Buscar si ya existe un registro
    const datosExistentes = await DatosEmpresa.findOne();

    let datosActualizados;

    if (datosExistentes) {
      // Actualizar el registro existente
      datosActualizados = await datosExistentes.update(datos);
    } else {
      // Crear un nuevo registro
      datosActualizados = await DatosEmpresa.create(datos);
    }

    res.json({
      success: true,
      message: "Datos de empresa actualizados correctamente",
      data: datosActualizados,
    });
  } catch (error) {
    console.error("Error al actualizar datos de empresa:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar datos de empresa",
      error: error.message,
    });
  }
};
