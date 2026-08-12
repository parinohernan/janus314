const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { generarPdfBuffer } = require('./informeRubrosProvincia.service');

const execFileAsync = promisify(execFile);

const CONFIG_KEYS = {
  enabled: 'reportes_auto_enabled',
  dir: 'reportes_auto_dir',
  rclone: 'reportes_auto_rclone'
};

const TIPOS_VALIDOS = new Set(['facturas', 'notasCredito', 'ambos']);

function pad2(n) {
  return String(n).padStart(2, '0');
}

function getPreviousMonthRange(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
  const mm = pad2(prevMonth + 1);
  return {
    fechaDesde: `${prevYear}-${mm}-01`,
    fechaHasta: `${prevYear}-${mm}-${pad2(lastDay)}`,
    yearMonth: `${prevYear}-${mm}`
  };
}

function yearMonthFromDesde(fechaDesde) {
  return String(fechaDesde).slice(0, 7);
}

function assertDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    const error = new Error(`${label} inválida (esperado YYYY-MM-DD): ${value}`);
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Lee valores de reportes automáticos desde t_configuracion (+ fallback env).
 * @param {{ Configuracion?: any }} models
 */
async function leerConfigReportesAuto(models = {}) {
  const map = {};
  const { Configuracion } = models;
  if (Configuracion) {
    const rows = await Configuracion.findAll({
      where: {
        Codigo: [CONFIG_KEYS.enabled, CONFIG_KEYS.dir, CONFIG_KEYS.rclone]
      }
    });
    for (const row of rows) {
      map[row.Codigo] = row.ValorConfig != null ? String(row.ValorConfig) : '';
    }
  }

  const enabledRaw = (map[CONFIG_KEYS.enabled] ?? '').trim();
  const enabled = enabledRaw === '1' || enabledRaw.toLowerCase() === 'true' || enabledRaw.toLowerCase() === 'si';

  const reportsDir = (map[CONFIG_KEYS.dir] || process.env.CONTADOR_REPORTS_DIR || '').trim();
  const rcloneRemote = (map[CONFIG_KEYS.rclone] || process.env.CONTADOR_RCLONE_REMOTE || '').trim();

  return {
    enabled,
    reportsDir,
    rcloneRemote,
    raw: map
  };
}

async function syncWithRclone(localDir, remote) {
  const { stdout, stderr } = await execFileAsync(
    'rclone',
    ['copy', localDir, remote, '--create-empty-src-dirs'],
    { maxBuffer: 10 * 1024 * 1024 }
  );
  return { stdout: (stdout || '').trim(), stderr: (stderr || '').trim() };
}

/**
 * Genera PDFs Rubros-Provincia y los guarda (opcional rclone).
 *
 * @param {{ db: any, models: any }} ctx
 * @param {{
 *   fechaDesde?: string,
 *   fechaHasta?: string,
 *   tipo?: string,
 *   force?: boolean,
 *   reportsDir?: string,
 *   rcloneRemote?: string | null,
 *   requireEnabled?: boolean
 * }} options
 */
async function exportarRubrosProvinciaADisco(ctx, options = {}) {
  const tipo = options.tipo || 'ambos';
  if (!TIPOS_VALIDOS.has(tipo)) {
    const error = new Error(`tipo inválido: ${tipo} (usar facturas|notasCredito|ambos)`);
    error.statusCode = 400;
    throw error;
  }

  const cfg = await leerConfigReportesAuto(ctx.models);
  if (options.requireEnabled && !cfg.enabled && !options.force) {
    const error = new Error('Reportes automáticos desactivados (reportes_auto_enabled ≠ 1)');
    error.statusCode = 400;
    throw error;
  }

  const reportsDir = (options.reportsDir || cfg.reportsDir || '').trim();
  if (!reportsDir) {
    const error = new Error(
      'Falta carpeta de salida: configurá reportes_auto_dir en /configuracion/reportes o CONTADOR_REPORTS_DIR'
    );
    error.statusCode = 400;
    throw error;
  }

  let fechaDesde;
  let fechaHasta;
  let yearMonth;

  if (options.fechaDesde || options.fechaHasta) {
    if (!options.fechaDesde || !options.fechaHasta) {
      const error = new Error('Si indicás fechaDesde o fechaHasta, debés pasar ambas');
      error.statusCode = 400;
      throw error;
    }
    assertDate(options.fechaDesde, 'fechaDesde');
    assertDate(options.fechaHasta, 'fechaHasta');
    fechaDesde = options.fechaDesde;
    fechaHasta = options.fechaHasta;
    yearMonth = yearMonthFromDesde(fechaDesde);
  } else {
    const range = getPreviousMonthRange();
    fechaDesde = range.fechaDesde;
    fechaHasta = range.fechaHasta;
    yearMonth = range.yearMonth;
  }

  const outDir = path.join(reportsDir, yearMonth);
  fs.mkdirSync(outDir, { recursive: true });

  const tipos = tipo === 'ambos' ? ['facturas', 'notasCredito'] : [tipo];
  const written = [];

  for (const t of tipos) {
    const { buffer, filename, data } = await generarPdfBuffer(ctx, {
      fechaDesde,
      fechaHasta,
      tipo: t
    });
    const outPath = path.join(outDir, filename);
    fs.writeFileSync(outPath, buffer);
    written.push({
      path: outPath,
      filename,
      tipo: t,
      totalVentas: data.totalVentas,
      provincias: data.provincias.length
    });
  }

  const rcloneRemote =
    options.rcloneRemote === null
      ? ''
      : (options.rcloneRemote !== undefined ? options.rcloneRemote : cfg.rcloneRemote);

  let rclone = null;
  if (rcloneRemote) {
    const remotePath = `${String(rcloneRemote).replace(/\/$/, '')}/${yearMonth}`;
    const result = await syncWithRclone(outDir, remotePath);
    rclone = { remote: remotePath, ...result };
  }

  return {
    periodo: { fechaDesde, fechaHasta, yearMonth },
    outDir,
    files: written,
    rclone,
    config: {
      enabled: cfg.enabled,
      reportsDir,
      rcloneRemote: rcloneRemote || null
    }
  };
}

module.exports = {
  CONFIG_KEYS,
  TIPOS_VALIDOS,
  getPreviousMonthRange,
  leerConfigReportesAuto,
  exportarRubrosProvinciaADisco,
  syncWithRclone
};
