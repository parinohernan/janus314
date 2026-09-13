const {
  encontrarFacturaOrigen,
  mapaFacturas,
  procesarFacturacionNeta
} = require('../services/informeFacturacionNeta.service');

const factura = {
  DocumentoTipo: 'FCA',
  DocumentoSucursal: '0001',
  DocumentoNumero: '00000001',
  Fecha: '2026-09-01',
  ClienteCodigo: 'C1',
  VendedorCodigo: 'V1',
  ImporteTotal: 100,
  ImporteIva1: 21,
  ImporteIva2: 0,
  ImporteBonificado: 0,
  Cliente: { Descripcion: 'Cliente 1' },
  Vendedor: { Descripcion: 'Vendedor 1' }
};

function ncLigada(overrides = {}) {
  return {
    DocumentoTipo: 'NCA',
    DocumentoSucursal: '0001',
    DocumentoNumero: '00000010',
    Fecha: '2026-10-15',
    ImporteTotal: 20,
    ImporteIva1: 4.2,
    ImporteIva2: 0,
    factura_tipo: 'FCA',
    factura_sucursal: '0001',
    factura_numero: '00000001',
    ...overrides
  };
}

describe('procesarFacturacionNeta', () => {
  test('factura 100 + NC ligada 20 → neto 80', () => {
    const data = procesarFacturacionNeta([factura], [ncLigada()]);
    expect(data.estadisticasGenerales.totalVentas).toBe(100);
    expect(data.estadisticasGenerales.totalNotasCredito).toBe(20);
    expect(data.estadisticasGenerales.totalVentasNetas).toBe(80);
    expect(data.estadisticasGenerales.totalIva).toBeCloseTo(16.8);
    expect(data.agrupacionPorTipo[0].monto).toBe(80);
    expect(data.agrupacionPorVendedor[0].monto).toBe(80);
    expect(data.agrupacionPorCliente[0].monto).toBe(80);
  });

  test('NC sin factura_* no descuenta', () => {
    const data = procesarFacturacionNeta([factura], [
      { DocumentoTipo: 'NCA', ImporteTotal: 50 }
    ]);
    expect(data.estadisticasGenerales.totalVentasNetas).toBe(100);
    expect(data.estadisticasGenerales.cantidadNotasCredito).toBe(0);
  });

  test('NC de una factura fuera del set no descuenta', () => {
    const data = procesarFacturacionNeta([factura], [
      ncLigada({
        factura_tipo: 'FCB',
        factura_sucursal: '0001',
        factura_numero: '00000999',
        ImporteTotal: 50
      })
    ]);
    expect(data.estadisticasGenerales.totalVentasNetas).toBe(100);
    expect(encontrarFacturaOrigen(
      { factura_tipo: 'FCB', factura_sucursal: '0001', factura_numero: '00000999' },
      mapaFacturas([factura])
    )).toBeNull();
  });

  test('la NC se imputa a la fecha de la factura origen', () => {
    const data = procesarFacturacionNeta([factura], [ncLigada()], 'dia');
    expect(data.evolucionVentas).toHaveLength(1);
    expect(data.evolucionVentas[0].periodo).toBe('2026-09-01');
    expect(data.evolucionVentas[0].monto).toBe(80);
  });

  test('NC del período sin asociar se observan y no descuentan', () => {
    const ncSinOrigen = {
      DocumentoTipo: 'NCA',
      DocumentoSucursal: '0001',
      DocumentoNumero: '00000022',
      Fecha: '2026-09-10',
      ImporteTotal: 35,
      'Cliente.Descripcion': 'Cliente suelto'
    };
    const ncFuera = ncLigada({
      DocumentoNumero: '00000023',
      Fecha: '2026-09-12',
      factura_tipo: 'FCB',
      factura_numero: '00000999',
      ImporteTotal: 15
    });
    const data = procesarFacturacionNeta([factura], [ncLigada()], 'dia', [ncSinOrigen, ncFuera, ncLigada()]);
    expect(data.estadisticasGenerales.totalVentasNetas).toBe(80);
    expect(data.observacion.cantidad).toBe(2);
    expect(data.observacion.importe).toBe(50);
    expect(data.observacion.notas.map((n) => n.motivo)).toEqual([
      'sin_origen',
      'factura_fuera_periodo'
    ]);
  });
});
