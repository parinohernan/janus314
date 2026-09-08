const convertirNumeroAPalabras = require('../utils/convertirNumeroAPalabras');

describe('convertirNumeroAPalabras', () => {
  it('escribe un millón en lugar de undefined', () => {
    expect(convertirNumeroAPalabras(1034317.73)).toBe(
      'Un Millón Treinta y cuatro Mil Trescientos Diecisiete con 73/100'
    );
  });

  it('no incluye undefined en ningún tramo', () => {
    const texto = convertirNumeroAPalabras(1034317.73);
    expect(texto).not.toMatch(/undefined/i);
  });

  it('convierte miles y ceros decimales', () => {
    expect(convertirNumeroAPalabras(1500)).toBe('Mil Quinientos con 00/100');
  });

  it('convierte varios millones', () => {
    expect(convertirNumeroAPalabras(2000000)).toBe('Dos Millones con 00/100');
  });
});
