const articuloSubproductoService = require('../services/articuloSubproducto.service');

jest.mock('../utils/articuloSubproductoSchema', () => ({
  ensureArticulosSubproductosSchema: jest.fn().mockResolvedValue(undefined),
}));

describe('articuloSubproducto.service expandirItemsFactura', () => {
  const reglas = [
    {
      CodigoArticuloPadre: 'GARRAFA',
      CodigoArticuloSub: 'ENT-DOM',
      CantidadPorUnidad: 1,
    },
    {
      CodigoArticuloPadre: 'PAPAS',
      CodigoArticuloSub: 'ENT-DOM',
      CantidadPorUnidad: 1,
    },
  ];

  const articulosSub = [
    {
      Codigo: 'ENT-DOM',
      Descripcion: 'Entrega a domicilio',
      Lista1: 300,
      PrecioCosto: 0,
      PorcentajeIVA1: 21,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('agrega cantidades proporcionales y fusiona por código de subproducto', async () => {
    const sequelize = {
      query: jest
        .fn()
        .mockResolvedValueOnce([reglas])
        .mockResolvedValueOnce([articulosSub]),
    };

    const items = [
      { ArticuloCodigo: 'GARRAFA', Cantidad: 2, PrecioUnitario: 1000 },
      { ArticuloCodigo: 'PAPAS', Cantidad: 1, PrecioUnitario: 20000 },
    ];

    const expandidos = await articuloSubproductoService.expandirItemsFactura(
      items,
      {},
      '1',
      sequelize
    );

    expect(expandidos).toHaveLength(3);
    const entrega = expandidos.find((i) => i.ArticuloCodigo === 'ENT-DOM');
    expect(entrega).toBeDefined();
    expect(entrega.Cantidad).toBe(3);
    expect(entrega.PrecioUnitario).toBeGreaterThan(0);
  });

  it('elimina líneas de subproducto enviadas y recalcula desde padres', async () => {
    const sequelize = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          [
            {
              CodigoArticuloPadre: 'GARRAFA',
              CodigoArticuloSub: 'ENT-DOM',
              CantidadPorUnidad: 1,
            },
          ],
        ])
        .mockResolvedValueOnce([articulosSub]),
    };

    const items = [
      { ArticuloCodigo: 'GARRAFA', Cantidad: 2, PrecioUnitario: 1000 },
      { ArticuloCodigo: 'ENT-DOM', Cantidad: 99, PrecioUnitario: 300 },
    ];

    const expandidos = await articuloSubproductoService.expandirItemsFactura(
      items,
      {},
      '1',
      sequelize
    );

    const entrega = expandidos.find((i) => i.ArticuloCodigo === 'ENT-DOM');
    expect(entrega.Cantidad).toBe(2);
  });
});
