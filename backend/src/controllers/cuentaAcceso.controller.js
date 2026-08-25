const { v4: uuidv4 } = require('uuid');
const Empresa = require('../models/Empresa');
const CuentaAcceso = require('../models/cuentaAcceso.model');
const authService = require('../services/auth.service');

const MIN_PASSWORD_LENGTH = 8;
const USUARIO_REGEX = /^[a-z0-9._-]{3,64}$/;

function serializeCuenta(cuenta) {
  const json = typeof cuenta.toJSON === 'function' ? cuenta.toJSON() : { ...cuenta };
  delete json.password_hash;
  return json;
}

exports.listarCuentas = async (req, res) => {
  try {
    const cuentas = await CuentaAcceso.findAll({
      include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'estado'] }],
      order: [['usuario', 'ASC']]
    });
    res.json({
      success: true,
      data: cuentas.map(serializeCuenta)
    });
  } catch (error) {
    console.error('Error al listar cuentas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar cuentas'
    });
  }
};

exports.crearCuenta = async (req, res) => {
  try {
    const usuario = String(req.body.usuario || '').trim().toLowerCase();
    const { password, empresa_id, vendedor_codigo } = req.body;

    if (!usuario || !password || !empresa_id || !vendedor_codigo) {
      return res.status(400).json({
        success: false,
        error: 'usuario, password, empresa_id y vendedor_codigo son requeridos'
      });
    }
    if (!USUARIO_REGEX.test(usuario)) {
      return res.status(400).json({
        success: false,
        error: 'El usuario debe tener 3-64 caracteres (letras, números, punto, guion o guion bajo)'
      });
    }
    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
      });
    }

    const { vendedor } = await authService.getVendedorEnEmpresa(empresa_id, vendedor_codigo);
    if (!vendedor) {
      return res.status(400).json({
        success: false,
        error: 'El vendedor no existe en esa empresa'
      });
    }

    const cuenta = await CuentaAcceso.create({
      id: uuidv4(),
      usuario,
      password_hash: password,
      empresa_id,
      vendedor_codigo: String(vendedor_codigo),
      activo: true
    });

    res.status(201).json({
      success: true,
      data: serializeCuenta(cuenta)
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message
      });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'Ya existe una cuenta con ese usuario o ese vendedor en la empresa'
      });
    }
    console.error('Error al crear cuenta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear cuenta'
    });
  }
};

exports.actualizarCuenta = async (req, res) => {
  try {
    const cuenta = await CuentaAcceso.findByPk(req.params.id);
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta no encontrada'
      });
    }

    const { password, activo } = req.body;
    if (password !== undefined) {
      if (String(password).length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
          success: false,
          error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
        });
      }
      cuenta.password_hash = password;
    }
    if (activo !== undefined) {
      cuenta.activo = Boolean(activo);
    }

    await cuenta.save();
    res.json({
      success: true,
      data: serializeCuenta(cuenta)
    });
  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar cuenta'
    });
  }
};

exports.listarEmpresas = async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      attributes: ['id', 'nombre', 'estado'],
      order: [['nombre', 'ASC']]
    });
    res.json({
      success: true,
      data: empresas
    });
  } catch (error) {
    console.error('Error al listar empresas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar empresas'
    });
  }
};

exports.listarVendedoresEmpresa = async (req, res) => {
  try {
    const vendedores = await authService.listVendedoresDeEmpresa(req.params.id);
    res.json({
      success: true,
      data: vendedores
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message
      });
    }
    console.error('Error al listar vendedores:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar vendedores'
    });
  }
};
