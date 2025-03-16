const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuario.controller");

// Obtener todos los usuarios
router.get("/", usuarioController.getUsuarios);

// Obtener un usuario por código
router.get("/:codigo", usuarioController.getUsuarioById);

// Crear un nuevo usuario
router.post("/", usuarioController.createUsuario);

// Actualizar un usuario existente
router.put("/:codigo", usuarioController.updateUsuario);

// Eliminar un usuario
router.delete("/:codigo", usuarioController.deleteUsuario);

module.exports = router;
