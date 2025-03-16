const Vendedor = require("../models/vendedor.model");
const { Op } = require("sequelize");

// Obtener todos los vendedores
exports.getVendedores = async (req, res) => {
  try {
    // Filtro opcional para mostrar solo activos
    const activo = req.query.activo;
    const whereClause = {};

    if (activo !== undefined) {
      whereClause.Activo = activo === "true" ? 1 : 0;
    }

    const vendedores = await Vendedor.findAll({
      where: whereClause,
      attributes: ["Codigo", "Descripcion", "Activo"], // Excluimos la clave por seguridad
      order: [["Descripcion", "ASC"]],
    });

    res.json({
      success: true,
      data: vendedores,
    });
  } catch (error) {
    console.error("Error al obtener vendedores:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener vendedores",
      error: error.message,
    });
  }
};

// Obtener un vendedor por código
exports.getVendedorById = async (req, res) => {
  try {
    const { codigo } = req.params;

    const vendedor = await Vendedor.findByPk(codigo, {
      attributes: ["Codigo", "Descripcion", "Activo"], // Excluimos la clave por seguridad
    });

    if (!vendedor) {
      return res.status(404).json({
        success: false,
        message: "Vendedor no encontrado",
      });
    }

    res.json({
      success: true,
      data: vendedor,
    });
  } catch (error) {
    console.error("Error al obtener vendedor:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener vendedor",
      error: error.message,
    });
  }
};

// Crear un nuevo vendedor
exports.createVendedor = async (req, res) => {
  try {
    const { Codigo, Descripcion, Clave, Activo } = req.body;

    if (!Codigo || !Descripcion) {
      return res.status(400).json({
        success: false,
        message: "El código y descripción son obligatorios",
      });
    }

    // Verificar si ya existe un vendedor con ese código
    const existeVendedor = await Vendedor.findByPk(Codigo);

    if (existeVendedor) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un vendedor con el código ${Codigo}`,
      });
    }

    // Crear el vendedor
    const nuevoVendedor = await Vendedor.create({
      Codigo,
      Descripcion,
      Clave,
      Activo: Activo !== undefined ? Activo : 1,
    });

    res.status(201).json({
      success: true,
      message: "Vendedor creado correctamente",
      data: {
        Codigo: nuevoVendedor.Codigo,
        Descripcion: nuevoVendedor.Descripcion,
        Activo: nuevoVendedor.Activo,
      },
    });
  } catch (error) {
    console.error("Error al crear vendedor:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear vendedor",
      error: error.message,
    });
  }
};

// Actualizar un vendedor existente
exports.updateVendedor = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { Descripcion, Clave, Activo } = req.body;

    const vendedor = await Vendedor.findByPk(codigo);

    if (!vendedor) {
      return res.status(404).json({
        success: false,
        message: "Vendedor no encontrado",
      });
    }

    // Actualizar solo los campos proporcionados
    const datosActualizar = {};
    if (Descripcion !== undefined) datosActualizar.Descripcion = Descripcion;
    if (Clave !== undefined) datosActualizar.Clave = Clave;
    if (Activo !== undefined) datosActualizar.Activo = Activo;

    await vendedor.update(datosActualizar);

    res.json({
      success: true,
      message: "Vendedor actualizado correctamente",
      data: {
        Codigo: vendedor.Codigo,
        Descripcion: vendedor.Descripcion,
        Activo: vendedor.Activo,
      },
    });
  } catch (error) {
    console.error("Error al actualizar vendedor:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar vendedor",
      error: error.message,
    });
  }
};

// Eliminar un vendedor
exports.deleteVendedor = async (req, res) => {
  try {
    const { codigo } = req.params;

    const vendedor = await Vendedor.findByPk(codigo);

    if (!vendedor) {
      return res.status(404).json({
        success: false,
        message: "Vendedor no encontrado",
      });
    }

    await vendedor.destroy();

    res.json({
      success: true,
      message: "Vendedor eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar vendedor:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar vendedor",
      error: error.message,
    });
  }
};
