<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import { formatMoneyAR } from '$lib/utils/posTicket';
	import { armarPosTicketDto, type PosTicketTipo } from '$lib/utils/posTicketHtml';
	import { mensajeErrorImpresion, printTicket } from '$lib/services/QzTrayService';
	import { loadPosPrinterConfig } from '$lib/utils/posPrinterConfig';
	import { toast } from '$lib/utils/toast';
	import { Printer } from 'lucide-svelte';

	export let show = false;
	export let cajaId: number | null = null;
	export let sucursal = '0001';
	export let empresa: { Nombre?: string; RazonSocial?: string; Cuit?: string } | null = null;

	type Movimiento = {
		Tipo?: string;
		TipoDocumento?: string;
		DocumentoAsociado?: string;
		Concepto?: string;
		Importe?: number | string;
		FechaHora?: string;
		TipoPago?: { Descripcion?: string };
	};

	const TIPOS = new Set(['PRF', 'FCA', 'FCB']);
	const dispatch = createEventDispatcher<{ close: void }>();

	let loading = false;
	let error = '';
	let comprobantes: Movimiento[] = [];
	let abiertoAntes = false;
	let reimprimiendo = '';

	$: total = comprobantes.reduce((suma, item) => suma + Number(item.Importe || 0), 0);
	$: if (show && !abiertoAntes) {
		abiertoAntes = true;
		queueMicrotask(() => cargar());
	}
	$: if (!show) abiertoAntes = false;

	function etiqueta(tipo: string) {
		if (tipo === 'PRF') return 'Remito';
		if (tipo === 'FCA') return 'Ticket A';
		if (tipo === 'FCB') return 'Ticket B';
		return tipo;
	}

	function numeroDe(item: Movimiento) {
		const asociado = String(item.DocumentoAsociado || '').trim();
		if (asociado) return asociado;
		const concepto = String(item.Concepto || '');
		const partes = concepto.split(' ');
		return partes[partes.length - 1] || '';
	}

	function horaDe(valor?: string) {
		if (!valor) return '';
		const fecha = new Date(valor);
		if (Number.isNaN(fecha.getTime())) return '';
		return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
	}

	function claveDe(item: Movimiento) {
		const tipo = String(item.TipoDocumento || '') as PosTicketTipo;
		const concepto = String(item.Concepto || '');
		const match = concepto.match(/(\d{4})-(\S+)\s*$/);
		const sucursalDoc = match?.[1] || String(sucursal || '0001').padStart(4, '0');
		const numero = String(item.DocumentoAsociado || match?.[2] || '').trim();
		return { tipo, sucursal: sucursalDoc, numero, id: `${tipo}-${sucursalDoc}-${numero}` };
	}

	async function reimprimir(item: Movimiento) {
		const clave = claveDe(item);
		if (!clave.numero || reimprimiendo) return;
		reimprimiendo = clave.id;
		try {
			const response = await fetchWithAuth(
				`/facturas/${clave.tipo}/${clave.sucursal}/${encodeURIComponent(clave.numero)}`
			);
			const data = await response.json().catch(() => ({}));
			if (!response.ok || !data.success) {
				throw new Error(data.message || 'No se encontró el comprobante');
			}
			const encabezado = data.data?.encabezado || {};
			const items = data.data?.items || [];
			const dto = armarPosTicketDto({
				tipo: clave.tipo,
				sucursal: encabezado.DocumentoSucursal || clave.sucursal,
				numero: encabezado.DocumentoNumero || clave.numero,
				fecha: encabezado.FechaFormateada || String(encabezado.Fecha || '').slice(0, 10),
				empresa,
				cliente: encabezado.Cliente,
				items: items.map((linea: { Cantidad?: number; Descripcion?: string; TotalConIva?: number }) => ({
					Cantidad: Number(linea.Cantidad) || 0,
					Descripcion: linea.Descripcion || '',
					Total: Number(linea.TotalConIva) || 0
				})),
				totales: {
					ImporteNeto: Number(encabezado.ImporteNeto) || 0,
					ImporteIva: Number(encabezado.ImporteIva) || Number(encabezado.ImporteIva1 || 0) + Number(encabezado.ImporteIva2 || 0),
					ImporteTotal: Number(encabezado.ImporteTotal) || 0
				},
				cae: encabezado.afip_cae || undefined
			});
			await printTicket(dto, loadPosPrinterConfig());
			toast.success('Ticket reimpreso');
		} catch (err) {
			toast.error(mensajeErrorImpresion(err));
		} finally {
			reimprimiendo = '';
		}
	}

	async function cargar() {
		if (!cajaId) {
			comprobantes = [];
			error = 'No hay una caja abierta';
			return;
		}
		loading = true;
		error = '';
		try {
			const response = await fetchWithAuth(`/cajas/${cajaId}/movimientos`);
			const data = await response.json();
			if (!response.ok || !data.success) {
				throw new Error(data.message || 'No se pudo cargar el historial');
			}
			comprobantes = (data.data || []).filter(
				(item: Movimiento) => item.Tipo === 'ingreso' && TIPOS.has(String(item.TipoDocumento || ''))
			);
		} catch (err) {
			comprobantes = [];
			error = err instanceof Error ? err.message : 'No se pudo cargar el historial';
		} finally {
			loading = false;
		}
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
		<div
			class="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl"
			role="dialog"
			tabindex="-1"
			aria-labelledby="pos-historial-title"
		>
			<div class="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
				<div>
					<h2 id="pos-historial-title" class="text-lg font-semibold text-slate-900">Historial de la caja</h2>
					<p class="text-sm text-slate-500">Comprobantes de esta sesión</p>
				</div>
				<button type="button" class="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100" on:click={() => dispatch('close')}>
					Cerrar
				</button>
			</div>

			<div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
				{#if loading}
					<p class="text-sm text-slate-500">Cargando...</p>
				{:else if error}
					<p class="text-sm text-red-600">{error}</p>
				{:else if comprobantes.length === 0}
					<p class="text-sm text-slate-500">Todavía no hay comprobantes en esta caja.</p>
				{:else}
					<ul class="divide-y divide-slate-100 rounded-xl border border-slate-200">
						{#each comprobantes as item}
							<li class="flex items-center justify-between gap-3 px-3 py-3">
								<div class="min-w-0">
									<p class="truncate font-medium text-slate-900">
										{etiqueta(String(item.TipoDocumento || ''))}
										{numeroDe(item)}
									</p>
									<p class="text-sm text-slate-500">
										{horaDe(item.FechaHora)}
										{#if item.TipoPago?.Descripcion}
											· {item.TipoPago.Descripcion}
										{/if}
									</p>
								</div>
								<p class="shrink-0 font-semibold tabular-nums text-slate-900">{formatMoneyAR(Number(item.Importe || 0))}</p>
								<button
									type="button"
									class="shrink-0 rounded-lg border border-slate-200 px-2 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
									title="Reimprimir"
									disabled={reimprimiendo === claveDe(item).id}
									on:click={() => reimprimir(item)}
								>
									<Printer class="h-4 w-4" />
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			{#if !loading && !error}
				<div class="flex items-center justify-between border-t border-slate-100 px-5 py-4">
					<span class="text-sm text-slate-500">{comprobantes.length} comprobantes</span>
					<span class="text-lg font-semibold tabular-nums text-slate-900">{formatMoneyAR(total)}</span>
				</div>
			{/if}
		</div>
	</div>
{/if}
