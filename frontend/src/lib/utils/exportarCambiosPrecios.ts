/**
 * Exporta los cambios de precios a un archivo Excel para descarga.
 */
import * as XLSX from 'xlsx';

function nombreArchivo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `cambios_precios_${y}-${m}-${d}_${h}${min}.xlsx`;
}

export interface ArticuloPorcentaje {
  Codigo: string;
  Descripcion: string;
  PrecioCosto: number;
}

/**
 * Exporta los cambios realizados en actualización por porcentaje.
 */
export function exportarCambiosPreciosPorcentaje(
  articulos: ArticuloPorcentaje[],
  porcentaje: number
): void {
  const datos = articulos.map((a) => {
    const anterior = a.PrecioCosto ?? 0;
    const nuevo = anterior * (1 + porcentaje / 100);
    return {
      Codigo: a.Codigo,
      Descripcion: a.Descripcion ?? '',
      'Precio costo anterior': anterior,
      'Precio costo nuevo': nuevo,
      '% aplicado': porcentaje
    };
  });

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cambios');
  XLSX.writeFile(wb, nombreArchivo());
}

const LABEL_CAMPO: Record<string, string> = {
  PrecioCosto: 'Precio costo',
  PrecioCostoMasImp: 'Costo + IVA',
  Lista1: 'Lista 1',
  Lista2: 'Lista 2',
  Lista3: 'Lista 3',
  Lista4: 'Lista 4',
  Lista5: 'Lista 5'
};

export interface ArticuloManual {
  Codigo: string;
  Descripcion: string;
  PrecioCosto?: number;
  PrecioCostoMasImp?: number;
  Lista1?: number;
  Lista2?: number;
  Lista3?: number;
  Lista4?: number;
  Lista5?: number;
}

export type ModificacionesManual = Map<string, Partial<ArticuloManual>>;

/**
 * Exporta los cambios realizados en actualización manual.
 */
export function exportarCambiosPreciosManual(
  articulos: ArticuloManual[],
  articulosModificados: ModificacionesManual
): void {
  const datos: Array<{
    Codigo: string;
    Descripcion: string;
    'Campo modificado': string;
    'Valor anterior': number;
    'Valor nuevo': number;
  }> = [];

  for (const articulo of articulos) {
    const mod = articulosModificados.get(articulo.Codigo);
    if (!mod) continue;

    const campos: (keyof ArticuloManual)[] = [
      'PrecioCosto',
      'PrecioCostoMasImp',
      'Lista1',
      'Lista2',
      'Lista3',
      'Lista4',
      'Lista5'
    ];

    for (const campo of campos) {
      const valorNuevo = mod[campo];
      if (valorNuevo === undefined || valorNuevo === null) continue;

      const valorAnterior = (articulo[campo] as number) ?? 0;

      datos.push({
        Codigo: articulo.Codigo,
        Descripcion: articulo.Descripcion ?? '',
        'Campo modificado': LABEL_CAMPO[campo] ?? campo,
        'Valor anterior': valorAnterior,
        'Valor nuevo': Number(valorNuevo)
      });
    }
  }

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cambios');
  XLSX.writeFile(wb, nombreArchivo());
}
