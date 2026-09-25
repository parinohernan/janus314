const {
  prepararActualizacionPreciosStock,
  OBSERVACION_AJUSTE,
} = require('../utils/actualizarPreciosStock');

const articuloBase = {
  Codigo: 'A1',
  PrecioCosto: 10,
  PrecioCostoMasImp: 12.1,
  Lista1: 20,
  Lista2: 30,
  Lista3: 0,
  Lista4: 0,
  Lista5: 0,
  Existencia: 8,
  PorcentajeIVA1: 21,
};

describe('prepararActualizacionPreciosStock', () => {
  it('no hace nada si los valores son los mismos', () => {
    const prep = prepararActualizacionPreciosStock(articuloBase, {
      Codigo: 'A1',
      PrecioCosto: 10,
      Existencia: 8,
    });
    expect(prep.ok).toBe(true);
    expect(prep.noop).toBe(true);
    expect(prep.ajuste).toBeNull();
  });

  it('ingresa stock cuando la existencia sube', () => {
    const prep = prepararActualizacionPreciosStock(articuloBase, {
      Codigo: 'A1',
      Existencia: 12.5,
    });
    expect(prep.ok).toBe(true);
    expect(prep.noop).toBe(false);
    expect(prep.updates.Existencia).toBe(12.5);
    expect(prep.ajuste).toEqual({ cantidad: 4.5, movimientoTipo: 'ING' });
  });

  it('egresa stock cuando la existencia baja', () => {
    const prep = prepararActualizacionPreciosStock(articuloBase, {
      Codigo: 'A1',
      Existencia: 3,
    });
    expect(prep.ok).toBe(true);
    expect(prep.ajuste).toEqual({ cantidad: 5, movimientoTipo: 'EGR' });
    expect(prep.updates.Existencia).toBe(3);
  });

  it('aplica precio y existencia en el mismo item', () => {
    const prep = prepararActualizacionPreciosStock(articuloBase, {
      Codigo: 'A1',
      PrecioCosto: 15,
      Lista1: 25,
      Existencia: 10,
    });
    expect(prep.ok).toBe(true);
    expect(prep.noop).toBe(false);
    expect(prep.registrarCosto).toBe(true);
    expect(prep.updates.PrecioCosto).toBe(15);
    expect(prep.updates.PrecioCostoMasImp).toBeCloseTo(18.15);
    expect(prep.updates.Lista1).toBe(25);
    expect(prep.updates.Existencia).toBe(10);
    expect(prep.ajuste).toEqual({ cantidad: 2, movimientoTipo: 'ING' });
  });

  it('guarda ambas columnas de costo si vinieron las dos', () => {
    const prep = prepararActualizacionPreciosStock(articuloBase, {
      PrecioCosto: 20,
      PrecioCostoMasImp: 22,
    });
    expect(prep.updates.PrecioCosto).toBe(20);
    expect(prep.updates.PrecioCostoMasImp).toBe(22);
  });

  it('rechaza existencia negativa y números no finitos', () => {
    expect(prepararActualizacionPreciosStock(articuloBase, { Existencia: -1 }).ok).toBe(false);
    expect(prepararActualizacionPreciosStock(articuloBase, { PrecioCosto: Infinity }).ok).toBe(false);
    expect(prepararActualizacionPreciosStock(articuloBase, { Lista2: 'abc' }).ok).toBe(false);
    expect(prepararActualizacionPreciosStock(null, { PrecioCosto: 1 }).ok).toBe(false);
  });

  it('usa la observación de la pantalla de precios y stock', () => {
    expect(OBSERVACION_AJUSTE).toBe('Ajuste desde actualización de precios y stock');
  });
});
