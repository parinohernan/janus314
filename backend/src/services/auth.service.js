const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Empresa = require('../models/Empresa');
const CuentaAcceso = require('../models/cuentaAcceso.model');
const DBManager = require('../utils/DBManager');
const { logAuthEvent } = require('../utils/logger');
const BCRYPT_ROUNDS = CuentaAcceso.BCRYPT_ROUNDS || 12;

const INVALID_CREDENTIALS = 'Credenciales inválidas';
const DUMMY_HASH = bcrypt.hashSync('__janus314-timing-dummy__', BCRYPT_ROUNDS);

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET no configurado');
    err.status = 500;
    throw err;
  }
  return secret;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeVendedor(row) {
  if (!row) return null;
  return {
    Codigo: row.Codigo ?? row.codigo,
    Descripcion: row.Descripcion ?? row.descripcion,
    Activo: row.Activo ?? row.activo,
    Permisos: row.Permisos ?? row.permisos
  };
}

function buildSessionPayload(vendedor, empresaData) {
  const token = jwt.sign(
    {
      userId: vendedor.Codigo,
      empresaId: empresaData.id,
      nombre: vendedor.Descripcion
    },
    requireJwtSecret(),
    { expiresIn: '24h' }
  );

  return {
    success: true,
    user: {
      id: vendedor.Codigo,
      nombre: vendedor.Descripcion,
      usuario: vendedor.Codigo,
      activo: Number(vendedor.Activo) === 1,
      permisos: vendedor.Permisos
    },
    empresa: {
      id: empresaData.id,
      nombre: empresaData.nombre,
      baseDatos: empresaData.db_name
    },
    token
  };
}

async function loadEmpresa(empresaId) {
  const empresaData = await Empresa.findByPk(empresaId);
  if (!empresaData) {
    throw httpError(401, 'Empresa no encontrada');
  }
  if (empresaData.estado !== 'activo') {
    throw httpError(401, 'Empresa inactiva');
  }
  return empresaData;
}

async function loadVendedor(empresaData, codigo) {
  const empresaDB = await DBManager.getConnectionWithConfig(empresaData);
  const [row] = await empresaDB.query(
    'SELECT * FROM t_vendedores WHERE codigo = ? LIMIT 1',
    {
      replacements: [codigo],
      type: empresaDB.QueryTypes.SELECT
    }
  );
  return { vendedor: normalizeVendedor(row), empresaDB };
}

function assertVendedorAdminActivo(vendedor, { notFoundMessage } = {}) {
  if (!vendedor) {
    throw httpError(401, notFoundMessage || INVALID_CREDENTIALS);
  }
  if (Number(vendedor.Activo) !== 1) {
    throw httpError(401, 'Usuario inactivo');
  }
  if (!vendedor.Permisos || vendedor.Permisos !== 'admin') {
    throw httpError(403, 'Acceso denegado - Solo los administradores pueden acceder al sistema');
  }
}

async function loginWithPassword(usuario, password) {
  const usuarioNorm = String(usuario || '').trim().toLowerCase();
  const cuenta = await CuentaAcceso.findOne({
    where: { usuario: usuarioNorm, activo: true }
  });
  const hash = cuenta ? cuenta.password_hash : DUMMY_HASH;
  const passwordOk = await bcrypt.compare(String(password || ''), hash);

  if (!cuenta || !passwordOk) {
    throw httpError(401, INVALID_CREDENTIALS);
  }

  const empresaData = await loadEmpresa(cuenta.empresa_id);
  const { vendedor } = await loadVendedor(empresaData, cuenta.vendedor_codigo);
  assertVendedorAdminActivo(vendedor);

  await cuenta.update({ ultimo_acceso: new Date() });
  logAuthEvent(usuarioNorm, 'login', true, { empresaId: empresaData.id, via: 'cuenta' });
  return buildSessionPayload(vendedor, empresaData);
}

async function loginLegacy(usuario, password, empresaId) {
  const empresaData = await loadEmpresa(empresaId);
  const empresaDB = await DBManager.getConnectionWithConfig(empresaData);
  const [row] = await empresaDB.query(
    'SELECT * FROM t_vendedores WHERE codigo = ? AND activo = 1 AND clave = ? LIMIT 1',
    {
      replacements: [usuario, password],
      type: empresaDB.QueryTypes.SELECT
    }
  );

  const vendedor = normalizeVendedor(row);
  if (!vendedor) {
    throw httpError(401, INVALID_CREDENTIALS);
  }
  if (!vendedor.Permisos || vendedor.Permisos !== 'admin') {
    throw httpError(403, 'Acceso denegado - Solo los administradores pueden acceder al sistema');
  }

  logAuthEvent(usuario, 'login', true, { empresaId: empresaData.id, via: 'legacy' });
  return buildSessionPayload(vendedor, empresaData);
}

async function verifySession(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, requireJwtSecret());
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw httpError(401, 'Token expirado');
    }
    throw httpError(401, 'Token inválido');
  }

  const empresaData = await loadEmpresa(decoded.empresaId);
  const { vendedor } = await loadVendedor(empresaData, decoded.userId);
  assertVendedorAdminActivo(vendedor, { notFoundMessage: 'Usuario no encontrado' });
  return buildSessionPayload(vendedor, empresaData);
}

async function loginSuperadmin(usuario, password) {
  const expectedUser = process.env.JANUS_SUPERADMIN_USER;
  const expectedHash = process.env.JANUS_SUPERADMIN_PASSWORD_HASH;
  if (!expectedUser || !expectedHash) {
    await bcrypt.compare(String(password || ''), DUMMY_HASH);
    throw httpError(401, INVALID_CREDENTIALS);
  }

  const userOk = String(usuario || '') === expectedUser;
  const hashToCompare = userOk ? expectedHash : DUMMY_HASH;
  const passwordOk = await bcrypt.compare(String(password || ''), hashToCompare);
  if (!userOk || !passwordOk) {
    throw httpError(401, INVALID_CREDENTIALS);
  }

  const token = jwt.sign(
    { isAdmin: true, usuario: expectedUser },
    requireJwtSecret(),
    { expiresIn: '8h' }
  );
  logAuthEvent(expectedUser, 'superadmin-login', true);
  return {
    success: true,
    token,
    user: { usuario: expectedUser, isAdmin: true }
  };
}

async function getVendedorEnEmpresa(empresaId, codigo) {
  const empresaData = await loadEmpresa(empresaId);
  const { vendedor, empresaDB } = await loadVendedor(empresaData, codigo);
  return { empresaData, vendedor, empresaDB };
}

async function listVendedoresDeEmpresa(empresaId) {
  const empresaData = await loadEmpresa(empresaId);
  const empresaDB = await DBManager.getConnectionWithConfig(empresaData);
  const rows = await empresaDB.query(
    'SELECT * FROM t_vendedores',
    { type: empresaDB.QueryTypes.SELECT }
  );
  return rows
    .map((row) => normalizeVendedor(row))
    .sort((a, b) => String(a.Descripcion || '').localeCompare(String(b.Descripcion || ''), 'es'));
}

module.exports = {
  INVALID_CREDENTIALS,
  loginWithPassword,
  loginLegacy,
  verifySession,
  loginSuperadmin,
  loadEmpresa,
  getVendedorEnEmpresa,
  listVendedoresDeEmpresa,
  buildSessionPayload,
  requireJwtSecret
};
