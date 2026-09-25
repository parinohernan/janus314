<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Button from '$lib/components/ui/Button.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { ArticuloService } from '$lib/services/ArticuloService';
	import { InformeCacheService, idbCacheAdapter } from '$lib/cache';
	import { auth } from '$lib/stores/authStore';
	import { toast } from '$lib/utils/toast';
	import type { Articulo } from '$lib/types';
	import {
		CACHE_INFORME_ID,
		COLUMNAS,
		columnasPorDefecto,
		aplicarFiltrosYOrden,
		formatearFechaCosto,
		guardarColumnasVisibles,
		hayFiltrosActivos,
		leerColumnasVisibles,
		payloadDesdeCambios,
		redondear2,
		resumenCambios,
		siguienteOrden,
		snapshotDesdeArticulo,
		snapshotsDesdeCatalogo,
		tipoFiltroColumna,
		type CampoEditable,
		type CambioFila,
		type ColumnaId,
		type FiltrosColumnas,
		type OrdenGrilla,
		type SnapshotFila
	} from '$lib/utils/preciosStockGrilla';

	const informeCache = new InformeCacheService(idbCacheAdapter);

	interface Proveedor {
		Codigo: string;
		Descripcion: string;
	}

	interface Rubro {
		Codigo: string;
		Descripcion: string;
	}

	let proveedores: Proveedor[] = [];
	let rubros: Rubro[] = [];
	let articulos: Articulo[] = [];
	let snapshots: Record<string, SnapshotFila> = {};
	let proveedoresSeleccionados: string[] = [];
	let rubrosSeleccionados: string[] = [];
	let busqueda = '';
	let columnasVisibles: ColumnaId[] = columnasPorDefecto();
	let mostrarColumnas = false;
	let filtrosColumnas: FiltrosColumnas = {};
	let orden: OrdenGrilla | null = null;
	let loading = false;
	let guardando = false;
	let error: string | null = null;
	let desdeCache = false;
	let mostrarConfirmacion = false;
	let pendientes: CambioFila[] = [];
	let cantidadPrecios = 0;
	let cantidadExistencias = 0;

	$: empresaId = $auth.empresa?.id ?? 'local';
	$: cacheParams = {
		empresaId,
		proveedores: proveedoresSeleccionados.join(','),
		rubros: rubrosSeleccionados.join(',')
	};
	const listas: CampoEditable[] = ['Lista1', 'Lista2', 'Lista3', 'Lista4', 'Lista5'];

	$: articulosFiltrados = aplicarFiltrosYOrden(articulos, {
		busqueda,
		proveedores: proveedoresSeleccionados,
		rubros: rubrosSeleccionados,
		filtros: filtrosColumnas,
		orden,
		snapshots
	});
	$: hayFiltrosGrilla = hayFiltrosActivos(filtrosColumnas, orden);

	$: resumen = resumenCambios(articulos, snapshots);
	$: hayCambios = resumen.filas.length > 0;
	$: sucias = new Set(resumen.filas.map((fila) => fila.codigo));
	$: columnasVisiblesSet = new Set(columnasVisibles);

	function toggleColumna(id: ColumnaId) {
		if (columnasVisibles.includes(id)) {
			if (columnasVisibles.length === 1) return;
			columnasVisibles = columnasVisibles.filter((columna) => columna !== id);
		} else {
			columnasVisibles = [...columnasVisibles, id];
		}
		if (browser) guardarColumnasVisibles(columnasVisibles, localStorage);
	}

	function valorCelda(articulo: Articulo, campo: CampoEditable): number {
		return redondear2((articulo as Record<string, unknown>)[campo]);
	}

	function setValor(articulo: Articulo, campo: CampoEditable, valor: number) {
		if (!Number.isFinite(valor)) return;
		(articulo as Record<string, unknown>)[campo] = redondear2(valor);
		articulos = articulos;
	}

	function estaSucia(articulo: Articulo): boolean {
		return sucias.has(articulo.Codigo);
	}

	function toggleOrden(columna: ColumnaId) {
		orden = siguienteOrden(orden, columna);
	}

	function setFiltroColumna(columna: ColumnaId, valor: string) {
		filtrosColumnas = { ...filtrosColumnas, [columna]: valor };
	}

	function limpiarFiltrosGrilla() {
		filtrosColumnas = {};
		orden = null;
	}

	async function persistirCatalogo() {
		await informeCache.set(CACHE_INFORME_ID, cacheParams, { articulos });
	}

	async function cargarCatalogo(forzarServidor = false) {
		try {
			loading = true;
			error = null;
			desdeCache = false;

			if (!forzarServidor) {
				const cached = await informeCache.get<{ articulos: Articulo[] }>(CACHE_INFORME_ID, cacheParams);
				if (cached?.data?.articulos?.length) {
					articulos = cached.data.articulos;
					snapshots = snapshotsDesdeCatalogo(articulos);
					desdeCache = true;
					return;
				}
			}

			const items = await ArticuloService.obtenerArticulosParaListadoPrecios(true);
			articulos = items;
			snapshots = snapshotsDesdeCatalogo(articulos);
			await persistirCatalogo();
		} catch (err) {
			console.error(err);
			error = 'Error al cargar el catálogo de artículos';
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		if (browser) {
			columnasVisibles = leerColumnasVisibles(localStorage);
		}
		try {
			loading = true;
			const [proveedoresRes, rubrosRes] = await Promise.all([
				fetchWithAuth(`${PUBLIC_API_URL}/proveedores?limit=500`),
				fetchWithAuth(`${PUBLIC_API_URL}/rubros?limit=500`)
			]);
			if (!proveedoresRes.ok || !rubrosRes.ok) {
				throw new Error('Error al cargar filtros');
			}
			proveedores = (await proveedoresRes.json()).items ?? [];
			rubros = (await rubrosRes.json()).items ?? [];
			await cargarCatalogo(false);
		} catch (err) {
			console.error(err);
			error = 'Error al cargar los datos iniciales';
			loading = false;
		}
	});

	function abrirConfirmacion() {
		const actual = resumenCambios(articulos, snapshots);
		if (actual.filas.length === 0) {
			toast.warning('No hay cambios para guardar');
			return;
		}
		pendientes = actual.filas;
		cantidadPrecios = actual.precios;
		cantidadExistencias = actual.existencias;
		mostrarConfirmacion = true;
	}

	function cerrarConfirmacion() {
		mostrarConfirmacion = false;
	}

	async function confirmarGuardado() {
		if (pendientes.length === 0) return;
		try {
			guardando = true;
			error = null;
			const resultado = await ArticuloService.actualizarPreciosStock(payloadDesdeCambios(pendientes));
			const fallidos = new Set(
				(resultado.errores ?? []).map((item) => item.codigo).filter(Boolean)
			);

			for (const fila of pendientes) {
				if (fallidos.has(fila.codigo)) continue;
				const articulo = articulos.find((item) => item.Codigo === fila.codigo);
				if (!articulo) continue;
				snapshots[articulo.Codigo] = snapshotDesdeArticulo(articulo);
				if (fila.cambiaPrecio) {
					articulo.FechaActualizacionCosto = new Date().toISOString();
				}
			}
			snapshots = snapshots;
			articulos = articulos;
			await persistirCatalogo();
			mostrarConfirmacion = false;

			if (resultado.errores?.length) {
				error = resultado.errores.map((item) => `${item.codigo}: ${item.mensaje}`).join(' · ');
				toast.warning(
					`Se actualizaron ${resultado.actualizados} artículo(s). ${resultado.errores.length} con error.`
				);
			} else {
				toast.success(
					`Se actualizaron ${resultado.actualizados} artículo(s)` +
						(resultado.movimientosCreados
							? ` y se generaron ${resultado.movimientosCreados} movimiento(s) de stock`
							: '')
				);
			}
		} catch (err) {
			console.error(err);
			error = err instanceof Error ? err.message : 'Error al guardar los cambios';
			toast.error(error);
		} finally {
			guardando = false;
		}
	}

	function textoCambio(fila: CambioFila): string {
		return fila.cambios
			.map((cambio) => `${cambio.label}: ${cambio.anterior.toFixed(2)} → ${cambio.nuevo.toFixed(2)}`)
			.join(' · ');
	}
</script>

<svelte:head>
	<title>Actualización de Precios y Stock</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="bg-white rounded-lg shadow-md p-6">
		<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold">Actualización de Precios y Stock</h1>
				<p class="mt-1 text-sm text-gray-600">
					Editá varias columnas y la existencia. Los cambios se confirman antes de guardarse.
					{#if desdeCache}
						<span class="text-amber-700">Catálogo desde caché local.</span>
					{/if}
				</p>
			</div>
			<div class="relative">
				<Button variant="secondary" on:click={() => (mostrarColumnas = !mostrarColumnas)}>
					Columnas
				</Button>
				{#if mostrarColumnas}
					<div class="absolute right-0 z-30 mt-2 w-64 rounded-md border border-gray-200 bg-white p-3 shadow-lg">
						<p class="mb-2 text-xs font-semibold uppercase text-gray-500">Visibles</p>
						{#each COLUMNAS as columna}
							<label class="mb-1 flex items-center gap-2 text-sm text-gray-700">
								<input
									type="checkbox"
									checked={columnasVisiblesSet.has(columna.id)}
									on:change={() => toggleColumna(columna.id)}
									class="rounded border-gray-300 text-blue-600"
								/>
								{columna.label}
							</label>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700" for="busqueda-precios-stock">
					Buscar
				</label>
				<input
					id="busqueda-precios-stock"
					type="search"
					bind:value={busqueda}
					placeholder="Código o descripción..."
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div role="group" aria-labelledby="proveedores-label">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label id="proveedores-label" class="mb-2 block text-sm font-medium text-gray-700">Proveedores</label>
				<MultiSelect
					items={proveedores}
					bind:selectedValues={proveedoresSeleccionados}
					labelField="Descripcion"
					valueField="Codigo"
					placeholder="Todos los proveedores..."
				/>
			</div>
			<div role="group" aria-labelledby="rubros-label">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label id="rubros-label" class="mb-2 block text-sm font-medium text-gray-700">Rubros</label>
				<MultiSelect
					items={rubros}
					bind:selectedValues={rubrosSeleccionados}
					labelField="Descripcion"
					valueField="Codigo"
					placeholder="Todos los rubros..."
				/>
			</div>
		</div>

		<div class="mb-6 flex flex-wrap gap-3">
			<Button on:click={() => cargarCatalogo(true)} disabled={loading || guardando}>
				{loading ? 'Cargando...' : 'Recargar del servidor'}
			</Button>
			<Button variant="success" on:click={abrirConfirmacion} disabled={loading || guardando || !hayCambios}>
				Guardar ({resumen.filas.length})
			</Button>
			{#if hayFiltrosGrilla}
				<Button variant="secondary" on:click={limpiarFiltrosGrilla}>Limpiar filtros</Button>
			{/if}
			{#if hayCambios}
				<span class="self-center text-sm font-medium text-amber-700">
					{resumen.precios} precio(s) · {resumen.existencias} existencia(s)
				</span>
			{/if}
		</div>

		{#if error}
			<div class="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
		{/if}

		{#if articulos.length > 0}
			<div class="max-h-[70vh] overflow-auto rounded border border-gray-200">
				<table class="min-w-full divide-y divide-gray-200 text-sm">
					<thead class="sticky top-0 z-10 bg-gray-50">
						<tr>
							{#each COLUMNAS as columna}
								{#if columnasVisiblesSet.has(columna.id)}
									<th class="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
										<button
											type="button"
											class="inline-flex items-center gap-1 hover:text-gray-800"
											on:click={() => toggleOrden(columna.id)}
										>
											{columna.label}
											{#if orden?.columna === columna.id}
												<span class="text-blue-600">{orden.direccion === 'asc' ? '▲' : '▼'}</span>
											{/if}
										</button>
									</th>
								{/if}
							{/each}
						</tr>
						<tr>
							{#each COLUMNAS as columna}
								{#if columnasVisiblesSet.has(columna.id)}
									<th class="px-2 pb-2">
										<input
											type="search"
											value={filtrosColumnas[columna.id] ?? ''}
											on:input={(e) =>
												setFiltroColumna(columna.id, (e.target as HTMLInputElement).value)}
											placeholder={tipoFiltroColumna(columna.id) === 'numero' ? '> 0' : 'Filtrar'}
											class="w-full min-w-16 rounded border border-gray-300 px-1.5 py-1 text-xs font-normal normal-case text-gray-800"
										/>
									</th>
								{/if}
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each articulosFiltrados as articulo (articulo.Codigo)}
							{@const sucia = estaSucia(articulo)}
							<tr class={sucia ? 'bg-amber-50' : 'hover:bg-gray-50'}>
								{#if columnasVisiblesSet.has('Codigo')}
									<td class="whitespace-nowrap px-3 py-2 text-gray-900">{articulo.Codigo}</td>
								{/if}
								{#if columnasVisiblesSet.has('Descripcion')}
									<td class="max-w-xs truncate px-3 py-2 text-gray-900">{articulo.Descripcion}</td>
								{/if}
								{#if columnasVisiblesSet.has('Rubro')}
									<td class="whitespace-nowrap px-3 py-2 text-gray-500">{articulo.Rubro?.Descripcion || '—'}</td>
								{/if}
								{#if columnasVisiblesSet.has('Proveedor')}
									<td class="whitespace-nowrap px-3 py-2 text-gray-500">{articulo.Proveedor?.Descripcion || '—'}</td>
								{/if}
								{#if columnasVisiblesSet.has('PrecioCosto')}
									<td class="px-3 py-2">
										<input
											type="number"
											step="0.01"
											value={valorCelda(articulo, 'PrecioCosto')}
											on:change={(e) =>
												setValor(articulo, 'PrecioCosto', parseFloat((e.target as HTMLInputElement).value))}
											class="w-24 rounded border border-gray-300 px-2 py-1"
										/>
									</td>
								{/if}
								{#if columnasVisiblesSet.has('PrecioCostoMasImp')}
									<td class="px-3 py-2">
										<input
											type="number"
											step="0.01"
											value={valorCelda(articulo, 'PrecioCostoMasImp')}
											on:change={(e) =>
												setValor(
													articulo,
													'PrecioCostoMasImp',
													parseFloat((e.target as HTMLInputElement).value)
												)}
											class="w-24 rounded border border-gray-300 px-2 py-1"
										/>
									</td>
								{/if}
								{#each listas as lista}
									{#if columnasVisiblesSet.has(lista)}
										<td class="px-3 py-2">
											<input
												type="number"
												step="0.01"
												value={valorCelda(articulo, lista)}
												on:change={(e) =>
													setValor(articulo, lista, parseFloat((e.target as HTMLInputElement).value))}
												class="w-20 rounded border border-gray-300 px-2 py-1"
											/>
										</td>
									{/if}
								{/each}
								{#if columnasVisiblesSet.has('PrecioAnterior')}
									<td class="whitespace-nowrap px-3 py-2 text-gray-500">
										{(snapshots[articulo.Codigo]?.PrecioCosto ?? 0).toFixed(2)}
									</td>
								{/if}
								{#if columnasVisiblesSet.has('Fecha')}
									<td class="whitespace-nowrap px-3 py-2 text-gray-500">
										{formatearFechaCosto(articulo.FechaActualizacionCosto)}
									</td>
								{/if}
								{#if columnasVisiblesSet.has('Existencia')}
									<td class="px-3 py-2">
										<input
											type="number"
											step="0.01"
											min="0"
											value={valorCelda(articulo, 'Existencia')}
											on:change={(e) =>
												setValor(articulo, 'Existencia', parseFloat((e.target as HTMLInputElement).value))}
											class="w-20 rounded border border-gray-300 px-2 py-1"
										/>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="mt-2 text-xs text-gray-500">
				{articulosFiltrados.length} de {articulos.length} artículo(s)
				{#if articulosFiltrados.length === 0}
					— ningún resultado con esos filtros
				{/if}
			</p>
		{:else if !loading}
			<p class="text-sm text-gray-500">No hay artículos para mostrar.</p>
		{/if}
	</div>
</div>

{#if mostrarConfirmacion}
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
		<div class="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
			<div class="border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Confirmar actualización</h2>
				<p class="mt-1 text-sm text-gray-600">
					Vas a actualizar <strong>{cantidadPrecios}</strong> precio(s) y
					<strong>{cantidadExistencias}</strong> existencia(s).
				</p>
			</div>
			<div class="max-h-[50vh] overflow-auto px-6 py-4">
				<table class="min-w-full text-sm">
					<thead>
						<tr class="text-left text-xs uppercase text-gray-500">
							<th class="py-2 pr-3">Código</th>
							<th class="py-2 pr-3">Descripción</th>
							<th class="py-2">Cambios</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each pendientes as fila}
							<tr>
								<td class="py-2 pr-3 font-medium">{fila.codigo}</td>
								<td class="max-w-xs truncate py-2 pr-3">{fila.descripcion}</td>
								<td class="py-2 text-gray-700">{textoCambio(fila)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="flex justify-end gap-3 border-t px-6 py-4">
				<Button variant="secondary" on:click={cerrarConfirmacion} disabled={guardando}>Cancelar</Button>
				<Button variant="success" on:click={confirmarGuardado} disabled={guardando}>
					{guardando ? 'Guardando...' : 'Confirmar y guardar'}
				</Button>
			</div>
		</div>
	</div>
{/if}
