<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import { PreventaService } from '$lib/services/PreventaService';
	import { NotaCreditoService } from '$lib/services/NotaCreditoService';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import type { Preventa } from '$lib/types';
	import { formatCurrency } from '$lib/utils/formatters';

	let preventa: Preventa | null = null;
	let loadingPreventa = true;
	let loadingSubmit = false;
	let error: string | null = null;
	let formasPago: { value: string; label: string }[] = [];
	let formaPagoCodigo = 'CC';
	let notaCreditoCreada: { DocumentoTipo: string; DocumentoSucursal: string; DocumentoNumero: string } | null = null;

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
		loadingSubmit = true;
		error = null;
		try {
			const resultado = await NotaCreditoService.crearNotaCreditoRapidaDesdePreventa(
				preventaTipo,
				preventaSucursal,
				preventaNumero,
				formaPagoCodigo
			);
			if (resultado.success && resultado.data) {
				notaCreditoCreada = resultado.data;
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

		<!-- Formulario mínimo -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<h2 class="text-lg font-semibold text-gray-700 mb-4">Generar nota de crédito tipo F</h2>
			<p class="text-sm text-gray-500 mb-4">
				Se creará una NCF con el contenido de esta preventa. Comprobante asociado: el mismo número de la NC (devolución).
			</p>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
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
		</div>

		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
		{/if}

		<div class="flex gap-3">
			<Button
				variant="primary"
				on:click={generarNotaCredito}
				disabled={loadingSubmit}
			>
				{#if loadingSubmit}
					<span class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
				{/if}
				Generar nota de crédito
			</Button>
			<Button variant="secondary" on:click={() => goto('/ventas/preventas')}>Cancelar</Button>
		</div>
	{:else if notaCreditoCreada}
		<div class="bg-green-50 border border-green-200 rounded-lg p-6">
			<h2 class="text-lg font-semibold text-green-800 mb-2">Nota de crédito creada</h2>
			<p class="text-gray-700">
				NCF {notaCreditoCreada.DocumentoSucursal}-{notaCreditoCreada.DocumentoNumero}
			</p>
			<div class="mt-4 flex gap-3">
				<Button variant="primary" on:click={irAImprimir}>Imprimir</Button>
				<Button variant="secondary" on:click={() => goto('/ventas/notascredito')}>Ir a listado de notas de crédito</Button>
				<Button variant="secondary" on:click={() => goto('/ventas/preventas')}>Volver a preventas</Button>
			</div>
		</div>
	{/if}
</div>

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
