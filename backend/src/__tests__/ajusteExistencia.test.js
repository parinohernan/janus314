const { ajusteExistencia } = require('../utils/ajusteExistencia');

describe('ajusteExistencia', () => {
  it('no arma movimiento si la existencia no cambió', () => {
    expect(ajusteExistencia(10, 10)).toBeNull();
    expect(ajusteExistencia('4.00', 4.004)).toBeNull();
    expect(ajusteExistencia(null, 5)).toBeNull();
    expect(ajusteExistencia(5, '')).toBeNull();
  });

  it('ingresa la diferencia cuando el stock sube', () => {
    expect(ajusteExistencia(10, 12.5)).toEqual({
      cantidad: 2.5,
      movimientoTipo: 'ING',
    });
  });

  it('egresa la diferencia cuando el stock baja', () => {
    expect(ajusteExistencia(8, 3)).toEqual({
      cantidad: 5,
      movimientoTipo: 'EGR',
    });
  });
});
