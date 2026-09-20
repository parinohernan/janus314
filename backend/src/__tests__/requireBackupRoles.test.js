const requireSuperadm = require('../middleware/requireSuperadm');
const requireAdminOrSuperadm = require('../middleware/requireAdminOrSuperadm');

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

function run(middleware, req) {
  const res = mockRes();
  let nextCalled = false;
  middleware(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

describe('requireSuperadm', () => {
  it('responde 401 si no hay userData', () => {
    const { res, nextCalled } = run(requireSuperadm, {});
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('responde 403 si el vendedor es admin', () => {
    const { res, nextCalled } = run(requireSuperadm, { userData: { userId: 'admin' } });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/superadm/i);
  });

  it('responde 403 si el vendedor es un código cualquiera', () => {
    const { res, nextCalled } = run(requireSuperadm, { userData: { userId: 'vendedor1' } });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it('deja pasar a SUPERADM sin importar mayúsculas', () => {
    expect(run(requireSuperadm, { userData: { userId: 'SUPERADM' } }).nextCalled).toBe(true);
  });

  it('deja pasar si Permisos es superadm aunque el código sea otro', () => {
    expect(
      run(requireSuperadm, { userData: { userId: 'juan', permisos: 'superadm' } }).nextCalled
    ).toBe(true);
  });
});

describe('requireAdminOrSuperadm', () => {
  it('responde 401 si no hay token/userData', () => {
    const { res, nextCalled } = run(requireAdminOrSuperadm, {});
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('deja pasar a admin y a superadm', () => {
    expect(run(requireAdminOrSuperadm, { userData: { userId: 'admin' } }).nextCalled).toBe(true);
    expect(run(requireAdminOrSuperadm, { userData: { userId: 'superadm' } }).nextCalled).toBe(true);
  });

  it('deja pasar a un vendedor con Permisos admin', () => {
    expect(
      run(requireAdminOrSuperadm, { userData: { userId: 'juan', permisos: 'admin' } }).nextCalled
    ).toBe(true);
  });

  it('responde 403 al resto', () => {
    const { res, nextCalled } = run(requireAdminOrSuperadm, { userData: { userId: 'juan' } });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });
});
