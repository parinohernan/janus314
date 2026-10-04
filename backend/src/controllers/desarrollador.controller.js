const { Op, QueryTypes } = require('sequelize');
const Empresa = require('../models/Empresa');
const mysqlBackup = require('../services/mysqlBackup.service');
const backupJobs = require('../utils/backupJobs');
const { ETAPAS, ETAPAS_DOCUMENTOS_CLIENTE } = require('../utils/resetEtapas');
const optimizacionBase = require('../utils/optimizacionBase');

const DEV_PASSWORD = process.env.DEV_OPTIONS_PASSWORD || 'tel0303456';

function q(nombre) {
  return '`' + String(nombre).replace(/`/g, '``') + '`';
}

function seleccionar(db, sql, replacements, transaction) {
  return db.query(sql, { type: QueryTypes.SELECT, replacements, transaction });
}

async function leerEsquema(db) {
  const schema = db.config.database;
  const tablas = await seleccionar(
    db,
    `SELECT TABLE_NAME AS nombre FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [schema]
  );
  const columnas = await seleccionar(
    db,
    `SELECT TABLE_NAME AS tabla, COLUMN_NAME AS columna FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND COLUMN_NAME IN ('DocumentoTipo', 'DocumentoSucursal')`,
    [schema]
  );
  const fks = await seleccionar(
    db,
    `SELECT DISTINCT TABLE_NAME AS hija, REFERENCED_TABLE_NAME AS madre
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_NAME <> REFERENCED_TABLE_NAME`,
    [schema]
  );

  const existentes = new Set(tablas.map((t) => t.nombre));
  const columnasPorTabla = new Map();
  for (const { tabla, columna } of columnas) {
    const set = columnasPorTabla.get(tabla) || new Set();
    set.add(columna);
    columnasPorTabla.set(tabla, set);
  }
  const conNumeracion = new Set(
    [...columnasPorTabla].filter(([, set]) => set.size === 2).map(([tabla]) => tabla)
  );
  return { existentes, conNumeracion, fks };
}

async function contarFilas(db, tablas) {
  const conteos = new Map();
  for (let i = 0; i < tablas.length; i += 40) {
    const bloque = tablas.slice(i, i + 40);
    if (!bloque.length) continue;
    const sql = bloque
      .map((t, j) => `SELECT ${j} AS i, COUNT(*) AS n FROM ${q(t)}`)
      .join(' UNION ALL ');
    const filas = await seleccionar(db, sql, []);
    for (const { i: j, n } of filas) conteos.set(bloque[Number(j)], Number(n || 0));
  }
  return conteos;
}

async function estadoEtapas(db, esquema) {
  const nombresPorEtapa = ETAPAS.map((etapa) =>
    etapa.prefijo
      ? [...esquema.existentes].filter((t) => t.startsWith(etapa.prefijo)).sort()
      : etapa.tablas.filter((t) => esquema.existentes.has(t))
  );
  const fksHijas = esquema.fks.map((f) => f.hija).filter((t) => esquema.existentes.has(t));
  const conteos = await contarFilas(db, [...new Set([...nombresPorEtapa.flat(), ...fksHijas])]);
  const etapas = [];
  for (const [indice, etapa] of ETAPAS.entries()) {
    const tablas = nombresPorEtapa[indice].map((nombre) => ({ nombre, filas: conteos.get(nombre) }));
    etapas.push({
      id: etapa.id,
      label: etapa.label,
      descripcion: etapa.descripcion,
      requiere: etapa.requiere,
      tablas,
      filas: tablas.reduce((total, t) => total + t.filas, 0),
    });
  }
  return { etapas, conteos };
}

async function empresasQueCompartenBase(empresaData) {
  if (!empresaData?.db_name) return [];
  const otras = await Empresa.findAll({
    attributes: ['id', 'nombre'],
    where: {
      id: { [Op.ne]: empresaData.id },
      db_name: empresaData.db_name,
      db_host: empresaData.db_host,
      estado: 'activo',
    },
    raw: true,
  });
  return otras.map((e) => e.nombre);
}

/** Orden de borrado: el de las etapas, corregido para que toda hija vaya antes que su madre. */
function ordenarParaBorrar(tablas, fks) {
  const set = new Set(tablas);
  const hijasPendientes = new Map(tablas.map((t) => [t, new Set()]));
  for (const { hija, madre } of fks) {
    if (set.has(hija) && set.has(madre)) hijasPendientes.get(madre).add(hija);
  }
  const orden = [];
  const restantes = [...tablas];
  while (restantes.length) {
    const indice = restantes.findIndex((t) => hijasPendientes.get(t).size === 0);
    const elegida = restantes.splice(indice === -1 ? 0 : indice, 1)[0];
    orden.push(elegida);
    for (const pendientes of hijasPendientes.values()) pendientes.delete(elegida);
  }
  return orden;
}

function buscarBloqueos(seleccion, estado, esquema) {
  const porId = new Map(estado.etapas.map((e) => [e.id, e]));
  const bloqueos = [];

  for (const id of seleccion) {
    const etapa = porId.get(id);
    for (const requerida of etapa.requiere) {
      const dependiente = porId.get(requerida);
      if (!seleccion.has(requerida) && dependiente.filas > 0) {
        bloqueos.push(
          `Para borrar "${etapa.label}" primero hay que borrar "${dependiente.label}" (${dependiente.filas} registros).`
        );
      }
    }
  }

  const tablas = new Set();
  const etapaDeTabla = new Map();
  for (const etapa of estado.etapas) {
    for (const t of etapa.tablas) if (!etapaDeTabla.has(t.nombre)) etapaDeTabla.set(t.nombre, etapa);
  }
  for (const id of seleccion) porId.get(id).tablas.forEach((t) => tablas.add(t.nombre));
  for (const { hija, madre } of esquema.fks) {
    if (!tablas.has(madre) || tablas.has(hija)) continue;
    const filas = estado.conteos.get(hija);
    if (filas !== undefined && filas === 0) continue;
    const dependiente = etapaDeTabla.get(hija);
    const etapa = etapaDeTabla.get(madre);
    bloqueos.push(
      dependiente
        ? `Para borrar "${etapa.label}" primero hay que borrar "${dependiente.label}" (${dependiente.filas} registros).`
        : `La tabla ${hija} todavía tiene registros que apuntan a ${madre}.`
    );
  }
  return { bloqueos: [...new Set(bloqueos)], tablas };
}

async function obtenerEstadoReset(req, res) {
  try {
    const esquema = await leerEsquema(req.db);
    const { etapas } = await estadoEtapas(req.db, esquema);
    const compartida = await empresasQueCompartenBase(req.empresaData);
    return res.json({
      success: true,
      empresa: { nombre: req.empresaData?.nombre || '', base: req.db.config.database },
      compartida,
      etapas,
    });
  } catch (error) {
    console.error('Error al leer estado de reseteo:', error);
    return res.status(500).json({ message: error.message || 'No se pudo leer la base' });
  }
}

async function ejecutarReset(req, res) {
  const { etapas: pedidas, password, confirmacion, backup = true } = req.body || {};
  if (password !== DEV_PASSWORD) {
    return res.status(403).json({ message: 'Contraseña de desarrollador incorrecta' });
  }
  const validas = new Set(ETAPAS.map((e) => e.id));
  const seleccion = new Set((Array.isArray(pedidas) ? pedidas : []).filter((id) => validas.has(id)));
  if (!seleccion.size) {
    return res.status(400).json({ message: 'No se eligió ninguna etapa' });
  }
  const nombreEmpresa = String(req.empresaData?.nombre || '').trim().toUpperCase();
  if (!nombreEmpresa || String(confirmacion || '').trim().toUpperCase() !== nombreEmpresa) {
    return res.status(400).json({ message: 'El nombre de la empresa no coincide' });
  }

  try {
    const compartida = await empresasQueCompartenBase(req.empresaData);
    if (compartida.length) {
      return res.status(409).json({
        message: `La base ${req.db.config.database} también la usan: ${compartida.join(', ')}. No se puede resetear.`,
      });
    }

    const db = req.db;
    const esquema = await leerEsquema(db);
    const estado = await estadoEtapas(db, esquema);
    const { bloqueos, tablas } = buscarBloqueos(seleccion, estado, esquema);
    if (bloqueos.length) {
      return res.status(409).json({ message: 'Hay etapas dependientes sin borrar', bloqueos });
    }

    let backupId = null;
    if (backup) {
      if (backupJobs.empresaHasActiveJob(req.empresaData.id)) {
        return res.status(409).json({ message: 'Hay un backup o restauración en curso. Esperá a que termine.' });
      }
      const empresa = typeof req.empresaData.toJSON === 'function' ? req.empresaData.toJSON() : req.empresaData;
      const meta = await mysqlBackup.dumpToFile(empresa, {
        createdBy: req.userData?.userId || null,
        kind: 'safety',
      });
      backupId = meta.id;
    }

    const porId = new Map(estado.etapas.map((e) => [e.id, e]));
    const quedaVacia = (id) => seleccion.has(id) || porId.get(id).filas === 0;
    const existe = (tabla) => esquema.existentes.has(tabla);
    const orden = ordenarParaBorrar(
      ETAPAS.filter((e) => seleccion.has(e.id))
        .flatMap((e) => porId.get(e.id).tablas.map((t) => t.nombre))
        .filter((t, i, lista) => lista.indexOf(t) === i),
      esquema.fks
    );
    const ajustes = [];
    let numeracionesReiniciadas = 0;

    const transaction = await db.transaction();
    try {
      const pares = new Map();
      for (const tabla of orden) {
        if (!esquema.conNumeracion.has(tabla)) continue;
        const filas = await seleccionar(
          db,
          `SELECT DISTINCT DocumentoTipo AS tipo, DocumentoSucursal AS sucursal FROM ${q(tabla)}`,
          [],
          transaction
        );
        for (const { tipo, sucursal } of filas) {
          if (tipo && sucursal) pares.set(`${tipo}|${sucursal}`, { tipo, sucursal });
        }
      }

      for (const tabla of orden) {
        await db.query(`DELETE FROM ${q(tabla)}`, { transaction });
      }

      if (existe('t_numeroscontrol')) {
        for (const { tipo, sucursal } of pares.values()) {
          await db.query(
            'UPDATE t_numeroscontrol SET NumeroProximo = 1 WHERE Codigo = ? AND Sucursal = ?',
            { replacements: [tipo, sucursal], transaction }
          );
        }
        numeracionesReiniciadas = pares.size;
      }

      const productosQuedan = !seleccion.has('productos') && existe('t_articulos');
      if (seleccion.has('stock') && productosQuedan) {
        await db.query('UPDATE t_articulos SET Existencia = 0', { transaction });
        ajustes.push('Existencia de todos los productos en cero');
      }
      if (seleccion.has('proveedores') && productosQuedan) {
        await db.query('UPDATE t_articulos SET ProveedorCodigo = NULL', { transaction });
        ajustes.push('Se quitó el proveedor de los productos');
      }
      if (
        !seleccion.has('clientes') &&
        existe('t_clientes') &&
        ETAPAS_DOCUMENTOS_CLIENTE.some((id) => seleccion.has(id)) &&
        ETAPAS_DOCUMENTOS_CLIENTE.every(quedaVacia)
      ) {
        await db.query('UPDATE t_clientes SET ImporteDeuda = 0, SaldoNTCNoAplicado = 0', { transaction });
        ajustes.push('Saldos de clientes en cero');
      }
      if (seleccion.has('compras') && !seleccion.has('proveedores') && existe('t_proveedores')) {
        await db.query('UPDATE t_proveedores SET ImporteDeuda = 0, SaldoNTCNoAplicado = 0', { transaction });
        ajustes.push('Saldos de proveedores en cero');
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    console.warn('[desarrollador] Reseteo de base', {
      empresaId: req.empresaData?.id,
      base: db.config.database,
      usuario: req.userData?.userId,
      etapas: [...seleccion],
      backupId,
    });

    return res.json({
      success: true,
      backupId,
      numeracionesReiniciadas,
      ajustes,
      eliminadas: ETAPAS.filter((e) => seleccion.has(e.id)).map((e) => ({
        id: e.id,
        label: e.label,
        filas: porId.get(e.id).filas,
      })),
      tablas: tablas.size,
    });
  } catch (error) {
    console.error('Error al resetear base:', error);
    const fk = error.name === 'SequelizeForeignKeyConstraintError';
    return res.status(fk ? 409 : 500).json({
      message: fk
        ? `No se borró nada: una tabla no elegida todavía referencia estos datos (${error.table || error.message}).`
        : error.message || 'Error al resetear la base',
    });
  }
}

async function diagnosticoBase(req, res) {
  try {
    const diagnostico = await optimizacionBase.diagnosticar(req.db);
    const compartida = await empresasQueCompartenBase(req.empresaData);
    return res.json({ success: true, compartida, ...diagnostico });
  } catch (error) {
    console.error('Error en diagnóstico de base:', error);
    return res.status(500).json({ message: error.message || 'No se pudo diagnosticar la base' });
  }
}

const ACCIONES_BASE = {
  'crear-indices': { compartidaPermitida: true },
  analizar: { compartidaPermitida: true },
  optimizar: { compartidaPermitida: true },
  'vaciar-temporales': { compartidaPermitida: false },
  'purgar-preventas': { compartidaPermitida: false },
};

async function accionBase(req, res) {
  const { accion, password } = req.body || {};
  if (password !== DEV_PASSWORD) {
    return res.status(403).json({ message: 'Contraseña de desarrollador incorrecta' });
  }
  const definicion = ACCIONES_BASE[accion];
  if (!definicion) {
    return res.status(400).json({ message: 'Acción desconocida' });
  }

  try {
    if (!definicion.compartidaPermitida) {
      const compartida = await empresasQueCompartenBase(req.empresaData);
      if (compartida.length) {
        return res.status(409).json({
          message: `La base también la usan: ${compartida.join(', ')}. Esta acción borraría sus datos.`,
        });
      }
    }

    const inicio = Date.now();
    let detalle;
    if (accion === 'crear-indices') {
      const resultados = await optimizacionBase.crearIndices(req.db);
      const fallidos = resultados.filter((r) => !r.ok);
      detalle = {
        mensaje: `Índices creados: ${resultados.length - fallidos.length} de ${resultados.length}`,
        fallidos,
      };
    } else if (accion === 'analizar') {
      const cantidad = await optimizacionBase.analizarTablas(req.db);
      detalle = { mensaje: `Estadísticas actualizadas en ${cantidad} tablas` };
    } else if (accion === 'optimizar') {
      const { tablas, recuperadoMb } = await optimizacionBase.optimizarTablas(req.db);
      detalle = { mensaje: `Tablas optimizadas: ${tablas} (aprox. ${recuperadoMb} MB recuperados)` };
    } else if (accion === 'vaciar-temporales') {
      const cantidad = await optimizacionBase.vaciarTemporales(req.db);
      detalle = { mensaje: `Tablas temporales vaciadas: ${cantidad}` };
    } else {
      const { fechaLimite, cabezas, items } = await optimizacionBase.purgarPreventas(req.db);
      detalle = { mensaje: `Preventas anteriores al ${fechaLimite} eliminadas: ${cabezas} (${items} ítems)` };
    }

    console.warn('[desarrollador] Acción de base', {
      empresaId: req.empresaData?.id,
      base: req.db.config.database,
      usuario: req.userData?.userId,
      accion,
    });
    return res.json({ success: true, accion, segundos: Math.round((Date.now() - inicio) / 100) / 10, ...detalle });
  } catch (error) {
    console.error(`Error en acción de base ${accion}:`, error);
    return res.status(500).json({ message: error.message || 'No se pudo completar la acción' });
  }
}

module.exports = { obtenerEstadoReset, ejecutarReset, ordenarParaBorrar, diagnosticoBase, accionBase };
