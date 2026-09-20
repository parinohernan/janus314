const POS_VARIOS_ARTICULOS = [
  { Codigo: "VAR-ALM", Descripcion: "VARIOS ALMACEN", PorcentajeIVA1: 21 },
  { Codigo: "VAR-PAN", Descripcion: "VARIOS PANADERIA", PorcentajeIVA1: 10.5 },
  { Codigo: "VAR-FIA", Descripcion: "VARIOS FIAMBRERIA", PorcentajeIVA1: 21 },
  { Codigo: "VAR-VER", Descripcion: "VARIOS VERDULERIA", PorcentajeIVA1: 10.5 },
  { Codigo: "VAR-CAR", Descripcion: "VARIOS CARNICERIA", PorcentajeIVA1: 10.5 },
  { Codigo: "VAR-VAR", Descripcion: "VARIOS", PorcentajeIVA1: 21 },
];

const POS_VARIOS_CODIGOS = new Set(POS_VARIOS_ARTICULOS.map((a) => a.Codigo));

function esArticuloPosVarios(codigo) {
  const value = String(codigo || "").trim().toUpperCase();
  if (!value) return false;
  if (POS_VARIOS_CODIGOS.has(value)) return true;
  return value.startsWith("VAR-");
}

async function ensureDescripcionLibreColumn(sequelize) {
  if (!sequelize) return;
  if (sequelize.__posDescripcionLibreOk) return;
  try {
    await sequelize.query(
      "ALTER TABLE facturaitems ADD COLUMN DescripcionLibre VARCHAR(100) NULL"
    );
  } catch (error) {
    const msg = String(error?.message || error);
    if (!/duplicate column|ER_DUP_FIELDNAME/i.test(msg)) {
      throw error;
    }
  }
  sequelize.__posDescripcionLibreOk = true;
}

const CLIENTE_CF = {
  Codigo: "CF",
  Descripcion: "Consumidor Final",
  NombreFantasia: "Consumidor Final",
  Cuit: "00000000000",
  CategoriaIva: "F",
  ListaPrecio: "1",
  Activo: 1,
  ImporteDeuda: 0,
  PorcentajeBonificacionGeneral: 0,
  LimiteCredito: 0,
  SaldoNTCNoAplicado: 0,
};

async function ensureCategoriaConsumidorFinal(CategoriaIva, transaction) {
  if (!CategoriaIva) return "F";
  const existente = await CategoriaIva.findByPk("F", { transaction });
  if (existente) return "F";
  try {
    await CategoriaIva.create(
      { Codigo: "F", Descripcion: "Consumidor Final" },
      { transaction }
    );
    return "F";
  } catch (error) {
    console.warn("[POS] No se pudo crear categoría IVA F:", error.message);
    return null;
  }
}

function esErrorDuplicado(error) {
  const code = String(error?.parent?.code || error?.code || "");
  const msg = String(error?.message || error);
  return code === "ER_DUP_ENTRY" || /duplicate|unique/i.test(msg);
}

function esErrorFkCategoria(error) {
  const msg = String(error?.message || error);
  return /t_categoriasiva|CategoriaIva/i.test(msg);
}

async function ensureClienteConsumidorFinal(Cliente, CategoriaIva, transaction) {
  if (!Cliente) {
    throw new Error("Modelo Cliente no disponible");
  }

  const actual = await Cliente.findByPk(CLIENTE_CF.Codigo, { transaction });
  if (actual) return actual;

  const categoriaIva = await ensureCategoriaConsumidorFinal(CategoriaIva, transaction);
  const payload = {
    ...CLIENTE_CF,
    CategoriaIva: categoriaIva,
  };

  try {
    return await Cliente.create(payload, { transaction });
  } catch (error) {
    if (esErrorDuplicado(error)) {
      const existente = await Cliente.findByPk(CLIENTE_CF.Codigo, { transaction });
      if (existente) return existente;
    }
    if (esErrorFkCategoria(error) && payload.CategoriaIva) {
      return Cliente.create({ ...payload, CategoriaIva: null }, { transaction });
    }
    throw error;
  }
}

module.exports = {
  POS_VARIOS_ARTICULOS,
  POS_VARIOS_CODIGOS,
  CLIENTE_CF,
  esArticuloPosVarios,
  ensureDescripcionLibreColumn,
  ensureClienteConsumidorFinal,
};
