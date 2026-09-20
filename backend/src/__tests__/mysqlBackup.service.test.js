const { EventEmitter } = require('events');
const { PassThrough } = require('stream');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { createMysqlBackupService, assertGzipFile } = require('../services/mysqlBackup.service');
const { assertConfirmName } = require('../utils/backupGuards');
const backupMaintenance = require('../utils/backupMaintenance');
const backupJobs = require('../utils/backupJobs');

const empresa = {
  id: 'emp-test',
  nombre: 'Acme SA',
  db_name: 'db_acme',
  db_user: 'root',
  db_password: 'secret',
  db_host: '127.0.0.1',
  db_port: 3306
};

function makeDumpSpawn({ sql = '-- janus dump\nCREATE TABLE t (id INT);\n', exitCode = 0, enoent = false } = {}) {
  return function spawnFn() {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new PassThrough();
    child.kill = () => {};
    if (enoent) {
      process.nextTick(() => {
        const err = new Error('spawn ENOENT');
        err.code = 'ENOENT';
        child.emit('error', err);
      });
      return child;
    }
    process.nextTick(() => {
      child.stdout.write(sql);
      child.stdout.end();
      child.stderr.end();
      setTimeout(() => child.emit('close', exitCode), 15);
    });
    return child;
  };
}

function makeRestoreSpawn({ exitCode = 0, captured = [], enoent = false } = {}) {
  return function spawnFn() {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new PassThrough();
    child.kill = () => {};
    const chunks = [];
    child.stdin.on('data', (c) => chunks.push(Buffer.from(c)));
    child.stdin.on('end', () => {
      captured.push(Buffer.concat(chunks).toString());
      setTimeout(() => child.emit('close', exitCode), 5);
    });
    if (enoent) {
      process.nextTick(() => {
        const err = new Error('spawn ENOENT');
        err.code = 'ENOENT';
        child.emit('error', err);
      });
    }
    return child;
  };
}

describe('mysqlBackup.service', () => {
  let tmp;

  beforeEach(async () => {
    tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'janus-backup-test-'));
    process.env.BACKUP_DIR = tmp;
    process.env.BACKUP_KEEP = '5';
  });

  afterEach(async () => {
    delete process.env.BACKUP_DIR;
    delete process.env.BACKUP_KEEP;
    await fsp.rm(tmp, { recursive: true, force: true });
  });

  it('genera un gzip a disco con spawn mockeado', async () => {
    const service = createMysqlBackupService({ spawnFn: makeDumpSpawn() });
    const meta = await service.dumpToFile(empresa, { createdBy: 'admin' });
    expect(meta.filename).toMatch(/\.sql\.gz$/);
    expect(meta.kind).toBe('manual');
    expect(meta.createdBy).toBe('admin');
    expect(meta.bytes).toBeGreaterThan(20);
    const filePath = path.join(tmp, 'emp-test', meta.filename);
    await assertGzipFile(filePath);
    const list = await service.listBackups(empresa.id);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(meta.id);
  });

  it('rechaza un archivo que no es gzip', async () => {
    const fake = path.join(tmp, 'nope.sql.gz');
    await fsp.writeFile(fake, 'not gzip');
    await expect(assertGzipFile(fake)).rejects.toMatchObject({ status: 400 });
  });

  it('al restaurar envía el SQL descomprimido a mysql', async () => {
    const captured = [];
    const dumpService = createMysqlBackupService({ spawnFn: makeDumpSpawn({ sql: 'SELECT 42;\n' }) });
    const meta = await dumpService.dumpToFile(empresa);
    const filePath = path.join(tmp, 'emp-test', meta.filename);
    const restoreService = createMysqlBackupService({ spawnFn: makeRestoreSpawn({ captured }) });
    await restoreService.restoreFromFile(empresa, filePath);
    expect(captured.join('')).toContain('SELECT 42;');
  });

  it('no llama mysql si el archivo no es gzip', async () => {
    const captured = [];
    const restoreService = createMysqlBackupService({ spawnFn: makeRestoreSpawn({ captured }) });
    const fake = path.join(tmp, 'bad.sql.gz');
    await fsp.writeFile(fake, 'plain');
    await expect(restoreService.restoreFromFile(empresa, fake)).rejects.toMatchObject({ status: 400 });
    expect(captured).toHaveLength(0);
  });

  it('con 6 dumps deja 5', async () => {
    const service = createMysqlBackupService({ spawnFn: makeDumpSpawn() });
    const dir = path.join(tmp, 'emp-test');
    await fsp.mkdir(dir, { recursive: true });
    const payload = zlib.gzipSync(Buffer.from('-- x\n'));
    for (let i = 0; i < 6; i += 1) {
      const name = `janus-2020010${i}T000000Z.sql.gz`;
      const filePath = path.join(dir, name);
      await fsp.writeFile(filePath, payload);
      const past = new Date(Date.now() - (6 - i) * 1000);
      await fsp.utimes(filePath, past, past);
    }
    const removed = await service.applyRetention(empresa.id);
    expect(removed).toHaveLength(1);
    const left = (await fsp.readdir(dir)).filter((n) => n.endsWith('.sql.gz'));
    expect(left).toHaveLength(5);
  });

  it('explica MYSQLDUMP_PATH si el binario no existe', async () => {
    const service = createMysqlBackupService({ spawnFn: makeDumpSpawn({ enoent: true }) });
    await expect(service.dumpToFile(empresa)).rejects.toThrow(/MYSQLDUMP_PATH/);
  });
});

describe('assertConfirmName', () => {
  it('acepta el nombre exacto', () => {
    expect(() => assertConfirmName('Acme SA', 'Acme SA')).not.toThrow();
  });

  it('rechaza un nombre distinto y no sigue', () => {
    expect(() => assertConfirmName('Acme SA', 'otra')).toThrow(/no coincide/);
    try {
      assertConfirmName('Acme SA', 'otra');
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });
});

describe('backupMaintenance / backupJobs', () => {
  afterEach(() => {
    backupMaintenance.resetForTests();
    backupJobs.resetForTests();
  });

  it('reconoce rutas de backup y 503 al resto durante restore', () => {
    expect(backupMaintenance.isBackupApiPath('/api/backups')).toBe(true);
    expect(backupMaintenance.isBackupApiPath('/api/backups/jobs/abc')).toBe(true);
    expect(backupMaintenance.isBackupApiPath('/api/facturas')).toBe(false);
    backupMaintenance.enterRestore('emp-1');
    expect(backupMaintenance.isRestoring('emp-1')).toBe(true);
    backupMaintenance.leaveRestore('emp-1');
    expect(backupMaintenance.isRestoring('emp-1')).toBe(false);
  });

  it('detecta un job activo por empresa', () => {
    const job = backupJobs.createJob({ empresaId: 'emp-1', type: 'dump', createdBy: 'admin' });
    expect(backupJobs.empresaHasActiveJob('emp-1').id).toBe(job.id);
    backupJobs.updateJob(job.id, { status: 'done' });
    expect(backupJobs.empresaHasActiveJob('emp-1')).toBeNull();
  });
});
