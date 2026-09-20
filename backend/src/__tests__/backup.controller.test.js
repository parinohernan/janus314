jest.mock('../services/mysqlBackup.service', () => ({
  listBackups: jest.fn(),
  dumpToFile: jest.fn(),
  resolveBackupFile: jest.fn(),
  restoreFromFile: jest.fn(),
  assertGzipFile: jest.fn(),
  uploadMaxBytes: () => 512 * 1024 * 1024
}));
jest.mock('../utils/DBManager', () => ({
  closeConnectionForEmpresa: jest.fn().mockResolvedValue(undefined)
}));

const mysqlBackup = require('../services/mysqlBackup.service');
const backupJobs = require('../utils/backupJobs');
const backupController = require('../controllers/backup.controller');

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

function reqRestore(confirmName) {
  return {
    params: { id: 'bk-1' },
    body: { confirmName },
    empresaData: { id: 'emp-1', nombre: 'Acme SA' },
    userData: { userId: 'superadm' }
  };
}

describe('backup.controller restaurar', () => {
  afterEach(() => {
    backupJobs.resetForTests();
    jest.clearAllMocks();
  });

  it('si el nombre no coincide responde 400 y no restaura', async () => {
    const res = mockRes();
    await backupController.restaurar(reqRestore('otra'), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/no coincide/);
    expect(mysqlBackup.resolveBackupFile).not.toHaveBeenCalled();
    expect(mysqlBackup.restoreFromFile).not.toHaveBeenCalled();
  });
});
