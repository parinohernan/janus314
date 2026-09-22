const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const CuentaAcceso = require("../models/cuentaAcceso.model");
const { esAdminOSuperadm } = require("../middleware/vendedorRoles");

const TIPOS_ABM = ["cajero", "vendor"];
const CODIGO_CAJERO = /^[a-z0-9._-]{3,20}$/i;

function rechazarSiNoAdmin(req, res) {
  if (esAdminOSuperadm(req)) return false;
  res.status(403).json({
    success: false,
    message: "Solo admin o superadmin pueden administrar cajeros y vendedores",
  });
  return true;
}

function normalizarTipo(permisos) {
  return String(permisos || "").trim().toLowerCase();
}

async function sincronizarCuentaCajero({ empresaId, codigo, clave, activo }) {
  const usuario = String(codigo).trim().toLowerCase();
  const estaActivo = Number(activo) !== 0;
  let cuenta = await CuentaAcceso.findOne({
    where: { empresa_id: empresaId, vendedor_codigo: String(codigo) },
  });
  if (!cuenta) {
    cuenta = await CuentaAcceso.findOne({ where: { usuario } });
  }
  if (cuenta && String(cuenta.vendedor_codigo) !== String(codigo)) {
    const error = new Error("Ya existe una cuenta de acceso con ese usuario");
    error.status = 409;
    throw error;
  }
  if (cuenta) {
    const datos = { activo: estaActivo, vendedor_codigo: String(codigo), empresa_id: empresaId };
    if (clave) datos.password_hash = clave;
    await cuenta.update(datos);
    return;
  }
  if (!clave) {
    const error = new Error("La clave es obligatoria para un cajero");
    error.status = 400;
    throw error;
  }
  await CuentaAcceso.create({
    id: uuidv4(),
    usuario,
    password_hash: clave,
    empresa_id: empresaId,
    vendedor_codigo: String(codigo),
    activo: estaActivo,
  });
}

async function desactivarCuenta(empresaId, codigo) {
  const cuenta = await CuentaAcceso.findOne({
    where: { empresa_id: empresaId, vendedor_codigo: String(codigo) },
  });
  if (cuenta) await cuenta.update({ activo: false });
}

// Obtener todos los vendedores
exports.getVendedores = async (req, res) => {
  try {
    const { Vendedor } = req.models;
    // Filtro opcional para mostrar solo activos
    const activo = req.query.activo;
    const whereClause = {};

    if (activo !== undefined) {
      whereClause.Activo = activo === "true" ? 1 : 0;
    }

    const vendedores = await Vendedor.findAll({
      where: whereClause,
      attributes: ["Codigo", "Descripcion", "Activo", "Permisos"], // Incluimos Permisos
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
    const { Vendedor } = req.models;
    const { codigo } = req.params;

    const vendedor = await Vendedor.findByPk(codigo, {
      attributes: ["Codigo", "Descripcion", "Activo", "Permisos"], // Incluimos Permisos
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
    const { Vendedor } = req.models;
    const { Codigo, Descripcion, Clave, Activo, Permisos } = req.body;

    if (!Codigo || !Descripcion) {
      return res.status(400).json({
        success: false,
        message: "El código y descripción son obligatorios",
      });
    }

    if (rechazarSiNoAdmin(req, res)) return;

    const tipo = normalizarTipo(Permisos);
    if (!TIPOS_ABM.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: "El tipo debe ser cajero o vendor",
      });
    }

    const codigo = String(Codigo).trim();
    if (["admin", "superadm"].includes(codigo.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Ese código está reservado",
      });
    }
    if (tipo === "cajero" && !CODIGO_CAJERO.test(codigo)) {
      return res.status(400).json({
        success: false,
        message: "El código del cajero debe tener 3 a 20 caracteres (letras, números, punto, guion)",
      });
    }
    if (tipo === "cajero" && String(Clave || "").length < 8) {
      return res.status(400).json({
        success: false,
        message: "La clave del cajero debe tener al menos 8 caracteres",
      });
    }

    // Verificar si ya existe un vendedor con ese código
    const existeVendedor = await Vendedor.findByPk(codigo);

    if (existeVendedor) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un vendedor con el código ${Codigo}`,
      });
    }

    // Crear el vendedor
    const nuevoVendedor = await Vendedor.create({
      Codigo: codigo,
      Descripcion,
      Clave: Clave || null,
      Activo: Activo !== undefined ? Activo : 1,
      Permisos: tipo,
    });

    if (tipo === "cajero") {
      try {
        await sincronizarCuentaCajero({
          empresaId: req.empresaData?.id || req.userData?.empresaId,
          codigo,
          clave: Clave,
          activo: nuevoVendedor.Activo,
        });
      } catch (errorCuenta) {
        await nuevoVendedor.destroy();
        throw errorCuenta;
      }
    }

    res.status(201).json({
      success: true,
      message: "Vendedor creado correctamente",
      data: {
        Codigo: nuevoVendedor.Codigo,
        Descripcion: nuevoVendedor.Descripcion,
        Activo: nuevoVendedor.Activo,
        Permisos: nuevoVendedor.Permisos,
      },
    });
  } catch (error) {
    console.error("Error al crear vendedor:", error);
    const conflicto = error.name === "SequelizeUniqueConstraintError" || error.status === 409;
    res.status(error.status || (conflicto ? 409 : 500)).json({
      success: false,
      message: conflicto
        ? "Ya existe una cuenta de acceso con ese usuario"
        : error.status
          ? error.message
          : "Error al crear vendedor",
    });
  }
};

// Actualizar un vendedor existente
exports.updateVendedor = async (req, res) => {
  try {
    const { Vendedor } = req.models;
    const { codigo } = req.params;
    const { Descripcion, Clave, Activo, Permisos } = req.body;

    const vendedor = await Vendedor.findByPk(codigo);

    if (!vendedor) {
      return res.status(404).json({
        success: false,
        message: "Vendedor no encontrado",
      });
    }

    if (rechazarSiNoAdmin(req, res)) return;

    const permisosPrevios = normalizarTipo(vendedor.Permisos);
    const tipo = Permisos !== undefined ? normalizarTipo(Permisos) : permisosPrevios;
    if (Permisos !== undefined && !TIPOS_ABM.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: "El tipo debe ser cajero o vendor",
      });
    }
    if (tipo === "cajero" && Clave !== undefined && String(Clave).length > 0 && String(Clave).length < 8) {
      return res.status(400).json({
        success: false,
        message: "La clave del cajero debe tener al menos 8 caracteres",
      });
    }

    // Actualizar solo los campos proporcionados
    const datosActualizar = {};
    if (Descripcion !== undefined) datosActualizar.Descripcion = Descripcion;
    if (Clave !== undefined) datosActualizar.Clave = Clave;
    if (Activo !== undefined) datosActualizar.Activo = Activo;
    if (Permisos !== undefined) datosActualizar.Permisos = tipo;

    await vendedor.update(datosActualizar);

    const empresaId = req.empresaData?.id || req.userData?.empresaId;
    if (tipo === "cajero") {
      await sincronizarCuentaCajero({
        empresaId,
        codigo: vendedor.Codigo,
        clave: Clave || "",
        activo: vendedor.Activo,
      });
    } else if (permisosPrevios === "cajero" || tipo === "vendor") {
      await desactivarCuenta(empresaId, vendedor.Codigo);
    }

    res.json({
      success: true,
      message: "Vendedor actualizado correctamente",
      data: {
        Codigo: vendedor.Codigo,
        Descripcion: vendedor.Descripcion,
        Activo: vendedor.Activo,
        Permisos: vendedor.Permisos,
      },
    });
  } catch (error) {
    console.error("Error al actualizar vendedor:", error);
    const conflicto = error.name === "SequelizeUniqueConstraintError" || error.status === 409;
    res.status(error.status || (conflicto ? 409 : 500)).json({
      success: false,
      message: conflicto
        ? "Ya existe una cuenta de acceso con ese usuario"
        : error.status
          ? error.message
          : "Error al actualizar vendedor",
    });
  }
};

// Eliminar un vendedor
exports.deleteVendedor = async (req, res) => {
  try {
    const { Vendedor } = req.models;
    const { codigo } = req.params;

    const vendedor = await Vendedor.findByPk(codigo);

    if (!vendedor) {
      return res.status(404).json({
        success: false,
        message: "Vendedor no encontrado",
      });
    }

    if (rechazarSiNoAdmin(req, res)) return;
    if (["admin", "superadm"].includes(String(codigo).trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Ese usuario no se puede eliminar",
      });
    }

    await desactivarCuenta(req.empresaData?.id || req.userData?.empresaId, vendedor.Codigo);
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
