const { paginacionFacturasCliente } = require('../utils/paginacionFacturasCliente');

describe('paginacionFacturasCliente', () => {
  it('usa página 1 y 5 ítems por defecto', () => {
    expect(paginacionFacturasCliente({})).toEqual({ limit: 5, page: 1, offset: 0 });
  });

  it('calcula el offset de a 5', () => {
    expect(paginacionFacturasCliente({ limit: '5', page: '3' })).toEqual({
      limit: 5,
      page: 3,
      offset: 10,
    });
  });

  it('acota valores inválidos', () => {
    expect(paginacionFacturasCliente({ limit: '0', page: '-2' })).toEqual({
      limit: 1,
      page: 1,
      offset: 0,
    });
    expect(paginacionFacturasCliente({ limit: '999', page: '2' }).limit).toBe(100);
  });
});
