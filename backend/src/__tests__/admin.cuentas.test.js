process.env.JWT_SECRET = 'test-jwt-secret';

const jwt = require('jsonwebtoken');
const express = require('express');
const request = require('supertest');

jest.mock('../models/cuentaAcceso.model', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  BCRYPT_ROUNDS: 4,
  associations: { empresa: true }
}));

jest.mock('../models/Empresa', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn(),
  associations: { cuentasAcceso: true },
  hasMany: jest.fn()
}));

jest.mock('../utils/DBManager', () => ({
  getConnectionWithConfig: jest.fn(),
  getPoolStatus: jest.fn()
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

jest.mock('../scripts/validate-schemas', () => ({
  validateAllSchemas: jest.fn()
}));

const CuentaAcceso = require('../models/cuentaAcceso.model');
const Empresa = require('../models/Empresa');
const DBManager = require('../utils/DBManager');
const adminRoutes = require('../routes/admin.routes');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  return app;
}

function adminToken() {
  return jwt.sign({ isAdmin: true, usuario: 'janus' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function erpToken() {
  return jwt.sign({ userId: '001', empresaId: '1', nombre: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('CRUD /api/admin/cuentas', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    Empresa.findByPk.mockResolvedValue({
      id: '1',
      nombre: 'Test SA',
      db_name: 'db_test',
      estado: 'activo'
    });
    DBManager.getConnectionWithConfig.mockResolvedValue({
      QueryTypes: { SELECT: 'SELECT' },
      query: jest.fn().mockResolvedValue([
        { Codigo: '001', Descripcion: 'Administrador', Activo: 1, Permisos: 'admin' }
      ])
    });
  });

  test('rechaza token de ERP sin isAdmin', async () => {
    const res = await request(app)
      .get('/api/admin/cuentas')
      .set('Authorization', `Bearer ${erpToken()}`);

    expect(res.status).toBe(403);
  });

  test('lista cuentas sin password_hash', async () => {
    CuentaAcceso.findAll.mockResolvedValue([
      {
        toJSON: () => ({
          id: 'c1',
          usuario: 'hernan',
          empresa_id: '1',
          vendedor_codigo: '001',
          activo: true,
          password_hash: 'should-not-leak'
        })
      }
    ]);

    const res = await request(app)
      .get('/api/admin/cuentas')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].usuario).toBe('hernan');
    expect(res.body.data[0].password_hash).toBeUndefined();
  });

  test('crea cuenta si el vendedor existe', async () => {
    CuentaAcceso.create.mockImplementation(async (data) => ({
      ...data,
      toJSON() {
        const values = { ...data };
        delete values.password_hash;
        return values;
      }
    }));

    const res = await request(app)
      .post('/api/admin/cuentas')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        usuario: 'hernan',
        password: 'secret1234',
        empresa_id: '1',
        vendedor_codigo: '001'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.usuario).toBe('hernan');
    expect(res.body.data.password_hash).toBeUndefined();
    expect(CuentaAcceso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: 'hernan',
        empresa_id: '1',
        vendedor_codigo: '001',
        password_hash: 'secret1234'
      })
    );
  });

  test('rechaza password corta', async () => {
    const res = await request(app)
      .post('/api/admin/cuentas')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        usuario: 'hernan',
        password: 'corta',
        empresa_id: '1',
        vendedor_codigo: '001'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 caracteres/);
  });

  test('reset de password', async () => {
    const save = jest.fn().mockResolvedValue(true);
    CuentaAcceso.findByPk.mockResolvedValue({
      id: 'c1',
      usuario: 'hernan',
      password_hash: 'old',
      save,
      toJSON() {
        return { id: 'c1', usuario: 'hernan', activo: true };
      }
    });

    const res = await request(app)
      .patch('/api/admin/cuentas/c1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ password: 'nuevaClave9' });

    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalled();
  });
});
