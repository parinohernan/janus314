<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import FechaCampos from '$lib/components/ui/FechaCampos.svelte';
	import RangosFecha from '$lib/components/ui/RangosFecha.svelte';
	import EntitySelector from '$lib/components/ui/EntitySelector.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chart from '$lib/components/Chart.svelte';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import { Boxes } from 'lucide-svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { navigationState } from '$lib/stores/navigationState';
	import { aISOFecha } from '$lib/utils/fechaCampos';
	import { rangoFecha } from '$lib/utils/rangosFecha';

	const PAGE_PATH = '/ventas/informes/movimiento-stock';

	const periodoInicial = rangoFecha('ultimo_mes');
	let fechaDesde: Date = periodoInicial.desde;
	let fechaHasta: Date = periodoInicial.hasta;

	let producto: { codigo: string; descripcion: string } | null = null;
	let datos: InformeMovimiento | null = null;
	let loading = false;
	let error: string | null = null;

	interface Movimiento {
		fecha: string;
		tipo: 'ING' | 'EGR';
		origen: 'STK' | 'VENTA' | 'NC';
		documentoTipo: string;
		documentoSucursal: string;
		documentoNumero: string;
		cantidad: number;
		existencia: number;
		observacion: string;
	}

	interface InformeMovimiento {
		articulo: { Codigo: string; Descripcion: string };
		existenciaActual: number;
		existenciaInicial: number;
		totales: { ingresos: number; egresos: number; ventas: number };
		movimientos: Movimiento[];
		serie: { fecha: string; existencia: number }[];
	}

	function formatDate(date: Date): string {
		return aISOFecha(date);
	}

	function formatFecha(fecha: string): string {
		const [y, m, d] = fecha.split('-');
		if (!y || !m || !d) return fecha;
		return `${d}/${m}/${y}`;
	}

	function labelOrigen(origen: string): string {
		if (origen === 'VENTA') return 'Venta';
		if (origen === 'NC') return 'Nota de crédito';
		return 'Stock';
	}

	function comprobante(mov: Movimiento): string {
		return `${mov.documentoTipo}-${mov.documentoSucursal}-${mov.documentoNumero}`;
	}

	$: chartData =
		datos?.serie?.length
			? {
					labels: datos.serie.map((punto) => formatFecha(punto.fecha)),
					datasets: [
						{
							label: 'Existencia',
							data: datos.serie.map((punto) => punto.existencia),
							borderColor: 'rgb(37, 99, 235)',
							backgroundColor: 'rgba(37, 99, 235, 0.15)',
							fill: true,
							tension: 0.2
						}
					]
				}
			: null;

	const chartOptions = {
		plugins: {
			legend: { display: true, position: 'top' as const },
			title: { display: true, text: 'Evolución de la existencia' }
		},
		scales: {
			y: { beginAtZero: true }
		}
	};

	async function cargarInforme() {
		if (!producto) {
			datos = null;
			error = 'Elegí un producto para generar el informe';
			return;
		}
		try {
			loading = true;
			error = null;
			const response = await fetchWithAuth('/informes/movimiento-stock', {
				params: {
					codigoArticulo: producto.codigo,
					fechaDesde: formatDate(fechaDesde),
					fechaHasta: formatDate(fechaHasta)
				}
			});
			const result = await response.json();
			if (!response.ok || !result.success) {
				throw new Error(result.message || 'Error al cargar el informe');
			}
			datos = result.data;
		} catch (err) {
			console.error(err);
			datos = null;
			error = err instanceof Error ? err.message : 'Error al cargar el informe';
		} finally {
			loading = false;
		}
	}

	function handleProductoSelect(event: CustomEvent<{ value: string; item: { Descripcion?: string } | null }>) {
		const { value, item } = event.detail;
		if (!value || !item) {
			producto = null;
			datos = null;
			return;
		}
		producto = { codigo: value, descripcion: item.Descripcion || value };
		error = null;
	}

	onMount(() => {
		let savedScroll: number | undefined;
		if (browser) {
			const savedState = navigationState.getState(PAGE_PATH);
			savedScroll = savedState?.scroll;
			const filters = savedState?.filters as {
				fechaDesde?: string;
				fechaHasta?: string;
				producto?: { codigo: string; descripcion: string };
			} | undefined;
			if (filters?.fechaDesde) fechaDesde = new Date(filters.fechaDesde);
			if (filters?.fechaHasta) fechaHasta = new Date(filters.fechaHasta);
			if (filters?.producto?.codigo) producto = filters.producto;
		}
		if (typeof savedScroll === 'number' && savedScroll > 0) {
			requestAnimationFrame(() => window.scrollTo(0, savedScroll));
		}
	});

	beforeNavigate(({ from }) => {
		if (from?.url.pathname === PAGE_PATH && browser) {
			const currentState = navigationState.getState(PAGE_PATH) || {};
			navigationState.saveState(PAGE_PATH, {
				...currentState,
				scroll: window.scrollY,
				filters: {
					fechaDesde: formatDate(fechaDesde),
					fechaHasta: formatDate(fechaHasta),
					producto
				}
			});
		}
	});
</script>

<svelte:head>
	<title>Movimiento de stock por producto</title>
</svelte:head>

<div class="container mx-auto p-4">
	<h1 class="mb-6 flex items-center gap-3 text-2xl font-bold">
		<Icon icon={Boxes} size={28} strokeWidth={2.5} glass={true} />
		Movimiento de stock por producto
	</h1>

	<section class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div class="min-w-0 flex-1 space-y-4">
				<EntitySelector
					id="productoSelector"
					label="Producto"
					placeholder="Buscar producto..."
					apiEndpoint="/articulos"
					valueField="Codigo"
					labelField="Descripcion"
					minSearchLength={3}
					required
					on:select={handleProductoSelect}
				/>

				<div>
					<p class="mb-1.5 text-sm font-medium text-gray-700">Período</p>
					<RangosFecha bind:desde={fechaDesde} bind:hasta={fechaHasta} className="mb-3" />
					<div class="flex flex-wrap items-end gap-2">
						<div>
							<label for="fechaDesde" class="mb-1 block text-xs text-gray-500">Desde</label>
							<FechaCampos id="fechaDesde" bind:value={fechaDesde} ariaLabel="Fecha desde" />
						</div>
						<span class="mb-2 select-none text-gray-300" aria-hidden="true">→</span>
						<div>
							<label for="fechaHasta" class="mb-1 block text-xs text-gray-500">Hasta</label>
							<FechaCampos id="fechaHasta" bind:value={fechaHasta} ariaLabel="Fecha hasta" />
						</div>
					</div>
				</div>
			</div>

			<Button on:click={cargarInforme} disabled={loading || !producto} className="w-full lg:w-auto">
				{loading ? 'Generando...' : 'Generar informe'}
			</Button>
		</div>
	</section>

	{#if error}
		<div class="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
	{/if}

	{#if loading}
		<p class="text-sm text-gray-500">Cargando movimientos...</p>
	{:else if datos}
		<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
			<div class="rounded-lg bg-white p-4 shadow">
				<p class="text-xs uppercase text-gray-500">Existencia inicial</p>
				<p class="text-xl font-semibold">{datos.existenciaInicial.toFixed(2)}</p>
			</div>
			<div class="rounded-lg bg-white p-4 shadow">
				<p class="text-xs uppercase text-gray-500">Ingresos</p>
				<p class="text-xl font-semibold text-green-700">{datos.totales.ingresos.toFixed(2)}</p>
			</div>
			<div class="rounded-lg bg-white p-4 shadow">
				<p class="text-xs uppercase text-gray-500">Egresos</p>
				<p class="text-xl font-semibold text-red-700">{datos.totales.egresos.toFixed(2)}</p>
				<p class="text-xs text-gray-500">Ventas: {datos.totales.ventas.toFixed(2)}</p>
			</div>
			<div class="rounded-lg bg-white p-4 shadow">
				<p class="text-xs uppercase text-gray-500">Existencia actual</p>
				<p class="text-xl font-semibold">{datos.existenciaActual.toFixed(2)}</p>
			</div>
		</div>

		<div class="mb-6 rounded-lg bg-white p-4 shadow">
			<p class="mb-2 text-sm text-gray-600">
				{datos.articulo.Codigo} · {datos.articulo.Descripcion}
			</p>
			{#if chartData}
				{#key `${producto?.codigo}-${formatDate(fechaDesde)}-${formatDate(fechaHasta)}-${datos.movimientos.length}`}
					<Chart data={chartData} type="line" options={chartOptions} height="360px" />
				{/key}
			{/if}
		</div>

		<div class="overflow-x-auto rounded-lg bg-white shadow">
			<table class="min-w-full divide-y divide-gray-200 text-sm">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
						<th class="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
						<th class="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Origen</th>
						<th class="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Comprobante</th>
						<th class="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Cantidad</th>
						<th class="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Existencia</th>
						<th class="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Observación</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each datos.movimientos as movimiento}
						<tr class={movimiento.tipo === 'ING' ? 'bg-green-50' : 'bg-red-50'}>
							<td class="whitespace-nowrap px-3 py-2">{formatFecha(movimiento.fecha)}</td>
							<td class="px-3 py-2 font-medium">{movimiento.tipo === 'ING' ? 'Ingreso' : 'Egreso'}</td>
							<td class="px-3 py-2">{labelOrigen(movimiento.origen)}</td>
							<td class="px-3 py-2">{comprobante(movimiento)}</td>
							<td class="px-3 py-2 text-right">{movimiento.cantidad.toFixed(2)}</td>
							<td class="px-3 py-2 text-right">{movimiento.existencia.toFixed(2)}</td>
							<td class="px-3 py-2 text-gray-600">{movimiento.observacion}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if datos.movimientos.length === 0}
				<p class="px-4 py-6 text-center text-sm text-gray-500">
					No hay movimientos en el período para este producto.
				</p>
			{/if}
		</div>
	{:else}
		<p class="text-sm text-gray-500">
			Elegí un producto y un período, después generá el informe.
		</p>
	{/if}
</div>
