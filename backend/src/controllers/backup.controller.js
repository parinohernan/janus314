const mysqlBackup = require('../services/mysqlBackup.service');
const backupJobs = require('../utils/backupJobs');
const backupMaintenance = require('../utils/backupMaintenance');
const DBManager = require('../utils/DBManager');
const { logInfo, logError } = require('../utils/logger');
const { assertConfirmName } = require('../utils/backupGuards');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function sendError(res, error) {
  const status = error.status || 500;
  if (status >= 500) {
    logError(error, { context: 'backup' });
  }
  return res.status(status).json({
    success: false,
    error: error.message || 'Error interno del servidor'
  });
}

function empresaIdOf(req) {
  return req.empresaData?.id;
}

function createdByOf(req) {
  return req.userData?.userId || null;
}

function snapshotEmpresa(req) {
  const data = req.empresaData;
  if (data && typeof data.toJSON === 'function') {
    return data.toJSON();
  }
  return data;
}

function assertNoActiveJob(empresaId) {
  const active = backupJobs.empresaHasActiveJob(empresaId);
  if (active) {
    throw httpError(409, `Ya hay un ${active.type} en curso. Esperá a que termine.`);
  }
}

function jobOwnedByEmpresa(job, empresaId) {
  return job && String(job.empresaId) === String(empresaId);
}

async function runDumpJob(jobId, empresaData, createdBy) {
  backupJobs.updateJob(jobId, { status: 'running', message: 'Generando dump gzip…' });
  try {
    const meta = await mysqlBackup.dumpToFile(empresaData, {
      createdBy,
      kind: 'manual'
    });
    backupJobs.updateJob(jobId, {
      status: 'done',
      backupId: meta.id,
      message: 'Backup listo'
    });
    logInfo('Backup generado', {
      empresaId: empresaData?.id,
      createdBy,
      backupId: meta.id,
      bytes: meta.bytes
    });
  } catch (error) {
    backupJobs.updateJob(jobId, {
      status: 'error',
      error: error.message,
      message: 'Falló la generación del backup'
    });
    logError(error, { context: 'backup.dump', empresaId: empresaData?.id });
  }
}

async function runRestoreJob(jobId, empresaData, createdBy, filePath, { deleteUpload } = {}) {
  const empresaId = empresaData?.id;
  backupJobs.updateJob(jobId, { status: 'running', message: 'Generando dump de seguridad…' });
  try {
    const safety = await mysqlBackup.dumpToFile(empresaData, {
      createdBy,
      kind: 'safety'
    });
    backupJobs.updateJob(jobId, {
      message: 'Restaurando base de datos…',
      backupId: safety.id
    });
    backupMaintenance.enterRestore(empresaId);
    await DBManager.closeConnectionForEmpresa(empresaId);
    await mysqlBackup.restoreFromFile(empresaData, filePath);
    backupJobs.updateJob(jobId, {
      status: 'done',
      message: 'Restore terminado. Volvé a entrar a las pantallas del ERP.'
    });
    logInfo('Backup restaurado', {
      empresaId,
      createdBy,
      safetyBackupId: safety.id
    });
  } catch (error) {
    backupJobs.updateJob(jobId, {
      status: 'error',
      error: error.message,
      message: 'Falló la restauración'
    });
    logError(error, { context: 'backup.restore', empresaId });
  } finally {
    backupMaintenance.leaveRestore(empresaId);
    if (deleteUpload) {
      try {
        const fsp = require('fs/promises');
        await fsp.unlink(filePath);
      } catch {
        // ignore
      }
    }
  }
}

exports.listar = async (req, res) => {
  try {
    const items = await mysqlBackup.listBackups(empresaIdOf(req));
    res.json({ success: true, data: items });
  } catch (error) {
    sendError(res, error);
  }
};

exports.crear = async (req, res) => {
  try {
    const empresaId = empresaIdOf(req);
    assertNoActiveJob(empresaId);
    const job = backupJobs.createJob({
      empresaId,
      type: 'dump',
      createdBy: createdByOf(req)
    });
    setImmediate(() => {
      runDumpJob(job.id, snapshotEmpresa(req), createdByOf(req));
    });
    res.status(202).json({
      success: true,
      data: backupJobs.publicJob(job)
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.obtenerJob = async (req, res) => {
  try {
    const job = backupJobs.getJob(req.params.jobId);
    if (!jobOwnedByEmpresa(job, empresaIdOf(req))) {
      throw httpError(404, 'Trabajo no encontrado');
    }
    res.json({ success: true, data: backupJobs.publicJob(job) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.descargar = async (req, res) => {
  try {
    const found = await mysqlBackup.resolveBackupFile(empresaIdOf(req), req.params.id);
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${found.filename}"`);
    res.setHeader('Content-Length', String(found.bytes));
    const fs = require('fs');
    const stream = fs.createReadStream(found.filePath);
    stream.on('error', (error) => {
      logError(error, { context: 'backup.download', empresaId: empresaIdOf(req) });
      if (!res.headersSent) {
        sendError(res, error);
      } else {
        res.destroy(error);
      }
    });
    stream.pipe(res);
  } catch (error) {
    sendError(res, error);
  }
};

exports.restaurar = async (req, res) => {
  try {
    const empresaId = empresaIdOf(req);
    assertConfirmName(req.empresaData?.nombre, req.body?.confirmName);
    assertNoActiveJob(empresaId);
    const found = await mysqlBackup.resolveBackupFile(empresaId, req.params.id);
    const job = backupJobs.createJob({
      empresaId,
      type: 'restore',
      createdBy: createdByOf(req)
    });
    setImmediate(() => {
      runRestoreJob(job.id, snapshotEmpresa(req), createdByOf(req), found.filePath);
    });
    res.status(202).json({
      success: true,
      data: backupJobs.publicJob(job)
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.restaurarUpload = async (req, res) => {
  const uploaded = req.file;
  try {
    if (!uploaded || !uploaded.path) {
      throw httpError(400, 'Subí un archivo .sql.gz');
    }
    const original = String(uploaded.originalname || '').toLowerCase();
    if (!original.endsWith('.gz')) {
      throw httpError(400, 'Solo se aceptan archivos .sql.gz');
    }
    await mysqlBackup.assertGzipFile(uploaded.path);
    const empresaId = empresaIdOf(req);
    assertConfirmName(req.empresaData?.nombre, req.body?.confirmName);
    assertNoActiveJob(empresaId);
    const job = backupJobs.createJob({
      empresaId,
      type: 'restore',
      createdBy: createdByOf(req)
    });
    setImmediate(() => {
      runRestoreJob(job.id, snapshotEmpresa(req), createdByOf(req), uploaded.path, { deleteUpload: true });
    });
    res.status(202).json({
      success: true,
      data: backupJobs.publicJob(job)
    });
  } catch (error) {
    if (uploaded?.path) {
      try {
        await require('fs/promises').unlink(uploaded.path);
      } catch {
        // ignore
      }
    }
    sendError(res, error);
  }
};
