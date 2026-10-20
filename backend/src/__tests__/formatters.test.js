const { formatearFecha } = require('../utils/formatters');

describe('formatearFecha', () => {
  it('convierte YYYY-MM-DD a DD-MM-YYYY', () => {
    expect(formatearFecha('2026-10-20')).toBe('20-10-2026');
  });

  it('deja DD-MM-YYYY sin cambios', () => {
    expect(formatearFecha('20-10-2026')).toBe('20-10-2026');
  });

  it('formatea objetos Date', () => {
    expect(formatearFecha(new Date(2026, 9, 20))).toBe('20-10-2026');
  });
});
