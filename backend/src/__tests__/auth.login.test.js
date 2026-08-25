process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JANUS_SUPERADMIN_USER = 'janus';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const request = require('supertest');

jest.mock('../models/cuentaAcceso.model', () => {
  const model = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    BCRYPT_ROUNDS: 4
  };
  return model;
});

jest.mock('../models/Empresa', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn(),
  associations: {},
  hasMany: jest.fn()
}));

jest.mock('../utils/DBManager', () => ({
  getConnectionWithConfig: jest.fn(),
  closeConnectionForEmpresa: jest.fn()
}));

jest.mock('../utils/logger', () => ({
  logAuthEvent: jest.fn(),
  logError: jest.fn()
}));

jest.mock('../utils/cache', () => ({
  redis: null,
  enabled: false
}));

jest.mock('../config/masterDB', () => ({
  getConnection: () => ({}),
  testConnection: jest.fn()
}));

const CuentaAcceso = require('../models/cuentaAcceso.model');
const Empresa = require('../models/Empresa');
const DBManager = require('../utils/DBManager');
const authRoutes = require('../routes/auth.routes');

beforeAll(async () => {
  process.env.JANUS_SUPERADMIN_PASSWORD_HASH = await bcrypt.hash('superpass12', 4);
});

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

const empresaActiva = {
  id: '1',
  nombre: 'Test SA',
  db_name: 'db_test',
  estado: 'activo'
};

const vendedorAdmin = {
  Codigo: '001',
  Descripcion: 'Administrador',
  Activo: 1,
  Permisos: 'admin'
};

function mockTenantQuery(rows) {
  const query = jest.fn().mockResolvedValue(rows);
  DBManager.getConnectionWithConfig.mockResolvedValue({
    QueryTypes: { SELECT: 'SELECT' },
    query
  });
  return query;
}

describe('POST /api/auth/login', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    Empresa.findByPk.mockResolvedValue(empresaActiva);
  });

  test('acepta usuario y password hasheada y emite JWT de ERP', async () => {
    const passwordHash = await bcrypt.hash('secret1234', 4);
    CuentaAcceso.findOne.mockResolvedValue({
      password_hash: passwordHash,
      empresa_id: '1',
      vendedor_codigo: '001',
      update: jest.fn().mockResolvedValue(true)
    });
    mockTenantQuery([vendedorAdmin]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'Hernan', password: 'secret1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.id).toBe('001');
    expect(res.body.empresa.id).toBe('1');
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded).toMatchObject({ userId: '001', empresaId: '1' });
    expect(CuentaAcceso.findOne).toHaveBeenCalledWith({
      where: { usuario: 'hernan', activo: true }
    });
  });

  test('rechaza password incorrecta con el mismo mensaje', async () => {
    const passwordHash = await bcrypt.hash('secret1234', 4);
    CuentaAcceso.findOne.mockResolvedValue({
      password_hash: passwordHash,
      empresa_id: '1',
      vendedor_codigo: '001',
      update: jest.fn()
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'hernan', password: 'otra-clave' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  test('rechaza usuario inexistente con el mismo mensaje', async () => {
    CuentaAcceso.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'nadie', password: 'secret1234' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  test('rechaza vendedor que no es admin', async () => {
    const passwordHash = await bcrypt.hash('secret1234', 4);
    CuentaAcceso.findOne.mockResolvedValue({
      password_hash: passwordHash,
      empresa_id: '1',
      vendedor_codigo: '002',
      update: jest.fn()
    });
    mockTenantQuery([{ Codigo: '002', Descripcion: 'Vendedor', Activo: 1, Permisos: 'vendor' }]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'hernan', password: 'secret1234' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/administradores/i);
  });

  test('rechaza empresa inactiva', async () => {
    const passwordHash = await bcrypt.hash('secret1234', 4);
    CuentaAcceso.findOne.mockResolvedValue({
      password_hash: passwordHash,
      empresa_id: '1',
      vendedor_codigo: '001',
      update: jest.fn()
    });
    Empresa.findByPk.mockResolvedValue({ ...empresaActiva, estado: 'inactivo' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'hernan', password: 'secret1234' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Empresa inactiva');
  });
});

describe('POST /api/auth/online/login', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    Empresa.findByPk.mockResolvedValue(empresaActiva);
  });

  test('acepta empresa + usuario + clave de t_vendedores', async () => {
    mockTenantQuery([vendedorAdmin]);

    const res = await request(app)
      .post('/api/auth/online/login')
      .send({ empresa: '1', usuario: '001', password: '1234' });

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('001');
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.empresaId).toBe('1');
  });

  test('rechaza credenciales legacy inválidas', async () => {
    mockTenantQuery([]);

    const res = await request(app)
      .post('/api/auth/online/login')
      .send({ empresa: '1', usuario: '001', password: 'mala' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });
});

describe('POST /api/auth/superadmin/login', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  test('emite JWT con isAdmin', async () => {
    const res = await request(app)
      .post('/api/auth/superadmin/login')
      .send({ usuario: 'janus', password: 'superpass12' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.isAdmin).toBe(true);
  });

  test('rechaza password de superadmin inválida', async () => {
    const res = await request(app)
      .post('/api/auth/superadmin/login')
      .send({ usuario: 'janus', password: 'nope' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });
});
