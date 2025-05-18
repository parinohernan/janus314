const { Op } = require("sequelize");

// Obtener todos los usuarios
exports.getUsuarios = async (req, res) => {
  try {
    const { Usuario } = req.models;
    const usuarios = await Usuario.findAll({
      attributes: ["Codigo", "Descripcion"], // Excluimos la clave por seguridad
    });

    res.json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
      error: error.message,
    });
  }
};

// Obtener un usuario por código
exports.getUsuarioById = async (req, res) => {
  try {
    const { Usuario } = req.models;
    const { codigo } = req.params;

    const usuario = await Usuario.findByPk(codigo, {
      attributes: ["Codigo", "Descripcion"], // Excluimos la clave por seguridad
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuario",
      error: error.message,
    });
  }
};

// Crear un nuevo usuario
exports.createUsuario = async (req, res) => {
  try {
    const { Usuario } = req.models;
    const { Codigo, Descripcion, Clave } = req.body;

    if (!Codigo || !Descripcion || !Clave) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos obligatorios",
      });
    }

    // Verificar si ya existe un usuario con ese código
    const existeUsuario = await Usuario.findByPk(Codigo);

    if (existeUsuario) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un usuario con el código ${Codigo}`,
      });
    }

    // Crear el usuario
    const nuevoUsuario = await Usuario.create({
      Codigo,
      Descripcion,
      Clave,
    });

    res.status(201).json({
      success: true,
      message: "Usuario creado correctamente",
      data: {
        Codigo: nuevoUsuario.Codigo,
        Descripcion: nuevoUsuario.Descripcion,
      },
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear usuario",
      error: error.message,
    });
  }
};

// Actualizar un usuario existente
exports.updateUsuario = async (req, res) => {
  try {
    const { Usuario } = req.models;
    const { codigo } = req.params;
    const { Descripcion, Clave } = req.body;

    const usuario = await Usuario.findByPk(codigo);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Actualizar solo los campos proporcionados
    const datosActualizar = {};
    if (Descripcion) datosActualizar.Descripcion = Descripcion;
    if (Clave) datosActualizar.Clave = Clave;

    await usuario.update(datosActualizar);

    res.json({
      success: true,
      message: "Usuario actualizado correctamente",
      data: {
        Codigo: usuario.Codigo,
        Descripcion: usuario.Descripcion,
      },
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar usuario",
      error: error.message,
    });
  }
};

// Eliminar un usuario
exports.deleteUsuario = async (req, res) => {
  try {
    const { Usuario } = req.models;
    const { codigo } = req.params;

    const usuario = await Usuario.findByPk(codigo);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    await usuario.destroy();

    res.json({
      success: true,
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar usuario",
      error: error.message,
    });
  }
};
