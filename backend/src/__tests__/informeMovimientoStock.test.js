const { armarInformeMovimientoStock, mapearEventos } = require('../utils/informeMovimientoStock');

describe('informeMovimientoStock', () => {
  it('une STK, venta y NC y cierra el saldo contra la existencia actual', () => {
    const informe = armarInformeMovimientoStock({
      articulo: { Codigo: 'A1', Descripcion: 'Aceite' },
      existenciaActual: 12,
      fechaDesde: '2026-09-01',
      fechaHasta: '2026-09-10',
      stk: [
        {
          Fecha: '2026-09-02',
          DocumentoTipo: 'STK',
          DocumentoSucursal: '0001',
          DocumentoNumero: '00000001',
          Cantidad: 5,
          MovimientoTipo: 'ING',
          Observacion: 'Ajuste',
        },
      ],
      ventas: [
        {
          Fecha: '2026-09-04',
          DocumentoTipo: 'FCB',
          DocumentoSucursal: '0003',
          DocumentoNumero: '00000100',
          Cantidad: 3,
        },
      ],
      notas: [
        {
          Fecha: '2026-09-06',
          DocumentoTipo: 'NCB',
          DocumentoSucursal: '0003',
          DocumentoNumero: '00000010',
          Cantidad: 1,
          PorStock: 1,
        },
      ],
    });

    expect(informe.existenciaInicial).toBe(9);
    expect(informe.totales).toEqual({ ingresos: 6, egresos: 3, ventas: 3 });
    expect(informe.movimientos.map((m) => m.origen)).toEqual(['STK', 'VENTA', 'NC']);
    expect(informe.movimientos.at(-1).existencia).toBe(12);
    expect(informe.serie.at(-1).existencia).toBe(12);
  });

  it('ignora comprobantes anulados y NC sin PorStock', () => {
    const eventos = mapearEventos({
      ventas: [
        {
          Fecha: '2026-09-04',
          DocumentoTipo: 'FCB',
          DocumentoNumero: '1',
          Cantidad: 4,
          FechaAnulacion: '2026-09-05',
        },
      ],
      notas: [
        {
          Fecha: '2026-09-06',
          DocumentoTipo: 'NCB',
          DocumentoNumero: '2',
          Cantidad: 2,
          PorStock: 0,
        },
      ],
    });
    expect(eventos).toHaveLength(0);
  });
});
