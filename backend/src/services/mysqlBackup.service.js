const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

function backupRootDir() {
  return process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
}

function keepCount() {
  const n = parseInt(process.env.BACKUP_KEEP || '5', 10);
  return Number.isFinite(n) && n > 0 ? n : 5;
}

function mysqldumpBin() {
  return process.env.MYSQLDUMP_PATH || 'mysqldump';
}

function mysqlBin() {
  return process.env.MYSQL_PATH || 'mysql';
}

function uploadMaxBytes() {
  const mb = parseInt(process.env.BACKUP_UPLOAD_MAX_MB || '512', 10);
  return (Number.isFinite(mb) && mb > 0 ? mb : 512) * 1024 * 1024;
}

function safeEmpresaId(empresaId) {
  return String(empresaId || 'empresa').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function empresaDir(empresaId) {
  return path.join(backupRootDir(), safeEmpresaId(empresaId));
}

function credsFromEmpresa(empresaData) {
  const row = empresaData && typeof empresaData.toJSON === 'function'
    ? empresaData.toJSON()
    : empresaData || {};
  return {
    id: row.id,
    nombre: row.nombre,
    db_name: row.db_name,
    db_user: row.db_user,
    db_password: row.db_password,
    db_host: row.db_host || '127.0.0.1',
    db_port: row.db_port || 3306
  };
}

function timestampId(now = new Date()) {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeCnfValue(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function writeDefaultsFile(creds) {
  const file = path.join(os.tmpdir(), `janus-mysql-${crypto.randomBytes(8).toString('hex')}.cnf`);
  const content = [
    '[client]',
    `user=${creds.db_user}`,
    `password="${escapeCnfValue(creds.db_password)}"`,
    `host=${creds.db_host}`,
    `port=${creds.db_port}`,
    'default-character-set=utf8mb4',
    ''
  ].join('\n');
  await fsp.writeFile(file, content, { encoding: 'utf8', mode: 0o600 });
  return file;
}

async function removeFileQuiet(file) {
  if (!file) return;
  try {
    await fsp.unlink(file);
  } catch {
    // ignore
  }
}

function isGzipBuffer(buf) {
  return Boolean(buf && buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b);
}

async function assertGzipFile(filePath) {
  const fh = await fsp.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(2);
    const { bytesRead } = await fh.read(buf, 0, 2, 0);
    if (bytesRead < 2 || !isGzipBuffer(buf)) {
      const err = new Error('El archivo no es un backup gzip válido (.sql.gz)');
      err.status = 400;
      throw err;
    }
  } finally {
    await fh.close();
  }
}

function waitChildExit(child, name) {
  return new Promise((resolve, reject) => {
    let stderr = '';
    let settled = false;
    const finish = (fn) => {
      if (settled) return;
      settled = true;
      fn();
    };
    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
        if (stderr.length > 8000) {
          stderr = stderr.slice(-8000);
        }
      });
    }
    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        const hint = name === 'mysqldump' ? 'MYSQLDUMP_PATH' : 'MYSQL_PATH';
        const wrapped = new Error(`No se encontró ${name}. Configurá ${hint} en el servidor.`);
        wrapped.status = 500;
        finish(() => reject(wrapped));
        return;
      }
      finish(() => reject(err));
    });
    child.on('close', (code) => {
      if (code === 0) {
        finish(() => resolve());
        return;
      }
      finish(() => reject(new Error(`${name} salió con código ${code}${stderr ? `: ${stderr.trim()}` : ''}`)));
    });
  });
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function writeMeta(metaPath, meta) {
  await fsp.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
}

async function readMeta(metaPath) {
  try {
    const raw = await fsp.readFile(metaPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function createMysqlBackupService({ spawnFn = spawn } = {}) {
  async function ensureEmpresaDir(empresaId) {
    const dir = empresaDir(empresaId);
    await fsp.mkdir(dir, { recursive: true });
    return dir;
  }

  function backupPaths(dir, id) {
    const filename = `janus-${id}.sql.gz`;
    return {
      filename,
      filePath: path.join(dir, filename),
      metaPath: path.join(dir, `janus-${id}.json`)
    };
  }

  async function applyRetention(empresaId) {
    const dir = empresaDir(empresaId);
    let entries;
    try {
      entries = await fsp.readdir(dir);
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
    const dumps = [];
    for (const name of entries) {
      if (!name.endsWith('.sql.gz')) continue;
      const filePath = path.join(dir, name);
      const stat = await fsp.stat(filePath);
      dumps.push({ name, filePath, mtime: stat.mtimeMs });
    }
    dumps.sort((a, b) => b.mtime - a.mtime);
    const keep = keepCount();
    const removed = [];
    for (const extra of dumps.slice(keep)) {
      await removeFileQuiet(extra.filePath);
      await removeFileQuiet(extra.filePath.replace(/\.sql\.gz$/, '.json'));
      removed.push(extra.name);
    }
    return removed;
  }

  async function dumpToFile(empresaData, { createdBy, kind = 'manual' } = {}) {
    const creds = credsFromEmpresa(empresaData);
    if (!creds.db_name) {
      const err = new Error('La empresa no tiene db_name configurado');
      err.status = 500;
      throw err;
    }
    const dir = await ensureEmpresaDir(creds.id);
    const stamp = timestampId();
    let id = kind === 'safety' ? `${stamp}-safety` : stamp;
    let paths = backupPaths(dir, id);
    if (fs.existsSync(paths.filePath)) {
      id = `${id}-${crypto.randomBytes(2).toString('hex')}`;
      paths = backupPaths(dir, id);
    }

    const cnf = await writeDefaultsFile(creds);
    const dumpArgs = [
      `--defaults-extra-file=${cnf}`,
      '--single-transaction',
      '--quick',
      '--routines',
      '--triggers',
      '--hex-blob',
      '--default-character-set=utf8mb4',
      '--no-tablespaces',
      creds.db_name
    ];

    try {
      const child = spawnFn(mysqldumpBin(), dumpArgs, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      const gzip = zlib.createGzip({ level: 6 });
      const out = fs.createWriteStream(paths.filePath);
      const exitPromise = waitChildExit(child, 'mysqldump');
      exitPromise.catch(() => {
        try { child.stdout?.destroy(); } catch { /* ignore */ }
        try { gzip.destroy(); } catch { /* ignore */ }
        try { out.destroy(); } catch { /* ignore */ }
      });
      try {
        if (!child.stdout) {
          await exitPromise;
          throw new Error('mysqldump no produjo salida');
        }
        await Promise.all([
          pipeline(child.stdout, gzip, out),
          exitPromise
        ]);
      } catch (err) {
        await removeFileQuiet(paths.filePath);
        throw err;
      }

      const stat = await fsp.stat(paths.filePath);
      if (stat.size < 20) {
        await removeFileQuiet(paths.filePath);
        throw new Error('El dump quedó vacío. Revisá MYSQLDUMP_PATH y el acceso a MySQL.');
      }
      await assertGzipFile(paths.filePath);
      const sha256 = await sha256File(paths.filePath);
      const meta = {
        id,
        filename: paths.filename,
        empresaId: creds.id,
        empresaNombre: creds.nombre,
        dbName: creds.db_name,
        createdAt: new Date().toISOString(),
        createdBy: createdBy || null,
        bytes: stat.size,
        sha256,
        kind
      };
      await writeMeta(paths.metaPath, meta);
      await applyRetention(creds.id);
      return meta;
    } finally {
      await removeFileQuiet(cnf);
    }
  }

  async function listBackups(empresaId) {
    const dir = empresaDir(empresaId);
    let entries;
    try {
      entries = await fsp.readdir(dir);
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
    const items = [];
    for (const name of entries) {
      if (!name.endsWith('.sql.gz')) continue;
      const filePath = path.join(dir, name);
      const metaPath = filePath.replace(/\.sql\.gz$/, '.json');
      const stat = await fsp.stat(filePath);
      const meta = await readMeta(metaPath);
      const id = meta?.id || name.replace(/^janus-/, '').replace(/\.sql\.gz$/, '');
      items.push({
        id,
        filename: name,
        bytes: stat.size,
        createdAt: meta?.createdAt || stat.mtime.toISOString(),
        createdBy: meta?.createdBy || null,
        sha256: meta?.sha256 || null,
        kind: meta?.kind || (name.includes('-safety') ? 'safety' : 'manual'),
        empresaNombre: meta?.empresaNombre || null,
        dbName: meta?.dbName || null
      });
    }
    items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return items;
  }

  async function resolveBackupFile(empresaId, backupId) {
    const list = await listBackups(empresaId);
    const found = list.find((item) => item.id === backupId || item.filename === backupId);
    if (!found) {
      const err = new Error('Backup no encontrado');
      err.status = 404;
      throw err;
    }
    const filePath = path.join(empresaDir(empresaId), found.filename);
    await assertGzipFile(filePath);
    return { ...found, filePath };
  }

  async function restoreFromFile(empresaData, filePath) {
    const creds = credsFromEmpresa(empresaData);
    if (!creds.db_name) {
      const err = new Error('La empresa no tiene db_name configurado');
      err.status = 500;
      throw err;
    }
    await assertGzipFile(filePath);
    const cnf = await writeDefaultsFile(creds);
    const mysqlArgs = [
      `--defaults-extra-file=${cnf}`,
      '--default-character-set=utf8mb4',
      '--max-allowed-packet=512M',
      creds.db_name
    ];
    try {
      const child = spawnFn(mysqlBin(), mysqlArgs, {
        windowsHide: true,
        stdio: ['pipe', 'ignore', 'pipe']
      });
      const gunzip = zlib.createGunzip();
      const input = fs.createReadStream(filePath);
      const exitPromise = waitChildExit(child, 'mysql');
      exitPromise.catch(() => {
        try { child.stdin?.destroy(); } catch { /* ignore */ }
        try { gunzip.destroy(); } catch { /* ignore */ }
        try { input.destroy(); } catch { /* ignore */ }
      });
      try {
        if (!child.stdin) {
          await exitPromise;
          throw new Error('mysql no aceptó entrada');
        }
        await Promise.all([
          pipeline(input, gunzip, child.stdin),
          exitPromise
        ]);
      } catch (err) {
        try {
          child.kill();
        } catch {
          // ignore
        }
        throw err;
      }
    } finally {
      await removeFileQuiet(cnf);
    }
  }

  return {
    dumpToFile,
    listBackups,
    resolveBackupFile,
    restoreFromFile,
    applyRetention,
    assertGzipFile,
    empresaDir,
    uploadMaxBytes,
    credsFromEmpresa,
    keepCount
  };
}

const defaultService = createMysqlBackupService();

module.exports = defaultService;
module.exports.createMysqlBackupService = createMysqlBackupService;
module.exports.credsFromEmpresa = credsFromEmpresa;
module.exports.isGzipBuffer = isGzipBuffer;
module.exports.assertGzipFile = assertGzipFile;
module.exports.uploadMaxBytes = uploadMaxBytes;
module.exports.keepCount = keepCount;
module.exports.timestampId = timestampId;
module.exports.escapeCnfValue = escapeCnfValue;
