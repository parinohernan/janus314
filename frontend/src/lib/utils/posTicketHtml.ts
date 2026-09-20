import { formatMoneyAR } from './posTicket';

export type PosTicketTipo = 'PRF' | 'FCA' | 'FCB';

export type PosTicketDto = {
	tipo: PosTicketTipo;
	sucursal: string;
	numero: string;
	fecha: string;
	empresa: { nombre: string; cuit?: string };
	cliente: { codigo: string; descripcion: string };
	items: { cantidad: number; descripcion: string; total: number }[];
	totales: { neto: number; iva: number; total: number };
	cae?: string;
};

const LABEL_TIPO: Record<PosTicketTipo, string> = {
	PRF: 'PREFACTURA',
	FCA: 'FACTURA A',
	FCB: 'TICKET B'
};

export function escapeHtml(value: string): string {
	return String(value || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function extraerCae(payload: unknown): string | undefined {
	if (!payload || typeof payload !== 'object') return undefined;
	const root = payload as Record<string, unknown>;
	const candidates = [root.cae, root.CAE];
	for (const value of candidates) {
		if (typeof value === 'string' && value.trim()) return value.trim();
	}
	if (root.data && typeof root.data === 'object') {
		const nested = root.data as Record<string, unknown>;
		for (const value of [nested.cae, nested.CAE]) {
			if (typeof value === 'string' && value.trim()) return value.trim();
		}
	}
	return undefined;
}

export function armarPosTicketDto(input: {
	tipo: PosTicketTipo;
	sucursal: string;
	numero: string;
	fecha: string;
	empresa?: { Nombre?: string; RazonSocial?: string; Cuit?: string } | null;
	cliente?: { Codigo?: string; Descripcion?: string } | null;
	items: { Cantidad: number; Descripcion: string; DescripcionLibre?: string; Total: number }[];
	totales: { ImporteNeto: number; ImporteIva?: number; ImporteIva1?: number; ImporteIva2?: number; ImporteTotal: number };
	cae?: string;
}): PosTicketDto {
	const iva =
		Number(input.totales.ImporteIva) ||
		Number(input.totales.ImporteIva1 || 0) + Number(input.totales.ImporteIva2 || 0);
	return {
		tipo: input.tipo,
		sucursal: String(input.sucursal || '').padStart(4, '0'),
		numero: String(input.numero || ''),
		fecha: input.fecha,
		empresa: {
			nombre: input.empresa?.Nombre || input.empresa?.RazonSocial || 'Empresa',
			cuit: input.empresa?.Cuit
		},
		cliente: {
			codigo: input.cliente?.Codigo || 'CF',
			descripcion: input.cliente?.Descripcion || 'Consumidor Final'
		},
		items: input.items.map((item) => ({
			cantidad: Number(item.Cantidad) || 0,
			descripcion: String(item.DescripcionLibre || item.Descripcion || '').slice(0, 100),
			total: Number(item.Total) || 0
		})),
		totales: {
			neto: Number(input.totales.ImporteNeto) || 0,
			iva,
			total: Number(input.totales.ImporteTotal) || 0
		},
		cae: input.cae
	};
}

export function ticketPrueba(): PosTicketDto {
	return {
		tipo: 'PRF',
		sucursal: '0001',
		numero: '00000000',
		fecha: '2026-09-20',
		empresa: { nombre: 'Prueba POS', cuit: '00000000000' },
		cliente: { codigo: 'CF', descripcion: 'Consumidor Final' },
		items: [{ cantidad: 1, descripcion: 'Item de prueba', total: 1 }],
		totales: { neto: 0.83, iva: 0.17, total: 1 }
	};
}

function filaItem(item: PosTicketDto['items'][number]): string {
	const qty = Number(item.cantidad).toLocaleString('es-AR', { maximumFractionDigits: 3 });
	return `<tr>
		<td class="qty">${escapeHtml(qty)}</td>
		<td class="desc">${escapeHtml(item.descripcion)}</td>
		<td class="imp">${escapeHtml(formatMoneyAR(item.total))}</td>
	</tr>`;
}

export function renderPosTicketHtml(dto: PosTicketDto): string {
	const comprobante = `${dto.sucursal}-${dto.numero}`;
	const leyendaFiscal =
		dto.tipo === 'PRF'
			? '<p class="warn">Documento no válido como factura</p>'
			: dto.cae
				? `<p class="cae">CAE ${escapeHtml(dto.cae)}</p>`
				: '';

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    width: 72mm;
    margin: 0;
    padding: 2mm;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    color: #000;
  }
  h1 { font-size: 14px; margin: 0 0 4px; text-align: center; }
  .muted { font-size: 11px; text-align: center; margin: 0; }
  .tipo { font-size: 13px; font-weight: 700; text-align: center; margin: 8px 0 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td { vertical-align: top; padding: 2px 0; }
  .qty { width: 12mm; }
  .imp { width: 22mm; text-align: right; white-space: nowrap; }
  .totales { margin-top: 8px; width: 100%; }
  .totales td { padding: 1px 0; }
  .total { font-size: 22px; font-weight: 700; }
  .warn, .cae { text-align: center; margin-top: 10px; font-weight: 700; }
  hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
</style>
</head>
<body>
  <h1>${escapeHtml(dto.empresa.nombre)}</h1>
  ${dto.empresa.cuit ? `<p class="muted">CUIT ${escapeHtml(dto.empresa.cuit)}</p>` : ''}
  <p class="tipo">${LABEL_TIPO[dto.tipo]} ${escapeHtml(comprobante)}</p>
  <p class="muted">${escapeHtml(dto.fecha)}</p>
  <p class="muted">${escapeHtml(dto.cliente.descripcion)} (${escapeHtml(dto.cliente.codigo)})</p>
  <hr />
  <table>
    ${dto.items.map(filaItem).join('')}
  </table>
  <hr />
  <table class="totales">
    <tr><td>Neto</td><td class="imp">${escapeHtml(formatMoneyAR(dto.totales.neto))}</td></tr>
    <tr><td>IVA</td><td class="imp">${escapeHtml(formatMoneyAR(dto.totales.iva))}</td></tr>
    <tr><td class="total">Total</td><td class="imp total">${escapeHtml(formatMoneyAR(dto.totales.total))}</td></tr>
  </table>
  ${leyendaFiscal}
</body>
</html>`;
}
