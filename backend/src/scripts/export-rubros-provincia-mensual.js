#!/usr/bin/env node
/**
 * Genera PDFs del informe Rubros por Provincia y los guarda en disco
 * (opcionalmente sincroniza a Google Drive vía rclone).
 *
 * Configuración (prioridad):
 *   1) t_configuracion de la empresa (reportes_auto_*)
 *   2) variables de entorno CONTADOR_*
 *
 * Uso:
 *   npm run job:rubros-provincia
 *   npm run job:rubros-provincia -- --desde 2026-07-01 --hasta 2026-07-31
 *   npm run job:rubros-provincia -- --tipo facturas
 *   npm run job:rubros-provincia -- --force
 */

require('dotenv').config();

const { initializeDatabase } = require('../config/init');
const Empresa = require('../models/Empresa');
const DBManager = require('../utils/DBManager');
const initializeModels = require('../utils/modelInitializer');
const {
  TIPOS_VALIDOS,
  leerConfigReportesAuto,
  exportarRubrosProvinciaADisco
} = require('../services/reportesAuto.service');

function printHelp() {
  console.log(`
Export mensual: informe Rubros por Provincia

Uso:
  node src/scripts/export-rubros-provincia-mensual.js [opciones]

Opciones:
  --desde YYYY-MM-DD   Inicio del período (default: 1º del mes anterior)
  --hasta YYYY-MM-DD   Fin del período (default: último día del mes anterior)
  --tipo  VALOR        facturas | notasCredito | ambos (default: ambos)
  --force              Generar aunque reportes_auto_enabled esté en 0
  --empresa ID         Solo esta empresa (default: CONTADOR_EMPRESA_ID o todas activas con enabled=1)
  -h, --help           Mostrar ayuda

Config UI: /configuracion/reportes
Env fallback: CONTADOR_EMPRESA_ID, CONTADOR_REPORTS_DIR, CONTADOR_RCLONE_REMOTE
`);
}

function parseArgs(argv) {
  const args = { tipo: 'ambos', force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--help' || flag === '-h') {
      args.help = true;
    } else if (flag === '--desde') {
      args.desde = argv[++i];
    } else if (flag === '--hasta') {
      args.hasta = argv[++i];
    } else if (flag === '--tipo') {
      args.tipo = argv[++i];
    } else if (flag === '--force') {
      args.force = true;
    } else if (flag === '--empresa') {
      args.empresa = argv[++i];
    } else {
      throw new Error(`Argumento desconocido: ${flag}`);
    }
  }
  return args;
}

async function resolverEmpresas(args) {
  if (args.empresa || process.env.CONTADOR_EMPRESA_ID) {
    const id = args.empresa || process.env.CONTADOR_EMPRESA_ID;
    const empresa = await Empresa.findByPk(id);
    if (!empresa) {
      throw new Error(`Empresa no encontrada: ${id}`);
    }
    if (empresa.estado !== 'activo') {
      throw new Error(`Empresa inactiva: ${id}`);
    }
    return [empresa];
  }

  const activas = await Empresa.findAll({ where: { estado: 'activo' } });
  return activas;
}

async function procesarEmpresa(empresa, args) {
  const db = await DBManager.getConnection(empresa.id);
  const models = initializeModels(db);
  const ctx = { db, models };
  const cfg = await leerConfigReportesAuto(models);

  if (!cfg.enabled && !args.force) {
    console.log(`— Skip ${empresa.nombre} (${empresa.id}): reportes_auto_enabled ≠ 1`);
    return null;
  }

  if (!cfg.reportsDir) {
    throw new Error(
      `Empresa ${empresa.nombre}: falta reportes_auto_dir (o CONTADOR_REPORTS_DIR)`
    );
  }

  console.log(`=== Export Rubros-Provincia: ${empresa.nombre} (${empresa.id}) ===`);
  const result = await exportarRubrosProvinciaADisco(ctx, {
    fechaDesde: args.desde,
    fechaHasta: args.hasta,
    tipo: args.tipo,
    force: args.force,
    requireEnabled: false
  });

  for (const file of result.files) {
    console.log(`OK: ${file.path} (total=${file.totalVentas}, provincias=${file.provincias})`);
  }
  if (result.rclone) {
    console.log(`rclone → ${result.rclone.remote}`);
    if (result.rclone.stdout) console.log(result.rclone.stdout);
    if (result.rclone.stderr) console.warn(result.rclone.stderr);
  } else {
    console.log('Sin remoto rclone: solo disco local');
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!TIPOS_VALIDOS.has(args.tipo)) {
    throw new Error(`--tipo inválido: ${args.tipo} (usar facturas|notasCredito|ambos)`);
  }

  await initializeDatabase();
  const empresas = await resolverEmpresas(args);
  if (!empresas.length) {
    throw new Error('No hay empresas activas para procesar');
  }

  let processed = 0;
  for (const empresa of empresas) {
    const result = await procesarEmpresa(empresa, args);
    if (result) processed += 1;
  }

  if (processed === 0) {
    console.log(
      'Ninguna empresa procesada. Activá reportes en /configuracion/reportes o usá --force / CONTADOR_EMPRESA_ID.'
    );
  } else {
    console.log(`Listo: ${processed} empresa(s) exportada(s).`);
  }
}

main()
  .then(async () => {
    try {
      await DBManager.shutdown();
    } catch (e) {
      console.warn('Aviso al cerrar DBManager:', e.message);
    }
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Error en export-rubros-provincia-mensual:', error.message);
    console.error(error.stack);
    try {
      await DBManager.shutdown();
    } catch (_) {
      /* ignore */
    }
    process.exit(1);
  });
