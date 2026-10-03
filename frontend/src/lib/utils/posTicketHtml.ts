import { formatMoneyAR } from './posTicket';

export type PosTicketTipo = 'PRF' | 'FCA' | 'FCB';

export type PosTicketDto = {
	tipo: PosTicketTipo;
	sucursal: string;
	numero: string;
	fecha: string;
	empresa: {
		nombre: string;
		cuit?: string;
		domicilio?: string;
		localidad?: string;
		telefono?: string;
		ingresosBrutos?: string;
		inicioActividades?: string;
		condicionIva?: string;
		logo?: string;
	};
	cliente: { codigo: string; descripcion: string; cuit?: string; categoriaIva?: string };
	items: { cantidad: number; descripcion: string; total: number }[];
	totales: { neto: number; iva: number; total: number };
	cae?: string;
	caeVencimiento?: string;
	qr?: string;
};

const LABEL_TIPO: Record<PosTicketTipo, string> = {
	PRF: 'PREFACTURA',
	FCA: 'FACTURA A',
	FCB: 'TICKET B'
};

const CONDICION_IVA: Record<string, string> = {
	I: 'Responsable Inscrito',
	M: 'Monotributista',
	E: 'Exento'
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

function textoEn(payload: unknown, claves: string[]): string | undefined {
	if (!payload || typeof payload !== 'object') return undefined;
	const root = payload as Record<string, unknown>;
	const capas = [root, root.data].filter((capa) => capa && typeof capa === 'object') as Record<string, unknown>[];
	for (const capa of capas) {
		for (const clave of claves) {
			const valor = capa[clave];
			if (typeof valor === 'string' && valor.trim()) return valor.trim();
		}
	}
	return undefined;
}

export function extraerFiscal(payload: unknown): { cae?: string; vencimiento?: string } {
	return {
		cae: extraerCae(payload),
		vencimiento: textoEn(payload, [
			'fechaVencimiento',
			'fecha_vencimiento',
			'afip_cae_vencimiento',
			'vencimiento'
		])
	};
}

const TIPO_COMPROBANTE_ARCA: Record<string, number> = {
	FCA: 1,
	FCB: 6
};

function soloDigitos(valor?: string): string {
	return String(valor || '').replace(/\D/g, '');
}

function fechaQr(fecha: string): string {
	const directa = String(fecha || '').slice(0, 10);
	if (/^\d{4}-\d{2}-\d{2}$/.test(directa)) return directa;
	const date = new Date(fecha);
	if (Number.isNaN(date.getTime())) return '';
	return date.toISOString().split('T')[0];
}

function aBase64(texto: string): string {
	if (typeof Buffer !== 'undefined') return Buffer.from(texto, 'utf8').toString('base64');
	return btoa(texto);
}

/** Misma carga que el QR de los PDF: especificación ARCA, tipos FCA=1 y FCB=6. */
export function urlQrArca(dto: PosTicketDto): string | null {
	if (dto.tipo !== 'FCA' && dto.tipo !== 'FCB') return null;
	const cuit = soloDigitos(dto.empresa.cuit);
	const cae = String(dto.cae || '').trim();
	const fecha = fechaQr(dto.fecha);
	const tipoCmp = TIPO_COMPROBANTE_ARCA[dto.tipo];
	if (!cuit || !cae || !fecha || !tipoCmp) return null;

	const responsableInscripto = dto.cliente.categoriaIva === 'I';
	const documento = soloDigitos(dto.cliente.cuit);
	const datos = {
		ver: 1,
		fecha,
		cuit,
		ptoVta: parseInt(dto.sucursal, 10) || 0,
		tipoCmp,
		nroCmp: parseInt(dto.numero, 10) || 0,
		importe: parseFloat(Number(dto.totales.total).toFixed(2)),
		moneda: 'PES',
		ctz: 1,
		tipoDocRec: responsableInscripto ? 80 : 96,
		nroDocRec: documento || '00000000000',
		tipoCodAut: 'E',
		codAut: cae
	};
	return `https://www.arca.gob.ar/fe/qr/?p=${aBase64(JSON.stringify(datos))}`;
}

function fechaVisible(valor?: string): string {
	const match = String(valor || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!match) return String(valor || '');
	return `${match[3]}/${match[2]}/${match[1]}`;
}

export function armarPosTicketDto(input: {
	tipo: PosTicketTipo;
	sucursal: string;
	numero: string;
	fecha: string;
	empresa?: {
		Nombre?: string;
		RazonSocial?: string;
		Cuit?: string;
		Domicilio?: string;
		DomicilioComercial?: string;
		Localidad?: string;
		Telefono?: string;
		IngresosBrutos?: string;
		InicioActividades?: string;
		CategoriaIva?: string;
		LogoURL?: string;
	} | null;
	cliente?: { Codigo?: string; Descripcion?: string; Cuit?: string; CategoriaIva?: string } | null;
	items: { Cantidad: number; Descripcion: string; DescripcionLibre?: string; Total: number }[];
	totales: { ImporteNeto: number; ImporteIva?: number; ImporteIva1?: number; ImporteIva2?: number; ImporteTotal: number };
	cae?: string;
	caeVencimiento?: string;
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
			nombre: input.empresa?.RazonSocial || input.empresa?.Nombre || 'Empresa',
			cuit: input.empresa?.Cuit,
			domicilio: input.empresa?.DomicilioComercial || input.empresa?.Domicilio,
			localidad: input.empresa?.Localidad,
			telefono: input.empresa?.Telefono,
			ingresosBrutos: input.empresa?.IngresosBrutos,
			inicioActividades: input.empresa?.InicioActividades,
			condicionIva: CONDICION_IVA[String(input.empresa?.CategoriaIva || '').trim()] || '',
			logo: input.empresa?.LogoURL
		},
		cliente: {
			codigo: input.cliente?.Codigo || 'CF',
			descripcion: input.cliente?.Descripcion || 'Consumidor Final',
			cuit: input.cliente?.Cuit,
			categoriaIva: input.cliente?.CategoriaIva
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
		cae: input.cae,
		caeVencimiento: input.caeVencimiento
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

function linea(texto?: string): string {
	const limpio = String(texto || '').trim();
	if (!limpio) return '';
	return `<p class="muted">${escapeHtml(limpio)}</p>`;
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
				? `<div class="fiscal">
        ${dto.qr ? `<img class="qr" src="${escapeHtml(dto.qr)}" alt="QR ARCA" />` : ''}
        <p class="cae">CAE N°: ${escapeHtml(dto.cae)}</p>
        ${dto.caeVencimiento ? `<p class="cae">Fecha Vto. CAE: ${escapeHtml(fechaVisible(dto.caeVencimiento))}</p>` : ''}
        <p class="leyenda">Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación</p>
      </div>`
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
  h1 { font-size: 14px; margin: 0 0 2px; text-align: center; }
  .logo { display: block; margin: 0 auto 3px; max-width: 32mm; max-height: 16mm; object-fit: contain; }
  .muted { font-size: 11px; text-align: center; margin: 0; }
  .tipo { font-size: 13px; font-weight: 700; text-align: center; margin: 8px 0 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td { vertical-align: top; padding: 2px 0; }
  .qty { width: 12mm; }
  .imp { width: 22mm; text-align: right; white-space: nowrap; }
  .totales { margin-top: 8px; width: 100%; }
  .totales td { padding: 1px 0; }
  .total { font-size: 22px; font-weight: 700; }
  .warn, .cae { text-align: center; margin-top: 6px; font-weight: 700; }
  .fiscal { text-align: center; margin-top: 8px; }
  .qr { width: 32mm; height: 32mm; }
  .leyenda { font-size: 9px; font-weight: 400; margin: 6px 0 0; }
  hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
</style>
</head>
<body>
  ${dto.empresa.logo ? `<img class="logo" src="${escapeHtml(dto.empresa.logo)}" alt="" />` : ''}
  <h1>${escapeHtml(dto.empresa.nombre)}</h1>
  ${linea(dto.empresa.domicilio)}
  ${linea(dto.empresa.localidad)}
  ${linea(dto.empresa.telefono ? `Teléfono: ${dto.empresa.telefono}` : '')}
  ${linea(dto.empresa.cuit ? `CUIT: ${dto.empresa.cuit}` : '')}
  ${linea(dto.empresa.condicionIva ? `IVA: ${dto.empresa.condicionIva}` : '')}
  ${linea(dto.empresa.ingresosBrutos ? `Ingresos Brutos: ${dto.empresa.ingresosBrutos}` : '')}
  ${linea(dto.empresa.inicioActividades ? `Inicio de Actividades: ${fechaVisible(dto.empresa.inicioActividades)}` : '')}
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
