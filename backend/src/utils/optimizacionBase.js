const { QueryTypes } = require('sequelize');

/**
 * Índices que necesitan las consultas habituales (cuenta corriente, informes por fecha,
 * unión cabeza-ítems, lectura de código de barras). Se crean solo si la tabla y las
 * columnas existen y ningún índice actual empieza por esas mismas columnas.
 */
const INDICES_ESPERADOS = [
  { tabla: 'facturacabeza', columnas: ['ClienteCodigo', 'Fecha'] },
  { tabla: 'facturacabeza', columnas: ['Fecha'] },
  { tabla: 'facturaitems', columnas: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'] },
  { tabla: 'facturaitems', columnas: ['CodigoArticulo'] },
  { tabla: 'notacreditocabeza', columnas: ['CodigoCliente', 'Fecha'] },
  { tabla: 'notacreditocabeza', columnas: ['Fecha'] },
  { tabla: 'notacreditoitems', columnas: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'] },
  { tabla: 'notadebitocabeza', columnas: ['ClienteCodigo', 'Fecha'] },
  { tabla: 'notadebitocabeza', columnas: ['Fecha'] },
  { tabla: 'notadebitoitems', columnas: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'] },
  { tabla: 'reciboscabeza', columnas: ['ClienteCodigo', 'Fecha'] },
  { tabla: 'reciboscabeza', columnas: ['Fecha'] },
  { tabla: 'recibositems', columnas: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'] },
  { tabla: 'recibositems', columnas: ['FacturaTipo', 'FacturaSucursal', 'FacturaNumero'] },
  { tabla: 'recibosvalores', columnas: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'] },
  { tabla: 'preventa_cabeza', columnas: ['Fecha'] },
  { tabla: 'preventa_items', columnas: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'] },
  { tabla: 'comprascabeza', columnas: ['ProveedorCodigo', 'Fecha'] },
  { tabla: 'comprascabeza', columnas: ['Fecha'] },
  { tabla: 'comprasitems', columnas: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'] },
  { tabla: 'pedidositems', columnas: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'] },
  { tabla: 'movimientosstock', columnas: ['CodigoArticulo', 'Fecha'] },
  { tabla: 'movimientosstock', columnas: ['Fecha'] },
  { tabla: 't_articulos', columnas: ['CodigoBarras'] },
  { tabla: 't_clientes', columnas: ['Cuit'] },
];

const TABLAS_CON_FECHA = [
  'facturacabeza',
  'notacreditocabeza',
  'notadebitocabeza',
  'reciboscabeza',
  'comprascabeza',
  'preventa_cabeza',
  'movimientosstock',
];

const MB = 1024 * 1024;

function q(nombre) {
  return '`' + String(nombre).replace(/`/g, '``') + '`';
}

function seleccionar(db, sql, replacements = []) {
  return db.query(sql, { type: QueryTypes.SELECT, replacements });
}

function redondear(valor, decimales = 1) {
  const factor = 10 ** decimales;
  return Math.round(Number(valor || 0) * factor) / factor;
}

function nombreIndice(columnas) {
  return `ix_janus_${columnas.join('_').toLowerCase()}`.slice(0, 64);
}

function fechaHaceUnAnio() {
  const fecha = new Date();
  fecha.setFullYear(fecha.getFullYear() - 1);
  return fecha.toISOString().slice(0, 10);
}

async function medirLatencia(db, veces = 5) {
  const tiempos = [];
  for (let i = 0; i < veces; i++) {
    const inicio = process.hrtime.bigint();
    await seleccionar(db, 'SELECT 1 AS ok');
    tiempos.push(Number(process.hrtime.bigint() - inicio) / 1e6);
  }
  return {
    promedioMs: redondear(tiempos.reduce((a, b) => a + b, 0) / tiempos.length),
    minimoMs: redondear(Math.min(...tiempos)),
  };
}

async function leerTablas(db) {
  const filas = await seleccionar(
    db,
    `SELECT TABLE_NAME AS nombre, TABLE_ROWS AS filas, DATA_LENGTH AS datos,
            INDEX_LENGTH AS indices, DATA_FREE AS libre
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [db.config.database]
  );
  return filas
    .map((t) => ({
      nombre: t.nombre,
      filas: Number(t.filas || 0),
      datosMb: redondear(Number(t.datos || 0) / MB),
      indicesMb: redondear(Number(t.indices || 0) / MB),
      libreMb: redondear(Number(t.libre || 0) / MB),
    }))
    .sort((a, b) => b.datosMb + b.indicesMb - (a.datosMb + a.indicesMb));
}

async function indicesFaltantes(db) {
  const schema = db.config.database;
  const tablas = [...new Set(INDICES_ESPERADOS.map((i) => i.tabla))];
  const columnas = await seleccionar(
    db,
    `SELECT TABLE_NAME AS tabla, COLUMN_NAME AS columna FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?)`,
    [schema, tablas]
  );
  const indices = await seleccionar(
    db,
    `SELECT TABLE_NAME AS tabla, INDEX_NAME AS indice, COLUMN_NAME AS columna, SEQ_IN_INDEX AS orden
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?)
     ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
    [schema, tablas]
  );

  const columnasPorTabla = new Map();
  for (const { tabla, columna } of columnas) {
    const set = columnasPorTabla.get(tabla) || new Set();
    set.add(columna.toLowerCase());
    columnasPorTabla.set(tabla, set);
  }
  const indicesPorTabla = new Map();
  for (const { tabla, indice, columna } of indices) {
    const porIndice = indicesPorTabla.get(tabla) || new Map();
    const lista = porIndice.get(indice) || [];
    lista.push(columna.toLowerCase());
    porIndice.set(indice, lista);
    indicesPorTabla.set(tabla, porIndice);
  }

  return INDICES_ESPERADOS.filter(({ tabla, columnas: cols }) => {
    const existentes = columnasPorTabla.get(tabla);
    if (!existentes || !cols.every((c) => existentes.has(c.toLowerCase()))) return false;
    const actuales = [...(indicesPorTabla.get(tabla)?.values() || [])];
    return !actuales.some((lista) => cols.every((c, i) => lista[i] === c.toLowerCase()));
  }).map(({ tabla, columnas: cols }) => ({ tabla, columnas: cols, nombre: nombreIndice(cols) }));
}

async function rangosDeFecha(db, existentes) {
  const rangos = [];
  for (const tabla of TABLAS_CON_FECHA) {
    if (!existentes.has(tabla)) continue;
    try {
      const [fila] = await seleccionar(
        db,
        `SELECT MIN(Fecha) AS desde, MAX(Fecha) AS hasta FROM ${q(tabla)}`
      );
      rangos.push({ tabla, desde: fila?.desde || null, hasta: fila?.hasta || null });
    } catch (error) {
      rangos.push({ tabla, desde: null, hasta: null });
    }
  }
  return rangos;
}

async function contarPreventasAntiguas(db, existentes) {
  if (!existentes.has('preventa_cabeza')) return 0;
  const [fila] = await seleccionar(
    db,
    'SELECT COUNT(*) AS n FROM preventa_cabeza WHERE Fecha < ?',
    [fechaHaceUnAnio()]
  );
  return Number(fila?.n || 0);
}

async function leerServidor(db) {
  const variables = await seleccionar(
    db,
    `SHOW VARIABLES WHERE Variable_name IN
     ('innodb_buffer_pool_size', 'version', 'slow_query_log', 'long_query_time')`
  );
  const valor = (nombre) => variables.find((v) => v.Variable_name === nombre)?.Value;
  let totalServidorMb = null;
  try {
    const [fila] = await seleccionar(
      db,
      `SELECT SUM(DATA_LENGTH + INDEX_LENGTH) AS total FROM information_schema.TABLES
       WHERE ENGINE = 'InnoDB'
         AND TABLE_SCHEMA NOT IN ('mysql', 'sys', 'information_schema', 'performance_schema')`
    );
    totalServidorMb = redondear(Number(fila?.total || 0) / MB);
  } catch (error) {
    totalServidorMb = null;
  }
  return {
    version: valor('version') || '',
    bufferPoolMb: redondear(Number(valor('innodb_buffer_pool_size') || 0) / MB),
    slowQueryLog: String(valor('slow_query_log') || '').toUpperCase() === 'ON',
    longQueryTime: Number(valor('long_query_time') || 0),
    totalServidorMb,
  };
}

function armarRecomendaciones({ latencia, servidor, faltantes, tablas, temporalesFilas, preventasAntiguas }) {
  const lista = [];
  if (latencia.promedioMs > 20) {
    lista.push(
      `Cada consulta tarda ${latencia.promedioMs} ms solo en ir y volver a la base. Conviene que el backend corra en el mismo servidor o red que MySQL.`
    );
  }
  if (servidor.totalServidorMb && servidor.bufferPoolMb < servidor.totalServidorMb) {
    lista.push(
      `El buffer pool de MySQL tiene ${servidor.bufferPoolMb} MB y las bases InnoDB del servidor ocupan ${servidor.totalServidorMb} MB. Subir innodb_buffer_pool_size (en my.cnf) evita leer de disco.`
    );
  }
  if (!servidor.slowQueryLog) {
    lista.push('El registro de consultas lentas está apagado. Activarlo (slow_query_log=ON, long_query_time=1) permite encontrar las consultas a corregir.');
  }
  if (faltantes.length) {
    lista.push(`Faltan ${faltantes.length} índices que usan la cuenta corriente, los informes por fecha y el lector de códigos.`);
  }
  const conEspacioLibre = tablas.filter((t) => t.libreMb >= 1);
  if (conEspacioLibre.length) {
    lista.push(`${conEspacioLibre.length} tablas tienen espacio sin usar; optimizarlas lo recupera.`);
  }
  if (temporalesFilas > 0) {
    lista.push(`Las tablas temporales de informes acumulan ${temporalesFilas} filas que se pueden vaciar.`);
  }
  if (preventasAntiguas > 0) {
    lista.push(`Hay ${preventasAntiguas} preventas de hace más de un año que ya no se usan.`);
  }
  return lista;
}

async function diagnosticar(db) {
  const latencia = await medirLatencia(db);
  const tablas = await leerTablas(db);
  const existentes = new Set(tablas.map((t) => t.nombre));
  const [faltantes, rangos, preventasAntiguas, servidor] = await Promise.all([
    indicesFaltantes(db),
    rangosDeFecha(db, existentes),
    contarPreventasAntiguas(db, existentes),
    leerServidor(db),
  ]);
  const temporales = tablas.filter((t) => t.nombre.startsWith('tmp_'));
  const temporalesFilas = temporales.reduce((total, t) => total + t.filas, 0);
  const totales = tablas.reduce(
    (acc, t) => ({
      filas: acc.filas + t.filas,
      datosMb: redondear(acc.datosMb + t.datosMb),
      indicesMb: redondear(acc.indicesMb + t.indicesMb),
      libreMb: redondear(acc.libreMb + t.libreMb),
    }),
    { filas: 0, datosMb: 0, indicesMb: 0, libreMb: 0 }
  );

  return {
    base: db.config.database,
    latencia,
    servidor,
    totales,
    tablas: tablas.slice(0, 25),
    cantidadTablas: tablas.length,
    rangos,
    indicesFaltantes: faltantes,
    temporales: { tablas: temporales.length, filas: temporalesFilas },
    preventasAntiguas,
    tablasConEspacioLibre: tablas.filter((t) => t.libreMb >= 1).length,
    recomendaciones: armarRecomendaciones({
      latencia,
      servidor,
      faltantes,
      tablas,
      temporalesFilas,
      preventasAntiguas,
    }),
  };
}

async function crearIndices(db) {
  const faltantes = await indicesFaltantes(db);
  const resultados = [];
  for (const { tabla, columnas, nombre } of faltantes) {
    const lista = columnas.map(q).join(', ');
    try {
      await db.query(
        `ALTER TABLE ${q(tabla)} ADD INDEX ${q(nombre)} (${lista}), ALGORITHM=INPLACE, LOCK=NONE`
      );
      resultados.push({ tabla, nombre, ok: true });
    } catch (error) {
      resultados.push({ tabla, nombre, ok: false, error: error.message });
    }
  }
  return resultados;
}

async function analizarTablas(db) {
  const tablas = (await leerTablas(db)).filter((t) => t.filas > 0).map((t) => t.nombre);
  for (let i = 0; i < tablas.length; i += 20) {
    const bloque = tablas.slice(i, i + 20);
    await db.query(`ANALYZE TABLE ${bloque.map(q).join(', ')}`);
  }
  return tablas.length;
}

async function optimizarTablas(db) {
  const tablas = (await leerTablas(db)).filter((t) => t.libreMb >= 1);
  let recuperadoMb = 0;
  for (const tabla of tablas) {
    await db.query(`OPTIMIZE TABLE ${q(tabla.nombre)}`);
    recuperadoMb += tabla.libreMb;
  }
  return { tablas: tablas.length, recuperadoMb: redondear(recuperadoMb) };
}

async function vaciarTemporales(db) {
  const tablas = (await leerTablas(db)).filter((t) => t.nombre.startsWith('tmp_'));
  let vaciadas = 0;
  for (const { nombre } of tablas) {
    try {
      await db.query(`TRUNCATE TABLE ${q(nombre)}`);
    } catch (error) {
      await db.query(`DELETE FROM ${q(nombre)}`);
    }
    vaciadas += 1;
  }
  return vaciadas;
}

async function purgarPreventas(db) {
  const fechaLimite = fechaHaceUnAnio();
  const transaction = await db.transaction();
  try {
    const [itemsResultado] = await db.query(
      `DELETE i FROM preventa_items i
       INNER JOIN preventa_cabeza c
         ON c.DocumentoTipo = i.DocumentoTipo
        AND c.DocumentoSucursal = i.DocumentoSucursal
        AND c.DocumentoNumero = i.DocumentoNumero
       WHERE c.Fecha < ?`,
      { replacements: [fechaLimite], transaction }
    );
    const [cabezasResultado] = await db.query('DELETE FROM preventa_cabeza WHERE Fecha < ?', {
      replacements: [fechaLimite],
      transaction,
    });
    await transaction.commit();
    return {
      fechaLimite,
      items: Number(itemsResultado?.affectedRows || 0),
      cabezas: Number(cabezasResultado?.affectedRows || 0),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  INDICES_ESPERADOS,
  diagnosticar,
  indicesFaltantes,
  crearIndices,
  analizarTablas,
  optimizarTablas,
  vaciarTemporales,
  purgarPreventas,
};
