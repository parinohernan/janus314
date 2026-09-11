<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { AfipService, type EstadoArca } from '$lib/services/AfipService';
	import Button from '$lib/components/ui/Button.svelte';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

	let loading = true;
	let error: string | null = null;
	let estadoArca: EstadoArca | null = null;
	let sucursal: string | null = null;

	// Tipos de comprobantes que queremos mostrar
	const tiposComprobantes = [
		{ tipo: 'FCA', descripcion: 'Factura A' },
		{ tipo: 'FCB', descripcion: 'Factura B' },
		{ tipo: 'FCC', descripcion: 'Factura C' },
		{ tipo: 'NCA', descripcion: 'Nota de Crédito A' },
		{ tipo: 'NCB', descripcion: 'Nota de Crédito B' },
		{ tipo: 'NCC', descripcion: 'Nota de Crédito C' }
	];

	async function cargarDatosEmpresa() {
		try {
			const responseEmpresa = await fetchWithAuth(`/datos-empresa`);
			
			if (!responseEmpresa.ok) {
				throw new Error('Error al cargar datos de la empresa');
			}
			
			const { data } = await responseEmpresa.json();
			
			if (!data || !data.Sucursal) {
				throw new Error('No se encontró configuración de sucursal');
			}

			sucursal = data.Sucursal;
		} catch (err) {
			console.error('Error al cargar datos de la empresa:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
		}
	}

	async function cargarEstadoArca() {
		try {
			loading = true;
			error = null;
			await cargarDatosEmpresa();
			if (!sucursal) {
				throw new Error('No se pudo obtener la sucursal');
			}
			estadoArca = await AfipService.obtenerEstadoArca(sucursal);
		} catch (err) {
			console.error('Error al cargar estado de ARCA:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		cargarEstadoArca();
	});
</script>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-8">
		<h1 class="text-2xl font-bold">Estado del Servidor ARCA</h1>
		<div class="flex gap-2">
			<Button variant="primary" on:click={() => goto('/arca/facturas-sin-cae')}>
				Facturas sin CAE
			</Button>
			<Button variant="secondary" on:click={cargarEstadoArca} disabled={loading}>
				{#if loading}
					<span class="animate-spin mr-2">⟳</span>
				{/if}
				Actualizar
			</Button>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin text-4xl">⟳</div>
		</div>
	{:else if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
			<strong class="font-bold">Error!</strong>
			<span class="block sm:inline">{error}</span>
		</div>
	{:else if estadoArca}
		<div class="grid gap-6">
			<!-- Estado del servidor -->
			<div class="bg-white shadow rounded-lg p-6">
				<div class="flex items-center space-x-4">
					<div class={`w-4 h-4 rounded-full ${estadoArca.disponible ? 'bg-green-500' : 'bg-red-500'}`}></div>
					<h2 class="text-xl font-semibold">Estado del Servidor</h2>
				</div>
				<p class="mt-2 text-gray-600">{estadoArca.mensaje}</p>
			</div>

			<!-- Últimos comprobantes -->
			<div class="bg-white shadow rounded-lg p-6">
				<h2 class="text-xl font-semibold mb-4">
					Últimos Comprobantes {#if sucursal}de Sucursal {sucursal}{/if}
				</h2>
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead>
							<tr>
								<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Tipo
								</th>
								<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Descripción
								</th>
								<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Punto de Venta
								</th>
								<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Último Número
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each tiposComprobantes as tipo}
								{@const comprobante = estadoArca.ultimosComprobantes.find(c => c.tipo === tipo.tipo)}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{tipo.tipo}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{tipo.descripcion}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{comprobante?.puntoVenta || '-'}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{comprobante?.ultimoComprobante || '-'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style> 