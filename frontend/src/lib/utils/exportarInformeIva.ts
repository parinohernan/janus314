import * as XLSX from 'xlsx';

export interface ComprobanteIva {
  fecha: string;
  tipo: string;
  sucursal: string;
  numero: string;
  cliente: string;
  importe: number;
  iva105: number | null;
  iva21: number | null;
  inscripcion: string;
  idTributario: string;
  cuit: string;
}

function formatearFechaExcel(fecha: string): string {
  const ymd = String(fecha || '').slice(0, 10);
  const [anio, mes, dia] = ymd.split('-');
  if (!anio || !mes || !dia) return '';
  return `${dia}/${mes}/${anio}`;
}

function nombreArchivo(prefijo: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${prefijo}_${y}-${m}-${d}.xlsx`;
}

export function exportarInformeIva(comprobantes: ComprobanteIva[], prefijoArchivo: string): void {
  const datos = comprobantes.map((item) => ({
    'F.cbte.': formatearFechaExcel(item.fecha),
    'Cbte.N°': item.numero,
    Importe: item.importe,
    'M.op.': '$',
    'IVA 10,50 %': item.iva105 ?? '',
    'IVA 21,00 %': item.iva21 ?? '',
    Inscripción: item.inscripcion,
    'Id.trib.': item.idTributario || 'CUIT',
    'N° Id.tri.': item.cuit
  }));

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'IVA');
  XLSX.writeFile(wb, nombreArchivo(prefijoArchivo));
}
