<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import { PreventaService } from '$lib/services/PreventaService';
	import { NotaCreditoService } from '$lib/services/NotaCreditoService';
	import { FacturaService } from '$lib/services/FacturaService';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import type { Preventa } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatters';
	import CaeModal from '$lib/components/facturas/CaeModal.svelte';
	import ImprimirModal from '$lib/components/facturas/ImprimirModal.svelte';

	type TipoNC = 'NCA' | 'NCB' | 'NCF';
	type FacturaOption = { tipo: string; sucursal: string; numero: string; label: string };

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

	const tiposNC: { value: TipoNC; label: string }[] = [
		{ value: 'NCA', label: 'Nota de crédito A' },
		{ value: 'NCB', label: 'Nota de crédito B' },
		{ value: 'NCF', label: 'Nota de crédito F' }
	];

	$: preventaParam = $page.url.searchParams.get('preventa'); // PRV/0001/00000123
	$: [preventaTipo, preventaSucursal, preventaNumero] = preventaParam ? preventaParam.split('/') : [null, null, null];

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
				const res = await FacturaService.obtenerUltimasFacturasCliente(preventa.preventa.ClienteCodigo, 30);
				if (res.success && res.data?.length) {
					facturasCliente = res.data.map((f: { tipo: string; sucursal: string; numero: string; label: string }) => ({
						tipo: f.tipo,
						sucursal: f.sucursal,
						numero: f.numero,
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
		goto('/ventas/notascredito');
	}

	function handleImprimirModalClose() {
		showImprimirModal = false;
		goto('/ventas/notascredito');
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
								<td class="text-right">{formatCurrency((item.Cantidad ?? 0) * (item.PrecioUnitario ?? 0))}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Formulario -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<h2 class="text-lg font-semibold text-gray-700 mb-4">Generar nota de crédito (devolución)</h2>
			<p class="text-sm text-gray-500 mb-4">
				Se creará una NC con el contenido de esta preventa. El comprobante asociado debe ser una <strong>factura de este cliente</strong>.
			</p>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
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
				<div class="md:col-span-2">
					<label for="facturaRef" class="block text-sm font-medium text-gray-700 mb-1">Factura asociada (comprobante asociado) *</label>
					{#if loadingFacturas}
						<p class="text-sm text-gray-500">Cargando facturas del cliente…</p>
					{:else if facturasCliente.length === 0}
						<p class="text-amber-700 text-sm">Este cliente no tiene facturas. No se puede generar una NC rápida sin factura asociada.</p>
					{:else}
						<select
							id="facturaRef"
							value={facturaSeleccionada ? `${facturaSeleccionada.tipo}-${facturaSeleccionada.sucursal}-${facturaSeleccionada.numero}` : ''}
							on:change={(e) => {
								const key = (e.target as HTMLSelectElement).value;
								facturaSeleccionada = facturasCliente.find((f) => `${f.tipo}-${f.sucursal}-${f.numero}` === key) || facturasCliente[0] || null;
							}}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
						>
							{#each facturasCliente as f}
								<option value={[f.tipo, f.sucursal, f.numero].join('-')}>{f.label}</option>
							{/each}
						</select>
					{/if}
				</div>
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
