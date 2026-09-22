const { costoCambio, registrarCostoSiCambio } = require('../utils/costoHistorial');

describe('costoCambio', () => {
  it('no cambia si el costo redondeado es el mismo', () => {
    expect(costoCambio(10, 10)).toBe(false);
    expect(costoCambio('10.00', 10.004)).toBe(false);
    expect(costoCambio(0, 0)).toBe(false);
  });

  it('cambia si el costo a 2 decimales es distinto o no había costo', () => {
    expect(costoCambio(10, 10.01)).toBe(true);
    expect(costoCambio(null, 0)).toBe(true);
    expect(costoCambio(undefined, 12.5)).toBe(true);
  });

  it('ignora un costo nuevo vacío', () => {
    expect(costoCambio(10, null)).toBe(false);
    expect(costoCambio(10, '')).toBe(false);
  });
});

describe('registrarCostoSiCambio', () => {
  it('no graba si el costo no cambió', async () => {
    const create = jest.fn();
    const update = jest.fn();
    const grabo = await registrarCostoSiCambio({
      Historial: { create },
      articulo: { Codigo: '1', update },
      costoAnterior: 10,
      costoNuevo: 10.004,
    });
    expect(grabo).toBe(false);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('graba fecha y monto y actualiza la fecha del artículo', async () => {
    const create = jest.fn().mockResolvedValue({});
    const update = jest.fn().mockResolvedValue({});
    const ahora = new Date('2026-09-21T15:00:00.000Z');
    const grabo = await registrarCostoSiCambio({
      Historial: { create },
      articulo: { Codigo: 'A1', update },
      costoAnterior: 10,
      costoNuevo: 12.5,
      ahora,
    });
    expect(grabo).toBe(true);
    expect(create).toHaveBeenCalledWith(
      {
        ArticuloCodigo: 'A1',
        Fecha: ahora,
        PrecioCosto: 12.5,
      },
      { transaction: undefined }
    );
    expect(update).toHaveBeenCalledWith(
      { FechaActualizacionCosto: ahora },
      { transaction: undefined }
    );
  });
});
