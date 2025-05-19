const { QueryTypes } = require("sequelize");
const NumeroControlService = require("../services/numeroControl.service");

// Exportar el servicio para uso directo
exports.servicio = NumeroControlService;

// Obtener el próximo número disponible para un tipo de comprobante y sucursal
exports.obtenerProximoNumero = async (req, res) => {
  try {
    const { NumerosControl } = req.models;
    const { codigo, sucursal } = req.params;

    // Validar parámetros
    if (!codigo || !sucursal) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar el código de comprobante y sucursal",
      });
    }

    // Buscar en la tabla de números de control
    const numeroControl = await NumerosControl.findOne({
      where: {
        Codigo: codigo,
        Sucursal: sucursal,
      },
    });

    if (!numeroControl) {
      return res.status(404).json({
        success: false,
        message: `No se encontró configuración para el comprobante ${codigo} y sucursal ${sucursal}`,
      });
    }

    // Devolver el próximo número disponible
    res.json({
      success: true,
      data: {
        tipo: numeroControl.Codigo,
        sucursal: numeroControl.Sucursal,
        descripcion: numeroControl.Descripcion,
        proximoNumero: numeroControl.NumeroProximo,
        copias: numeroControl.Copias,
      },
    });
  } catch (error) {
    console.error("Error al obtener próximo número:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el próximo número de comprobante",
      error: error.message,
    });
  }
};

// Actualizar (incrementar) el próximo número para un tipo de comprobante
exports.actualizarProximoNumero = async (req, res) => {
  const sequelize = req.db;
  const t = await sequelize.transaction();
  console.log("actualizarProximoNumero", req.params);
  try {
    const { NumerosControl } = req.models;
    const { codigo, sucursal } = req.params;

    // Validar parámetros
    if (!codigo || !sucursal) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar el código de comprobante y sucursal",
      });
    }

    // Primero obtenemos el número actual con bloqueo para evitar concurrencia
    const [result] = await sequelize.query(
      `SELECT NumeroProximo FROM t_numeroscontrol 
       WHERE Codigo = ? AND Sucursal = ? 
       FOR UPDATE`,
      {
        replacements: [codigo, sucursal],
        type: QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (!result) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: `No se encontró configuración para el comprobante ${codigo} y sucursal ${sucursal}`,
      });
    }

    const numeroActual = result.NumeroProximo;

    // Actualizar el número incrementándolo
    await NumerosControl.update(
      { NumeroProximo: numeroActual + 1 },
      {
        where: {
          Codigo: codigo,
          Sucursal: sucursal,
        },
        transaction: t,
      }
    );

    await t.commit();

    // Devolver el número que se utilizó (el que estaba antes de incrementar)
    res.json({
      success: true,
      data: {
        tipo: codigo,
        sucursal: sucursal,
        numeroUtilizado: numeroActual,
        nuevoProximoNumero: numeroActual + 1,
        numeroFormateado: String(numeroActual).padStart(8, "0"),
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al actualizar próximo número:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el próximo número de comprobante",
      error: error.message,
    });
  }
};

// Método para obtener y actualizar en una única operación atómica
// Esto es útil para asignar un número y actualizarlo inmediatamente

// Listar todos los tipos de comprobantes configurados
exports.listarNumerosControl = async (req, res) => {
  try {
    const { NumerosControl } = req.models;
    const numerosControl = await NumerosControl.findAll({
      order: [
        ["Codigo", "ASC"],
        ["Sucursal", "ASC"],
      ],
    });

    res.json({
      success: true,
      data: numerosControl,
    });
  } catch (error) {
    console.error("Error al listar números de control:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener listado de números de control",
      error: error.message,
    });
  }
};

// Incrementar el número de control según tipo y sucursal
exports.incrementNumber = async (req, res) => {
  const { tipo, sucursal } = req.params;
  const { numeroActual } = req.body;
  const { NumerosControl } = req.models;

  try {
    console.log(
      `Incrementando número para ${tipo}/${sucursal}, actual: ${numeroActual}`
    );

    // Buscar el registro de control
    let numeroControl = await NumerosControl.findOne({
      where: {
        Codigo: tipo,
        Sucursal: sucursal,
      },
    });

    if (!numeroControl) {
      // Si no existe, crear uno nuevo
      numeroControl = await NumerosControl.create({
        Codigo: tipo,
        Sucursal: sucursal,
        NumeroProximo: parseInt(numeroActual) + 1 || 1,
      });

      return res.status(201).json({
        success: true,
        message: "Número de control creado e incrementado",
        data: {
          tipo,
          sucursal,
          numeroProximo: numeroControl.NumeroProximo,
        },
      });
    }

    // Verificar que el número actual no sea menor que el último registrado
    const proximoGuardado = parseInt(numeroControl.NumeroProximo);
    const actual = parseInt(numeroActual);

    // Si el número actual es mayor o igual al próximo guardado, actualizamos al siguiente
    if (actual >= proximoGuardado - 1) {
      await numeroControl.update({
        NumeroProximo: actual + 1,
      });
    } else {
      // Si el número enviado es menor, mantenemos el mayor
      // No actualizamos porque el próximo ya es mayor que el actual+1
    }

    return res.status(200).json({
      success: true,
      message: "Número de control incrementado correctamente",
      data: {
        tipo,
        sucursal,
        numeroProximo: numeroControl.NumeroProximo,
      },
    });
  } catch (error) {
    console.error("Error al incrementar número de control:", error);
    return res.status(500).json({
      success: false,
      message: "Error al incrementar número de control",
      error: error.message,
    });
  }
};

// Método para actualizar directamente (no como middleware de Express)
exports.actualizarNumeroDirecto = async (tipo, sucursal, db, models) => {
  const sequelize = db;
  const { NumerosControl } = models;
  const t = await sequelize.transaction();

  try {
    // Validar parámetros
    if (!tipo || !sucursal) {
      await t.rollback();
      throw new Error("Debe proporcionar el código de comprobante y sucursal");
    }

    // Primero obtenemos el número actual con bloqueo para evitar concurrencia
    const [result] = await sequelize.query(
      `SELECT NumeroProximo FROM t_numeroscontrol 
       WHERE Codigo = ? AND Sucursal = ? 
       FOR UPDATE`,
      {
        replacements: [tipo, sucursal],
        type: QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (!result) {
      await t.rollback();
      throw new Error(
        `No se encontró configuración para el comprobante ${tipo} y sucursal ${sucursal}`
      );
    }

    const numeroActual = result.NumeroProximo;

    // Actualizar el número incrementándolo
    await NumerosControl.update(
      { NumeroProximo: numeroActual + 1 },
      {
        where: {
          Codigo: tipo,
          Sucursal: sucursal,
        },
        transaction: t,
      }
    );

    await t.commit();
    return {
      tipo: tipo,
      sucursal: sucursal,
      numeroUtilizado: numeroActual,
      nuevoProximoNumero: numeroActual + 1,
    };
  } catch (error) {
    await t.rollback();
    console.error("Error al actualizar próximo número:", error);
    throw error;
  }
};

// Añadir el método que fue eliminado para mantener la compatibilidad con las rutas
exports.obtenerYActualizarNumero = async (req, res) => {
  const sequelize = req.db;
  const t = await sequelize.transaction();

  try {
    const { NumerosControl } = req.models;
    const { codigo, sucursal } = req.params;

    // Validar parámetros
    if (!codigo || !sucursal) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar el código de comprobante y sucursal",
      });
    }

    // Obtener con bloqueo
    const [numeroControl] = await sequelize.query(
      `SELECT Codigo, Sucursal, Descripcion, NumeroProximo, Copias 
       FROM t_numeroscontrol 
       WHERE Codigo = ? AND Sucursal = ? 
       FOR UPDATE`,
      {
        replacements: [codigo, sucursal],
        type: QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (!numeroControl) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: `No se encontró configuración para el comprobante ${codigo} y sucursal ${sucursal}`,
      });
    }

    const numeroActual = numeroControl.NumeroProximo;

    // Actualizar inmediatamente
    await sequelize.query(
      `UPDATE t_numeroscontrol 
       SET NumeroProximo = NumeroProximo + 1 
       WHERE Codigo = ? AND Sucursal = ?`,
      {
        replacements: [codigo, sucursal],
        type: QueryTypes.UPDATE,
        transaction: t,
      }
    );

    await t.commit();

    // Formatear el número como string con ceros a la izquierda (8 dígitos)
    const numeroFormateado = numeroActual.toString().padStart(8, "0");

    // Devolver el número obtenido y ya incrementado para el siguiente
    res.json({
      success: true,
      data: {
        tipo: numeroControl.Codigo,
        sucursal: numeroControl.Sucursal,
        descripcion: numeroControl.Descripcion,
        numeroAsignado: numeroActual,
        numeroFormateado: numeroFormateado,
        copias: numeroControl.Copias,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al obtener y actualizar número:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar el número de comprobante",
      error: error.message,
    });
  }
};
