<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import Button from '$lib/components/ui/Button.svelte';
	import { ArticuloService } from '$lib/services/ArticuloService';
	import { RubroService, type Rubro } from '$lib/services/RubroService';
	import { ProveedorService, type Proveedor } from '$lib/services/ProveedorService';
	import { EmpresaService } from '$lib/services/EmpresaService';
	import type { Articulo } from '$lib/types';
	import { formatDate } from '$lib/utils/dateUtils';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import { auth } from '$lib/stores/authStore';
	import { navigationState } from '$lib/stores/navigationState';

	const PAGE_PATH = '/productos/existencia';

	type Agrupamiento = 'rubro' | 'proveedor';

	let articulos: Articulo[] = [];
	let rubros: Rubro[] = [];
	let proveedores: Proveedor[] = [];
	let loading = true;
	let error: string | null = null;

	let empresa: any = null;
	let generandoPDF = false;

	let soloActivos = true;
	let soloStockBajo = false;
	let mostrarSinStock = true;
	let agrupamiento: Agrupamiento = 'rubro';

	// Multiselect state
	let gruposSeleccionados: Set<string> = new Set();
	let busquedaGrupo = '';
	let dropdownAbierto = false;
	let dropdownRef: HTMLDivElement;

	interface OpcionGrupo {
		codigo: string;
		descripcion: string;
	}

	$: opcionesGrupo = (() => {
		const opciones: OpcionGrupo[] = [];
		if (agrupamiento === 'rubro') {
			for (const r of rubros) {
				opciones.push({ codigo: r.Codigo, descripcion: r.Descripcion });
			}
			opciones.push({ codigo: 'SIN_RUBRO', descripcion: 'Sin Rubro' });
		} else {
			for (const p of proveedores) {
				opciones.push({ codigo: p.Codigo, descripcion: p.Descripcion });
			}
			opciones.push({ codigo: 'SIN_PROVEEDOR', descripcion: 'Sin Proveedor' });
		}
		return opciones.sort((a, b) => a.descripcion.localeCompare(b.descripcion));
	})();

	$: opcionesFiltradas = busquedaGrupo.trim()
		? opcionesGrupo.filter(o =>
			o.descripcion.toLowerCase().includes(busquedaGrupo.toLowerCase()) ||
			o.codigo.toLowerCase().includes(busquedaGrupo.toLowerCase())
		)
		: opcionesGrupo;

	$: etiquetaSeleccion = (() => {
		if (gruposSeleccionados.size === 0) return 'Ninguno seleccionado';
		if (gruposSeleccionados.size === opcionesGrupo.length) return 'Todos';
		return `${gruposSeleccionados.size} de ${opcionesGrupo.length}`;
	})();

	$: articulosFiltrados = articulos.filter(a => {
		if (soloStockBajo) {
			const existencia = a.Existencia || 0;
			const minima = a.ExistenciaMinima || 0;
			return existencia <= minima;
		}
		if (!mostrarSinStock) {
			return (a.Existencia || 0) > 0;
		}
		return true;
	});

	$: articulosPorGrupo = articulosFiltrados.reduce((acc, articulo) => {
		const grupoCodigo = agrupamiento === 'rubro'
			? (articulo.RubroCodigo || 'SIN_RUBRO')
			: (articulo.ProveedorCodigo || 'SIN_PROVEEDOR');
		if (gruposSeleccionados.has(grupoCodigo)) {
			if (!acc[grupoCodigo]) {
				acc[grupoCodigo] = [];
			}
			acc[grupoCodigo].push(articulo);
		}
		return acc;
	}, {} as Record<string, Articulo[]>);

	$: articulosPorGrupoOrdenado = opcionesGrupo
		.filter(o => gruposSeleccionados.has(o.codigo) && articulosPorGrupo[o.codigo])
		.map(o => ({ codigo: o.codigo, articulos: articulosPorGrupo[o.codigo] }));

	$: totalArticulosMostrados = articulosPorGrupoOrdenado.reduce((sum, g) => sum + g.articulos.length, 0);
	$: totalArticulos = articulosFiltrados.length;
	$: totalSinStock = articulosFiltrados.filter(a => (a.Existencia || 0) === 0).length;
	$: totalStockBajo = articulosFiltrados.filter(a => {
		const e = a.Existencia || 0;
		const m = a.ExistenciaMinima || 0;
		return e > 0 && e <= m;
	}).length;
	$: totalStockOk = articulosFiltrados.filter(a => {
		const e = a.Existencia || 0;
		const m = a.ExistenciaMinima || 0;
		return e > m;
	}).length;

	// Guardar selección cuando cambia
	$: if (typeof window !== 'undefined' && gruposSeleccionados.size > 0) {
		guardarConfiguracion();
	}

	function getNombreGrupo(codigo: string): string {
		if (agrupamiento === 'rubro') {
			if (codigo === 'SIN_RUBRO') return 'Sin Rubro';
			const rubro = rubros.find(r => r.Codigo === codigo);
			return rubro ? rubro.Descripcion : `Rubro ${codigo}`;
		} else {
			if (codigo === 'SIN_PROVEEDOR') return 'Sin Proveedor';
			const proveedor = proveedores.find(p => p.Codigo === codigo);
			return proveedor ? proveedor.Descripcion : `Proveedor ${codigo}`;
		}
	}

	function getEstadoExistencia(articulo: Articulo): { texto: string; clase: string } {
		const existencia = articulo.Existencia || 0;
		const minima = articulo.ExistenciaMinima || 0;

		if (existencia === 0) {
			return { texto: 'Sin Stock', clase: 'bg-red-100 text-red-800' };
		}
		if (existencia <= minima) {
			return { texto: 'Bajo', clase: 'bg-yellow-100 text-yellow-800' };
		}
		return { texto: 'OK', clase: 'bg-green-100 text-green-800' };
	}

	function getStorageKey(): string {
		const userId = $auth.user?.usuario || 'anonymous';
		return `existenciaConfig_v2_${agrupamiento}_${userId}`;
	}

	function guardarConfiguracion() {
		if (typeof window !== 'undefined') {
			const config = {
				seleccionados: Array.from(gruposSeleccionados),
				soloActivos,
				soloStockBajo,
				mostrarSinStock,
				agrupamiento,
				ultimaActualizacion: new Date().toISOString()
			};
			localStorage.setItem(getStorageKey(), JSON.stringify(config));
		}
	}

	function cargarConfiguracion() {
		if (typeof window !== 'undefined') {
			const config = localStorage.getItem(getStorageKey());
			if (config) {
				try {
					const datos = JSON.parse(config);
					if (datos.seleccionados && Array.isArray(datos.seleccionados) && datos.seleccionados.length > 0) {
						gruposSeleccionados = new Set(datos.seleccionados);
					} else {
						seleccionarTodos();
					}
					soloActivos = datos.soloActivos !== undefined ? datos.soloActivos : true;
					soloStockBajo = datos.soloStockBajo !== undefined ? datos.soloStockBajo : false;
					mostrarSinStock = datos.mostrarSinStock !== undefined ? datos.mostrarSinStock : true;
				} catch (err) {
					console.error('Error al cargar configuración de existencia:', err);
					seleccionarTodos();
				}
			} else {
				seleccionarTodos();
			}
		}
	}

	function seleccionarTodos() {
		gruposSeleccionados = new Set(opcionesGrupo.map(o => o.codigo));
	}

	function deseleccionarTodos() {
		gruposSeleccionados = new Set();
		guardarConfiguracion();
	}

	function toggleGrupo(codigo: string) {
		const nuevo = new Set(gruposSeleccionados);
		if (nuevo.has(codigo)) {
			nuevo.delete(codigo);
		} else {
			nuevo.add(codigo);
		}
		gruposSeleccionados = nuevo;
	}

	function cambiarAgrupamiento(nuevoAgrupamiento: Agrupamiento) {
		if (agrupamiento === nuevoAgrupamiento) return;
		agrupamiento = nuevoAgrupamiento;
		busquedaGrupo = '';
		// Cargar configuración guardada para este agrupamiento, o seleccionar todos
		tick().then(() => {
			cargarConfiguracion();
		});
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			dropdownAbierto = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		let savedScroll: number | undefined;
		if (browser) {
			const savedState = navigationState.getState(PAGE_PATH);
			savedScroll = savedState?.scroll;
			const filters = savedState?.filters as { soloActivos?: boolean; soloStockBajo?: boolean; mostrarSinStock?: boolean; agrupamiento?: Agrupamiento; gruposSeleccionados?: string[] } | undefined;
			if (typeof filters?.soloActivos === 'boolean') soloActivos = filters.soloActivos;
			if (typeof filters?.soloStockBajo === 'boolean') soloStockBajo = filters.soloStockBajo;
			if (typeof filters?.mostrarSinStock === 'boolean') mostrarSinStock = filters.mostrarSinStock;
			if (filters?.agrupamiento) agrupamiento = filters.agrupamiento;
			if (filters?.gruposSeleccionados && Array.isArray(filters.gruposSeleccionados)) {
				gruposSeleccionados = new Set(filters.gruposSeleccionados);
			}
		}
		const esperarUsuario = (): Promise<void> =>
			new Promise((resolve) => {
				if ($auth.user) {
					cargarDatos().then(resolve);
				} else {
					setTimeout(() => esperarUsuario().then(resolve), 100);
				}
			});
		esperarUsuario().then(() => {
			if (typeof savedScroll === 'number' && savedScroll > 0 && typeof window !== 'undefined') {
				requestAnimationFrame(() => window.scrollTo(0, savedScroll));
			}
		});
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	beforeNavigate(({ from }) => {
		if (from?.url.pathname === PAGE_PATH && browser) {
			const currentState = navigationState.getState(PAGE_PATH) || {};
			navigationState.saveState(PAGE_PATH, {
				...currentState,
				scroll: typeof window !== 'undefined' ? window.scrollY : 0,
				filters: {
					soloActivos,
					soloStockBajo,
					mostrarSinStock,
					agrupamiento,
					gruposSeleccionados: Array.from(gruposSeleccionados)
				}
			});
		}
	});

	async function cargarDatos() {
		try {
			loading = true;
			error = null;

			empresa = await EmpresaService.obtenerDatos();

			const [rubrosData, proveedoresData] = await Promise.all([
				RubroService.obtenerRubros(),
				ProveedorService.obtenerProveedores()
			]);
			rubros = rubrosData;
			proveedores = proveedoresData;

			await tick();
			cargarConfiguracion();

			articulos = await ArticuloService.obtenerArticulosParaListadoPrecios(soloActivos);
		} catch (err) {
			console.error('Error al cargar datos:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			loading = false;
		}
	}

	let pdfUrl: string | null = null;
	let mostrandoPDF = false;

	async function generarPDF(descargar = false) {
		try {
			generandoPDF = true;
			error = null;

			if (pdfUrl) {
				URL.revokeObjectURL(pdfUrl);
				pdfUrl = null;
			}

			const gruposOrdenados = articulosPorGrupoOrdenado.map(g => ({
				nombre: getNombreGrupo(g.codigo),
				articulos: g.articulos.map(a => ({
					Codigo: a.Codigo,
					Descripcion: a.Descripcion,
					Existencia: a.Existencia || 0,
					ExistenciaMinima: a.ExistenciaMinima || 0
				}))
			}));

			const fecha = new Date().toISOString().split('T')[0];

			const response = await fetchWithAuth('articulos/resumen-existencia-pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					empresa,
					fecha,
					agrupamiento,
					gruposOrdenados
				})
			});

			if (!response.ok) {
				throw new Error('Error al generar PDF');
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);

			if (descargar) {
				const a = document.createElement('a');
				a.href = url;
				const nombreEmpresa = empresa?.RazonSocial || 'Empresa';
				a.download = `${nombreEmpresa}_resumen_existencia_${fecha}.pdf`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} else {
				pdfUrl = url;
				mostrandoPDF = true;
			}
		} catch (err) {
			console.error('Error al generar PDF:', err);
			error = err instanceof Error ? err.message : 'Error al generar PDF';
		} finally {
			generandoPDF = false;
		}
	}

	function cerrarVisorPDF() {
		mostrandoPDF = false;
		if (pdfUrl) {
			URL.revokeObjectURL(pdfUrl);
			pdfUrl = null;
		}
	}
</script>

<svelte:head>
	<title>Resumen de Existencia</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
	<h1 class="text-2xl font-bold mb-6">Resumen de Existencia</h1>

	<!-- Configuración -->
	<div class="bg-white rounded-lg shadow-md p-4 mb-6">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<div>
				<label for="agrupamiento" class="block text-sm font-medium text-gray-700 mb-2">
					Agrupar por
				</label>
				<select
					id="agrupamiento"
					value={agrupamiento}
					on:change={(e) => cambiarAgrupamiento(e.currentTarget.value as Agrupamiento)}
					class="w-full border border-gray-300 rounded-md shadow-sm p-2"
				>
					<option value="rubro">Rubro</option>
					<option value="proveedor">Proveedor</option>
				</select>
			</div>

			<!-- Multiselect de grupos -->
			<div>
				<span class="block text-sm font-medium text-gray-700 mb-2">
					{agrupamiento === 'rubro' ? 'Rubros' : 'Proveedores'}
				</span>
				<div class="relative" bind:this={dropdownRef}>
					<button
						type="button"
						on:click={() => dropdownAbierto = !dropdownAbierto}
						class="w-full flex items-center justify-between border border-gray-300 rounded-md shadow-sm p-2 bg-white text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						<span class="text-sm text-gray-700 truncate">{etiquetaSeleccion}</span>
						<svg class="w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform {dropdownAbierto ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if dropdownAbierto}
						<div class="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
							<!-- Búsqueda -->
							<div class="p-2 border-b border-gray-200">
								<input
									type="text"
									bind:value={busquedaGrupo}
									placeholder="Buscar..."
									class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
								/>
							</div>

							<!-- Acciones rápidas -->
							<div class="flex gap-2 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
								<button
									type="button"
									on:click|stopPropagation={() => seleccionarTodos()}
									class="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
								>
									Todos
								</button>
								<span class="text-gray-300">|</span>
								<button
									type="button"
									on:click|stopPropagation={() => deseleccionarTodos()}
									class="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
								>
									Ninguno
								</button>
							</div>

							<!-- Lista de opciones -->
							<div class="max-h-60 overflow-y-auto">
								{#each opcionesFiltradas as opcion (opcion.codigo)}
									<label
										class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm gap-2"
									>
										<input
											type="checkbox"
											checked={gruposSeleccionados.has(opcion.codigo)}
											on:change={() => toggleGrupo(opcion.codigo)}
											class="form-checkbox h-4 w-4 text-indigo-600 rounded"
										/>
										<span class="font-mono text-gray-400 text-xs flex-shrink-0">{opcion.codigo}</span>
										<span class="text-gray-700 truncate">{opcion.descripcion}</span>
									</label>
								{/each}
								{#if opcionesFiltradas.length === 0}
									<p class="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="flex items-end space-x-2">
				<Button
					variant="primary"
					on:click={() => generarPDF(false)}
					disabled={loading || generandoPDF || articulosPorGrupoOrdenado.length === 0}
				>
					{generandoPDF ? 'Generando...' : 'Ver PDF'}
				</Button>
				<Button
					variant="secondary"
					on:click={() => generarPDF(true)}
					disabled={loading || generandoPDF || articulosPorGrupoOrdenado.length === 0}
				>
					Descargar
				</Button>
			</div>
		</div>

		<!-- Filtros adicionales -->
		<div class="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-100">
			<label class="inline-flex items-center">
				<input
					type="checkbox"
					bind:checked={soloActivos}
					on:change={() => cargarDatos()}
					class="form-checkbox h-4 w-4 text-indigo-600"
				>
				<span class="ml-2 text-sm text-gray-700">Solo activos</span>
			</label>

			<label class="inline-flex items-center">
				<input
					type="checkbox"
					bind:checked={soloStockBajo}
					class="form-checkbox h-4 w-4 text-yellow-600"
				>
				<span class="ml-2 text-sm text-gray-700">Solo stock bajo / sin stock</span>
			</label>

			<label class="inline-flex items-center">
				<input
					type="checkbox"
					bind:checked={mostrarSinStock}
					class="form-checkbox h-4 w-4 text-red-600"
				>
				<span class="ml-2 text-sm text-gray-700">Mostrar sin stock</span>
			</label>
		</div>

		<!-- Tags de seleccionados -->
		{#if gruposSeleccionados.size > 0 && gruposSeleccionados.size < opcionesGrupo.length}
			<div class="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
				{#each opcionesGrupo.filter(o => gruposSeleccionados.has(o.codigo)) as opcion (opcion.codigo)}
					<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
						{opcion.descripcion}
						<button
							type="button"
							on:click={() => toggleGrupo(opcion.codigo)}
							class="text-indigo-400 hover:text-indigo-700 font-bold leading-none"
						>&times;</button>
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Resumen rápido -->
	{#if !loading}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
			<div class="bg-white rounded-lg shadow-md p-4 text-center">
				<p class="text-sm text-gray-500">Total Artículos</p>
				<p class="text-2xl font-bold text-gray-800">{totalArticulosMostrados}</p>
			</div>
			<div class="bg-green-50 rounded-lg shadow-md p-4 text-center">
				<p class="text-sm text-green-600">Stock OK</p>
				<p class="text-2xl font-bold text-green-700">{totalStockOk}</p>
			</div>
			<div class="bg-yellow-50 rounded-lg shadow-md p-4 text-center">
				<p class="text-sm text-yellow-600">Stock Bajo</p>
				<p class="text-2xl font-bold text-yellow-700">{totalStockBajo}</p>
			</div>
			<div class="bg-red-50 rounded-lg shadow-md p-4 text-center">
				<p class="text-sm text-red-600">Sin Stock</p>
				<p class="text-2xl font-bold text-red-700">{totalSinStock}</p>
			</div>
		</div>
	{/if}

	<!-- Error -->
	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
			{error}
		</div>
	{/if}

	<!-- Loading -->
	{#if loading}
		<div class="flex justify-center items-center h-48">
			<div class="spinner"></div>
		</div>
	{:else}
		<!-- Vista previa del listado -->
		<div class="bg-white rounded-lg shadow-md p-6">
			{#if articulosPorGrupoOrdenado.length === 0}
				<div class="text-center py-12 text-gray-400">
					<p class="text-lg">No hay artículos para mostrar</p>
					<p class="text-sm mt-1">Seleccioná al menos un {agrupamiento === 'rubro' ? 'rubro' : 'proveedor'} en los filtros</p>
				</div>
			{/if}

			<!-- Listado agrupado -->
			{#each articulosPorGrupoOrdenado as {codigo: grupoCodigo, articulos: articulosGrupo}}
				<div class="mb-8">
					<h3 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
						{getNombreGrupo(grupoCodigo)}
						<span class="text-sm font-normal text-gray-500 ml-2">({articulosGrupo.length} artículos)</span>
					</h3>

					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Código
									</th>
									<th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Descripción
									</th>
									<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Existencia
									</th>
									<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Mínima
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each articulosGrupo as articulo}
									<tr class="hover:bg-gray-50">
										<td class="px-3 py-3 whitespace-nowrap text-sm font-mono">
											{articulo.Codigo}
										</td>
										<td class="px-3 py-3 text-sm">
											{articulo.Descripcion}
										</td>
										<td class="px-3 py-3 whitespace-nowrap text-sm text-right font-semibold">
											{articulo.Existencia || 0}
										</td>
										<td class="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-500">
											{articulo.ExistenciaMinima || 0}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}

			<!-- Pie de página -->
			{#if articulosPorGrupoOrdenado.length > 0}
				<div class="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
					<p>Total de artículos: {totalArticulosMostrados} | Stock OK: {totalStockOk} | Stock Bajo: {totalStockBajo} | Sin Stock: {totalSinStock}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Visor de PDF -->
{#if mostrandoPDF && pdfUrl}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex flex-col bg-black/60" on:click|self={cerrarVisorPDF}>
		<div class="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
			<span class="text-sm font-medium">Resumen de Existencia - PDF</span>
			<div class="flex items-center gap-2">
				<button
					on:click={() => generarPDF(true)}
					class="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
				>
					Descargar
				</button>
				<button
					on:click={cerrarVisorPDF}
					class="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
				>
					Cerrar
				</button>
			</div>
		</div>
		<div class="flex-1 overflow-hidden">
			<iframe
				src={pdfUrl}
				title="Resumen de Existencia PDF"
				class="w-full h-full border-0"
			></iframe>
		</div>
	</div>
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
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>
