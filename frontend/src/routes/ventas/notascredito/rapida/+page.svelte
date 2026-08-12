<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto, beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { navigationState } from '$lib/stores/navigationState';
	import Button from '$lib/components/ui/Button.svelte';
	import { PreventaService } from '$lib/services/PreventaService';
	import { NotaCreditoService } from '$lib/services/NotaCreditoService';
	import { FacturaService } from '$lib/services/FacturaService';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import type { Preventa } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatters';
	import CaeModal from '$lib/components/facturas/CaeModal.svelte';
	import ImprimirModal from '$lib/components/facturas/ImprimirModal.svelte';
	import DetalleFacturaModal from '$lib/components/facturas/DetalleFacturaModal.svelte';

	type TipoNC = 'NCA' | 'NCB' | 'NCF';
	type FacturaOption = { tipo: string; sucursal: string; numero: string; fecha: string; total: number; label: string };

	let preventa: Preventa | null = null;
	let loadingPreventa = true;
	let loadingFacturas = false;
	let loadingSubmit = false;
	let error: string | null = null;
	let formasPago: { value: string; label: string }[] = [];
	let formaPagoCodigo = 'CC';
	let documentoTipo: TipoNC = 'NCF';
	let facturasCliente: FacturaOption[] = [];
	let facturaSeleccionada: FacturaOption | null = null;
	let notaCreditoCreada: { DocumentoTipo: string; DocumentoSucursal: string; DocumentoNumero: string } | null = null;
	let showCaeModal = false;
	let showImprimirModal = false;
	let showDetalleFacturaModal = false;
	let facturaSeleccionadaParaDetalle: FacturaOption | null = null;
	let itemsFacturaDetalle: any[] = [];
	let cargandoDetalleFactura = false;

	const tiposNC: { value: TipoNC; label: string }[] = [
		{ value: 'NCA', label: 'Nota de crédito A' },
		{ value: 'NCB', label: 'Nota de crédito B' },
		{ value: 'NCF', label: 'Nota de crédito F' }
	];

	const NC_RAPIDA_PATH = '/ventas/notascredito/rapida';
	let skipPersist = false;

	$: preventaParam = $page.url.searchParams.get('preventa'); // PRV/0001/00000123
	$: [preventaTipo, preventaSucursal, preventaNumero] = preventaParam ? preventaParam.split('/') : [null, null, null];

	const subtotalPreventaItem = (item: Preventa['items'][number]) =>
		(item.Cantidad ?? 0) * (item.PrecioUnitario ?? 0);

	$: totalItemsPreventa =
		preventa?.items?.reduce((sum, item) => sum + subtotalPreventaItem(item), 0) ?? 0;

	onMount(async () => {
		if (!preventaParam || !preventaTipo || !preventaSucursal || !preventaNumero) {
			error = 'Falta el parámetro preventa (ej: ?preventa=PRV/0001/00000123)';
			loadingPreventa = false;
			return;
		}

		try {
			preventa = await PreventaService.obtenerPreventa(preventaTipo, preventaSucursal, preventaNumero);
			error = null;
			// Cargar facturas del cliente para comprobante asociado
			if (preventa?.preventa?.ClienteCodigo) {
				loadingFacturas = true;
				const res = await FacturaService.obtenerUltimasFacturasCliente(preventa.preventa.ClienteCodigo, 50);
				if (res.success && res.data?.length) {
					facturasCliente = res.data.map((f: { tipo: string; sucursal: string; numero: string; fecha: string; total: number; label: string }) => ({
						tipo: f.tipo,
						sucursal: f.sucursal,
						numero: f.numero,
						fecha: f.fecha,
						total: f.total ?? 0,
						label: f.label
					}));
					if (!facturaSeleccionada && facturasCliente.length > 0) facturaSeleccionada = facturasCliente[0];
				} else {
					facturasCliente = [];
					facturaSeleccionada = null;
				}
				loadingFacturas = false;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error al cargar la preventa';
			preventa = null;
		} finally {
			loadingPreventa = false;
		}

		// Cargar formas de pago
		try {
			const response = await fetchWithAuth('/tipos-pago');
			if (response.ok) {
				const data = await response.json();
				formasPago = (data.items || []).map((item: { Codigo: string; Descripcion: string }) => ({
					value: item.Codigo,
					label: item.Descripcion
				}));
				if (formasPago.length && !formasPago.find((fp) => fp.value === 'CC')) {
					formaPagoCodigo = formasPago[0].value;
				}
			}
		} catch (_) {
			// usar default CC
		}

		// Restaurar estado persistido (solo si coincide el preventa param)
		if (browser && preventaParam) {
			const savedState = navigationState.getState(NC_RAPIDA_PATH);
			const filters = savedState?.filters as {
				preventaParam?: string;
				formaPagoCodigo?: string;
				documentoTipo?: TipoNC;
				facturaSeleccionada?: FacturaOption | null;
			} | undefined;
			if (filters?.preventaParam === preventaParam) {
				if (filters.formaPagoCodigo) formaPagoCodigo = filters.formaPagoCodigo;
				if (filters.documentoTipo) documentoTipo = filters.documentoTipo;
				if (filters.facturaSeleccionada && facturasCliente.some(f => f.tipo === filters.facturaSeleccionada?.tipo && f.numero === filters.facturaSeleccionada?.numero)) {
					facturaSeleccionada = filters.facturaSeleccionada;
				}
				if (savedState?.scroll && typeof window !== 'undefined') {
					requestAnimationFrame(() => window.scrollTo(0, savedState.scroll));
				}
			}
		}
	});

	beforeNavigate(({ from }) => {
		if (skipPersist) {
			skipPersist = false;
			return;
		}
		if (from?.url.pathname === NC_RAPIDA_PATH && browser && preventaParam) {
			const currentState = navigationState.getState(NC_RAPIDA_PATH) || {};
			navigationState.saveState(NC_RAPIDA_PATH, {
				...currentState,
				scroll: typeof window !== 'undefined' ? window.scrollY : 0,
				filters: {
					preventaParam,
					formaPagoCodigo,
					documentoTipo,
					facturaSeleccionada
				}
			});
		}
	});

	async function generarNotaCredito() {
		if (!preventaTipo || !preventaSucursal || !preventaNumero) return;
		if (!facturaSeleccionada) {
			error = 'Debe seleccionar una factura del cliente como comprobante asociado.';
			return;
		}
		loadingSubmit = true;
		error = null;
		try {
			const resultado = await NotaCreditoService.crearNotaCreditoRapidaDesdePreventa(
				preventaTipo,
				preventaSucursal,
				preventaNumero,
				{
					formaPagoCodigo,
					documentoTipo,
					facturaReferencia: {
						tipo: facturaSeleccionada.tipo,
						sucursal: facturaSeleccionada.sucursal,
						numero: facturaSeleccionada.numero
					}
				}
			);
			if (resultado.success && resultado.data) {
				notaCreditoCreada = resultado.data;
				// NCA/NCB: obtener CAE desde AFIP (modal); NCF: ir directo a impresión
				if (documentoTipo === 'NCA' || documentoTipo === 'NCB') {
					showCaeModal = true;
				} else {
					showImprimirModal = true;
				}
			} else {
				error = resultado.error || 'Error al crear la nota de crédito';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error desconocido';
		} finally {
			loadingSubmit = false;
		}
	}

	function irAImprimir() {
		if (!notaCreditoCreada) return;
		skipPersist = true;
		if (browser) navigationState.clearState(NC_RAPIDA_PATH);
		goto(
			`/ventas/notascredito/imprimir/${notaCreditoCreada.DocumentoTipo}/${notaCreditoCreada.DocumentoSucursal}/${notaCreditoCreada.DocumentoNumero}`
		);
	}

	function handleCloseCaeModal() {
		showCaeModal = false;
		showImprimirModal = true;
	}

	function handleImprimirModalImprimir() {
		showImprimirModal = false;
		irAImprimir();
	}

	function handleImprimirModalCancelar() {
		showImprimirModal = false;
		skipPersist = true;
		if (browser) navigationState.clearState(NC_RAPIDA_PATH);
		goto('/ventas/notascredito');
	}

	function handleImprimirModalClose() {
		showImprimirModal = false;
		skipPersist = true;
		if (browser) navigationState.clearState(NC_RAPIDA_PATH);
		goto('/ventas/notascredito');
	}

	function seleccionarFactura(factura: FacturaOption) {
		facturaSeleccionada = factura;
	}

	async function abrirDetalleFactura(factura: FacturaOption) {
		try {
			cargandoDetalleFactura = true;
			showDetalleFacturaModal = true;
			facturaSeleccionadaParaDetalle = factura;
			itemsFacturaDetalle = [];
			const resultado = await FacturaService.obtenerDetalleFactura(factura.tipo, factura.sucursal, factura.numero);
			if (resultado.success && resultado.data) {
				itemsFacturaDetalle = resultado.data.items ?? [];
			}
		} catch (e) {
			itemsFacturaDetalle = [];
		} finally {
			cargandoDetalleFactura = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-6">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold text-gray-800">Nueva nota de crédito RÁPIDA</h1>
		<Button variant="secondary" on:click={() => goto('/ventas/preventas')}>Volver a Preventas</Button>
	</div>

	{#if !preventaParam}
		<div class="bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded">
			Use esta pantalla desde el listado de preventas con la acción "Generar nota de crédito".
		</div>
		<p class="mt-2">
			<a href="/ventas/preventas" class="text-indigo-600 hover:underline">Ir a preventas</a>
		</p>
	{:else if loadingPreventa}
		<div class="flex justify-center py-12">
			<div class="spinner"></div>
		</div>
	{:else if error && !preventa}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
		<p class="mt-2">
			<Button variant="secondary" on:click={() => goto('/ventas/preventas')}>Volver a Preventas</Button>
		</p>
	{:else if preventa && !notaCreditoCreada}
		<!-- Resumen preventa -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<h2 class="text-lg font-semibold text-gray-700 mb-4">Preventa de origen (devolución)</h2>
			<p class="text-sm text-gray-600">
				<strong>Documento:</strong> {preventa.preventa.DocumentoTipo}-{preventa.preventa.DocumentoSucursal}-{preventa.preventa.DocumentoNumero}
			</p>
			<p class="text-sm text-gray-600">
				<strong>Cliente:</strong> {preventa.preventa.Cliente?.Descripcion || preventa.preventa.ClienteCodigo}
			</p>
			<p class="text-sm text-gray-600 mt-1">
				<strong>Total preventa:</strong> {formatCurrency(preventa.preventa.ImporteTotal ?? 0)}
			</p>
			<div class="mt-4 overflow-x-auto">
				<table class="min-w-full text-sm">
					<thead>
						<tr class="border-b">
							<th class="text-left py-2">Artículo</th>
							<th class="text-right py-2">Cant.</th>
							<th class="text-right py-2">P. unit.</th>
							<th class="text-right py-2">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						{#each preventa.items as item}
							<tr class="border-b border-gray-100">
								<td class="py-1">{item.Articulo?.Descripcion || item.CodigoArticulo}</td>
								<td class="text-right">{item.Cantidad}</td>
								<td class="text-right">{formatCurrency(item.PrecioUnitario ?? 0)}</td>
								<td class="text-right">{formatCurrency(subtotalPreventaItem(item))}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="border-t-2 border-gray-300 bg-gray-50 font-semibold">
							<td colspan="3" class="py-2 text-right text-gray-700">Total</td>
							<td class="py-2 text-right text-gray-900">{formatCurrency(totalItemsPreventa)}</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>

		<!-- Formulario: tipo, forma de pago y panel Facturas de Referencia (igual que /ventas/notascredito/nueva) -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<h2 class="text-lg font-semibold text-gray-700 mb-4">Generar nota de crédito (devolución)</h2>
			<p class="text-sm text-gray-500 mb-4">
				Se creará una NC con el contenido de esta preventa. Seleccione la <strong>factura de referencia</strong> (comprobante asociado) del cliente.
			</p>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mb-6">
				<div>
					<label for="tipoNC" class="block text-sm font-medium text-gray-700 mb-1">Tipo de comprobante</label>
					<select
						id="tipoNC"
						bind:value={documentoTipo}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
					>
						{#each tiposNC as t}
							<option value={t.value}>{t.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="formaPago" class="block text-sm font-medium text-gray-700 mb-1">Forma de pago</label>
					<select
						id="formaPago"
						bind:value={formaPagoCodigo}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
					>
						{#each formasPago as fp}
							<option value={fp.value}>{fp.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Panel Facturas de Referencia (igual que en ventas/notascredito/nueva) -->
			<div id="facturas-referencia-rapida" role="group" aria-labelledby="facturas-ref-label">
				<span id="facturas-ref-label" class="block text-sm font-medium text-gray-700 mb-2">Facturas de Referencia</span>
				<div class="border border-gray-300 rounded-md bg-gray-50" style="height: 300px; overflow-y: auto;">
					{#if loadingFacturas}
						<div class="flex justify-center items-center h-full">
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
						</div>
					{:else if facturasCliente.length === 0}
						<div class="flex justify-center items-center h-full text-amber-700 text-sm">
							<p>Este cliente no tiene facturas. No se puede generar una NC rápida sin factura asociada.</p>
						</div>
					{:else}
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-100 sticky top-0">
								<tr>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
									<th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
									<th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each facturasCliente as factura}
									<tr
										class="hover:bg-blue-50 cursor-pointer {facturaSeleccionada && facturaSeleccionada.tipo === factura.tipo && facturaSeleccionada.sucursal === factura.sucursal && facturaSeleccionada.numero === factura.numero ? 'bg-blue-100' : ''}"
										on:click={() => seleccionarFactura(factura)}
									>
										<td class="px-4 py-2 text-sm">{factura.tipo}</td>
										<td class="px-4 py-2 text-sm">{factura.sucursal}-{factura.numero}</td>
										<td class="px-4 py-2 text-sm">{factura.fecha ? new Date(factura.fecha).toLocaleDateString('es-AR') : '—'}</td>
										<td class="px-4 py-2 text-sm text-right">{formatCurrency(factura.total)}</td>
										<td class="px-4 py-2 text-center">
											<button
												on:click|stopPropagation={() => abrirDetalleFactura(factura)}
												class="text-blue-600 hover:text-blue-900"
												aria-label="Ver detalle"
											>
												<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
												</svg>
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				</div>
				{#if facturaSeleccionada}
					<p class="text-sm text-gray-600 mt-2">
						Factura seleccionada: <span class="font-medium">{facturaSeleccionada.tipo}-{facturaSeleccionada.sucursal}-{facturaSeleccionada.numero}</span>
					</p>
				{/if}
			</div>
		</div>

		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
		{/if}

		<div class="flex gap-3">
			<Button
				variant="primary"
				on:click={generarNotaCredito}
				disabled={loadingSubmit || !facturaSeleccionada || facturasCliente.length === 0}
			>
				{#if loadingSubmit}
					<span class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
				{/if}
				Generar nota de crédito
			</Button>
			<Button variant="secondary" on:click={() => goto('/ventas/preventas')}>Cancelar</Button>
		</div>
	{:else if notaCreditoCreada && !showCaeModal && !showImprimirModal}
		<div class="bg-green-50 border border-green-200 rounded-lg p-6">
			<h2 class="text-lg font-semibold text-green-800 mb-2">Nota de crédito creada</h2>
			<p class="text-gray-700">
				{notaCreditoCreada.DocumentoTipo} {notaCreditoCreada.DocumentoSucursal}-{notaCreditoCreada.DocumentoNumero}
			</p>
			<div class="mt-4 flex gap-3">
				<Button variant="primary" on:click={irAImprimir}>Imprimir</Button>
				<Button variant="secondary" on:click={() => goto('/ventas/notascredito')}>Ir a listado de notas de crédito</Button>
				<Button variant="secondary" on:click={() => goto('/ventas/preventas')}>Volver a preventas</Button>
			</div>
		</div>
	{/if}
</div>

<!-- Modal de detalle de factura (Facturas de Referencia) -->
<DetalleFacturaModal
	bind:show={showDetalleFacturaModal}
	factura={facturaSeleccionadaParaDetalle}
	items={itemsFacturaDetalle}
	loading={cargandoDetalleFactura}
	on:close={() => (showDetalleFacturaModal = false)}
	on:seleccionar={(e) => {
		if (e.detail) seleccionarFactura(e.detail);
		showDetalleFacturaModal = false;
	}}
/>

{#if notaCreditoCreada}
	<!-- Modal CAE (NCA/NCB): obtener CAE desde AFIP -->
	<CaeModal
		bind:show={showCaeModal}
		factura={notaCreditoCreada}
		on:close={handleCloseCaeModal}
		on:caeObtenido={() => {}}
		on:imprimir={irAImprimir}
	/>

	<!-- Modal impresión -->
	<ImprimirModal
		bind:show={showImprimirModal}
		factura={notaCreditoCreada}
		on:close={handleImprimirModalClose}
		on:imprimir={handleImprimirModalImprimir}
		on:cancelar={handleImprimirModalCancelar}
	/>
{/if}

<style>
	.spinner {
		border: 4px solid rgba(0, 0, 0, 0.1);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border-left-color: #09f;
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
