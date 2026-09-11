<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import { AfipService, type FacturaSinCae } from '$lib/services/AfipService';

	type EstadoFila = 'pendiente' | 'procesando' | 'ok' | 'error';

	interface Fila extends FacturaSinCae {
		estado: EstadoFila;
		mensaje?: string;
		cae?: string;
	}

	let loading = true;
	let error: string | null = null;
	let cantidadTotal = 0;
	let filas: Fila[] = [];
	let procesando = false;
	let cancelar = false;
	let indiceActual = 0;
	let resumen: { ok: number; error: number } | null = null;

	function clave(f: FacturaSinCae) {
		return `${f.DocumentoTipo}-${f.DocumentoSucursal}-${f.DocumentoNumero}`;
	}

	function formatearFecha(fecha: string) {
		if (!fecha) return '-';
		const d = new Date(fecha);
		if (Number.isNaN(d.getTime())) return String(fecha).slice(0, 10);
		return d.toLocaleDateString('es-AR');
	}

	function extraerCae(data: any): string {
		return (
			data?.cae ||
			data?.CAE ||
			data?.data?.cae ||
			data?.cae?.numero ||
			''
		);
	}

	async function cargarListado() {
		loading = true;
		error = null;
		resumen = null;
		try {
			const result = await AfipService.listarFacturasSinCae();
			if (!result.success) {
				throw new Error(result.error || 'No se pudieron cargar las facturas');
			}
			cantidadTotal = result.cantidad;
			filas = result.facturas.map((f) => ({ ...f, estado: 'pendiente' as const }));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error desconocido';
			filas = [];
		} finally {
			loading = false;
		}
	}

	async function obtenerCaesFaltantes() {
		if (procesando || filas.length === 0) return;
		procesando = true;
		cancelar = false;
		resumen = null;
		let ok = 0;
		let errores = 0;

		for (let i = 0; i < filas.length; i++) {
			if (cancelar) break;
			const fila = filas[i];
			if (fila.estado === 'ok') continue;

			indiceActual = i + 1;
			filas[i] = { ...fila, estado: 'procesando', mensaje: undefined };
			filas = filas;

			const result = await AfipService.obtenerCae(
				fila.DocumentoTipo,
				fila.DocumentoSucursal,
				fila.DocumentoNumero
			);

			if (result.success) {
				ok += 1;
				filas[i] = {
					...filas[i],
					estado: 'ok',
					cae: extraerCae(result.data),
					mensaje: extraerCae(result.data) || 'CAE obtenido'
				};
			} else {
				errores += 1;
				filas[i] = {
					...filas[i],
					estado: 'error',
					mensaje: result.error || 'Error al obtener CAE'
				};
			}
			filas = filas;
		}

		resumen = { ok, error: errores };
		procesando = false;
		cancelar = false;
	}

	onMount(() => {
		cargarListado();
	});
</script>

<div class="container mx-auto px-4 py-8">
	<div class="flex flex-wrap justify-between items-center gap-3 mb-8">
		<div>
			<h1 class="text-2xl font-bold">Facturas sin CAE</h1>
			<p class="text-sm text-gray-600 mt-1">
				Facturas A, B y C vigentes que todavía no tienen autorización de ARCA.
			</p>
		</div>
		<div class="flex gap-2">
			<Button variant="secondary" on:click={() => goto('/arca')} disabled={procesando}>
				Volver a ARCA
			</Button>
			<Button variant="secondary" on:click={cargarListado} disabled={loading || procesando}>
				Actualizar
			</Button>
			{#if procesando}
				<Button variant="danger" on:click={() => (cancelar = true)}>Detener</Button>
			{:else}
				<Button
					variant="primary"
					on:click={obtenerCaesFaltantes}
					disabled={loading || filas.length === 0}
				>
					Obtener CAEs faltantes
				</Button>
			{/if}
		</div>
	</div>

	{#if procesando}
		<div class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-4">
			Obteniendo CAE {indiceActual} de {filas.length}:
			{filas[indiceActual - 1] ? clave(filas[indiceActual - 1]) : ''}
		</div>
	{:else if resumen}
		<div class="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded mb-4">
			Listo: {resumen.ok} obtenidas, {resumen.error} con error.
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin text-4xl">⟳</div>
		</div>
	{:else if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
			<strong class="font-bold">Error:</strong>
			<span>{error}</span>
		</div>
	{:else if filas.length === 0}
		<div class="bg-white shadow rounded-lg p-8 text-center text-gray-600">
			No hay facturas fiscales sin CAE.
		</div>
	{:else}
		<div class="bg-white shadow rounded-lg p-6">
			<p class="text-sm text-gray-500 mb-4">
				Mostrando {filas.length}
				{#if cantidadTotal > filas.length}
					de {cantidadTotal}
				{/if}
				factura{filas.length === 1 ? '' : 's'} (las más antiguas primero).
			</p>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead>
						<tr>
							<th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
							<th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
							<th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
							<th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
							<th class="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
							<th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each filas as fila (clave(fila))}
							<tr>
								<td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
									{fila.DocumentoTipo}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
									{fila.DocumentoSucursal}-{fila.DocumentoNumero}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
									{formatearFecha(fila.Fecha)}
								</td>
								<td class="px-4 py-3 text-sm text-gray-700">
									{fila.Cliente?.Descripcion || fila.Cliente?.Codigo || '-'}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
									{Number(fila.ImporteTotal || 0).toLocaleString('es-AR', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2
									})}
								</td>
								<td class="px-4 py-3 text-sm">
									{#if fila.estado === 'procesando'}
										<span class="text-blue-600">Obteniendo…</span>
									{:else if fila.estado === 'ok'}
										<span class="text-green-700">{fila.cae || 'CAE obtenido'}</span>
									{:else if fila.estado === 'error'}
										<span class="text-red-600">{fila.mensaje}</span>
									{:else}
										<span class="text-gray-500">Pendiente</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
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
