<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { ArticuloService } from '$lib/services/ArticuloService';
	import { RubroService, type Rubro } from '$lib/services/RubroService';
	import { EmpresaService } from '$lib/services/EmpresaService';
	import type { Articulo } from '$lib/types';
	import { formatDate } from '$lib/utils/dateUtils';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

	// Estado
	let articulos: Articulo[] = [];
	let rubros: Rubro[] = [];
	let loading = true;
	let error: string | null = null;
	let generandoPDF = false;

	// Datos de la empresa
	let empresa: any = null;

	// Filtros
	let listaPrecio = '1';
	let mostrarExistencia = true;
	let soloActivos = true;

	// Configuración de rubros
	let configuracionRubros: Array<{
		codigo: string;
		visible: boolean;
		orden: number;
	}> = [];
	let mostrarConfiguracionRubros = false;

	// Agrupar artículos por rubro (solo rubros visibles)
	$: articulosPorRubro = articulos.reduce((acc, articulo) => {
		const rubroCodigo = articulo.RubroCodigo || 'SIN_RUBRO';
		
		// Solo incluir si el rubro está configurado y visible
		const configRubro = configuracionRubros.find(c => c.codigo === rubroCodigo);
		if (configRubro && configRubro.visible) {
			if (!acc[rubroCodigo]) {
				acc[rubroCodigo] = [];
			}
			acc[rubroCodigo].push(articulo);
		}
		return acc;
	}, {} as Record<string, Articulo[]>);

	// Debug: mostrar configuración de visibilidad y orden
	$: if (configuracionRubros.length > 0) {
		console.log('Configuración completa:', configuracionRubros.map(c => `${c.codigo}: visible=${c.visible}, orden=${c.orden}`));
		console.log('Rubros visibles en el listado:', Object.keys(articulosPorRubro));
		console.log('Orden final en articulosPorRubroOrdenado:', articulosPorRubroOrdenado.map(r => r.codigo));
	}

	// Ordenar rubros según la configuración
	$: articulosPorRubroOrdenado = (() => {
		const resultado: Array<{codigo: string, articulos: Articulo[]}> = [];
		
		// Usar toda la configuración ordenada y solo incluir rubros visibles
		const configuracionOrdenada = [...configuracionRubros].sort((a, b) => a.orden - b.orden);
		
		for (const config of configuracionOrdenada) {
			if (config.visible && articulosPorRubro[config.codigo]) {
				resultado.push({
					codigo: config.codigo,
					articulos: articulosPorRubro[config.codigo]
				});
			}
		}
		
		return resultado;
	})();

	// Crear configuración por defecto cuando se carguen los rubros
	$: if (rubros.length > 0 && configuracionRubros.length === 0) {
		crearConfiguracionPorDefecto();
	}

	// Asegurar que la configuración se aplique inmediatamente
	$: if (configuracionRubros.length > 0) {
		// Forzar la reactividad del filtrado
		articulosPorRubro = articulosPorRubro;
	}

	// Guardar configuración automáticamente cuando cambien los filtros
	$: if (typeof window !== 'undefined') {
		guardarConfiguracionRubros();
	}

	// Obtener nombre del rubro
	function getNombreRubro(codigo: string): string {
		if (codigo === 'SIN_RUBRO') return 'Sin Rubro';
		const rubro = rubros.find(r => r.Codigo === codigo);
		return rubro ? rubro.Descripcion : `Rubro ${codigo}`;
	}

	// Obtener precio según lista
	function getPrecioLista(articulo: Articulo): number {
		const precioCosto = articulo.PrecioCosto || 0;
		let porcentajeLista = 0;
		
		// Obtener el porcentaje de la lista seleccionada
		switch (listaPrecio) {
			case '1': porcentajeLista = articulo.PorcentajeLista1 || 0; break;
			case '2': porcentajeLista = articulo.PorcentajeLista2 || 0; break;
			case '3': porcentajeLista = articulo.PorcentajeLista3 || 0; break;
			case '4': porcentajeLista = articulo.PorcentajeLista4 || 0; break;
			case '5': porcentajeLista = articulo.PorcentajeLista5 || 0; break;
			default: porcentajeLista = articulo.PorcentajeLista1 || 0; break;
		}
		
		// Calcular precio de lista: precio de costo + porcentaje
		return precioCosto * (1 + porcentajeLista / 100);
	}

	// Obtener precio con IVA
	function getPrecioConIva(articulo: Articulo): number {
		const precioLista = getPrecioLista(articulo);
		const porcentajeIva = articulo.PorcentajeIVA1 || 21;
		return precioLista * (1 + porcentajeIva / 100);
	}

	// Obtener nivel de existencia
	function getNivelExistencia(articulo: Articulo): string {
		if (!mostrarExistencia) return '';
		
		const existencia = articulo.Existencia || 0;
		const existenciaMinima = articulo.ExistenciaMinima || 0;
		
		if (existencia === 0) return 'X'; // Sin stock
		if (existencia <= existenciaMinima) return '!'; // Stock bajo
		return 'OK'; // Stock alto
	}

	// Funciones para localStorage
	function guardarConfiguracionRubros() {
		if (typeof window !== 'undefined') {
			const config = {
				configuracionRubros,
				listaPrecio,
				mostrarExistencia,
				soloActivos
			};
			localStorage.setItem('listadoPreciosConfig', JSON.stringify(config));
		}
	}

	function cargarConfiguracionRubros() {
		if (typeof window !== 'undefined') {
			const config = localStorage.getItem('listadoPreciosConfig');
			if (config) {
				try {
					const datos = JSON.parse(config);
					configuracionRubros = datos.configuracionRubros || [];
					listaPrecio = datos.listaPrecio || '1';
					mostrarExistencia = datos.mostrarExistencia !== undefined ? datos.mostrarExistencia : true;
					soloActivos = datos.soloActivos !== undefined ? datos.soloActivos : true;
				} catch (error) {
					console.error('Error al cargar configuración:', error);
				}
			}
		}
	}

	function crearConfiguracionPorDefecto() {
		// Crear configuración por defecto con todos los rubros visibles y ordenados alfabéticamente
		if (configuracionRubros.length === 0 && rubros.length > 0) {
			const rubrosOrdenados = [...rubros.map(r => r.Codigo).sort(), 'SIN_RUBRO'];
			configuracionRubros = rubrosOrdenados.map((codigo, index) => ({
				codigo,
				visible: true,
				orden: index
			}));
			guardarConfiguracionRubros();
		}
	}

	// Cargar datos
	onMount(async () => {
		try {
			loading = true;
			error = null;

			// Cargar configuración guardada
			cargarConfiguracionRubros();

			// Cargar datos de la empresa
			empresa = await EmpresaService.obtenerDatos();

			// Cargar rubros
			rubros = await RubroService.obtenerRubros();

			// Crear configuración por defecto después de cargar rubros
			crearConfiguracionPorDefecto();

			// Cargar artículos para listado de precios (todos sin paginación)
			articulos = await ArticuloService.obtenerArticulosParaListadoPrecios(soloActivos);

		} catch (err) {
			console.error('Error al cargar datos:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			loading = false;
		}
	});

	// Funciones para manejo de rubros
	function toggleRubroVisible(codigoRubro: string) {
		const config = configuracionRubros.find(c => c.codigo === codigoRubro);
		if (config) {
			config.visible = !config.visible;
			configuracionRubros = [...configuracionRubros];
			guardarConfiguracionRubros();
		}
	}

	function mostrarTodosLosRubros() {
		configuracionRubros = configuracionRubros.map(config => ({ ...config, visible: true }));
		guardarConfiguracionRubros();
	}

	function ocultarTodosLosRubros() {
		configuracionRubros = configuracionRubros.map(config => ({ ...config, visible: false }));
		guardarConfiguracionRubros();
	}

	function moverRubroArriba(index: number) {
		console.log('Mover arriba - index:', index, 'configuracionRubros.length:', configuracionRubros.length);
		if (index > 0) {
			const config = configuracionRubros[index];
			const configAnterior = configuracionRubros[index - 1];
			
			console.log('Antes del cambio:', config.codigo, 'orden:', config.orden, '->', configAnterior.codigo, 'orden:', configAnterior.orden);
			
			// Intercambiar orden
			const tempOrden = config.orden;
			config.orden = configAnterior.orden;
			configAnterior.orden = tempOrden;
			
			console.log('Después del cambio:', config.codigo, 'orden:', config.orden, '->', configAnterior.codigo, 'orden:', configAnterior.orden);
			
			configuracionRubros = [...configuracionRubros];
			guardarConfiguracionRubros();
		}
	}

	function moverRubroAbajo(index: number) {
		console.log('Mover abajo - index:', index, 'configuracionRubros.length:', configuracionRubros.length);
		if (index < configuracionRubros.length - 1) {
			const config = configuracionRubros[index];
			const configSiguiente = configuracionRubros[index + 1];
			
			console.log('Antes del cambio:', config.codigo, 'orden:', config.orden, '->', configSiguiente.codigo, 'orden:', configSiguiente.orden);
			
			// Intercambiar orden
			const tempOrden = config.orden;
			config.orden = configSiguiente.orden;
			configSiguiente.orden = tempOrden;
			
			console.log('Después del cambio:', config.codigo, 'orden:', config.orden, '->', configSiguiente.codigo, 'orden:', configSiguiente.orden);
			
			configuracionRubros = [...configuracionRubros];
			guardarConfiguracionRubros();
		}
	}

			// Generar PDF
	async function generarPDF() {
		try {
			generandoPDF = true;
			
			// Convertir el array ordenado a objeto para el backend
			const articulosPorRubroObj = articulosPorRubroOrdenado.reduce((acc, {codigo, articulos}) => {
				acc[codigo] = articulos;
				return acc;
			}, {} as Record<string, Articulo[]>);

			// Obtener el orden de los rubros visibles
			const ordenRubros = articulosPorRubroOrdenado.map(rubro => rubro.codigo);

			const datos = {
				empresa: empresa,
				fecha: new Date().toISOString().split('T')[0],
				listaPrecio: parseInt(listaPrecio),
				mostrarExistencia: mostrarExistencia,
				articulosPorRubro: articulosPorRubroObj,
				rubros: rubros,
				ordenRubros: ordenRubros
			};

			const response = await fetchWithAuth('/api/articulos/listado-precios-pdf', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(datos)
			});

			if (!response.ok) {
				throw new Error('Error al generar PDF');
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			
			// Descargar PDF
			const a = document.createElement('a');
			a.href = url;
			const nombreEmpresa = empresa?.RazonSocial || 'Empresa';
			const fecha = formatDate(new Date().toISOString());
			a.download = `${nombreEmpresa}_listade_precios_${fecha}.pdf`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

		} catch (err) {
			console.error('Error al generar PDF:', err);
			error = err instanceof Error ? err.message : 'Error al generar PDF';
		} finally {
			generandoPDF = false;
		}
	}

	// Compartir PDF
	async function compartirPDF() {
		try {
			generandoPDF = true;
			
			// Convertir el array ordenado a objeto para el backend
			const articulosPorRubroObj = articulosPorRubroOrdenado.reduce((acc, {codigo, articulos}) => {
				acc[codigo] = articulos;
				return acc;
			}, {} as Record<string, Articulo[]>);

			// Obtener el orden de los rubros visibles
			const ordenRubros = articulosPorRubroOrdenado.map(rubro => rubro.codigo);

			const datos = {
				empresa: empresa,
				fecha: new Date().toISOString().split('T')[0],
				listaPrecio: parseInt(listaPrecio),
				mostrarExistencia: mostrarExistencia,
				articulosPorRubro: articulosPorRubroObj,
				rubros: rubros,
				ordenRubros: ordenRubros
			};

			const response = await fetchWithAuth('/api/articulos/listado-precios-pdf', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(datos)
			});

			if (!response.ok) {
				throw new Error('Error al generar PDF');
			}

			const blob = await response.blob();
			
			// Usar Web Share API si está disponible
			if (navigator.share) {
				const nombreEmpresa = empresa?.RazonSocial || 'Empresa';
				const fecha = formatDate(new Date().toISOString());
				const file = new File([blob], `${nombreEmpresa}_listade_precios_${fecha}.pdf`, {
					type: 'application/pdf'
				});
				
				await navigator.share({
					title: 'Listado de Precios',
					files: [file]
				});
			} else {
				// Fallback: descargar
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				const nombreEmpresa = empresa?.RazonSocial || 'Empresa';
				const fecha = formatDate(new Date().toISOString());
				a.download = `${nombreEmpresa}_listade_precios_${fecha}.pdf`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}

		} catch (err) {
			console.error('Error al compartir PDF:', err);
			error = err instanceof Error ? err.message : 'Error al compartir PDF';
		} finally {
			generandoPDF = false;
		}
	}

	// Imprimir vista previa
	function imprimirVistaPrevia() {
		window.print();
	}
</script>

<div class="container mx-auto px-4 py-6">
	<h1 class="text-2xl font-bold mb-6">Listado de Precios</h1>

	<!-- Configuración -->
	<div class="bg-white rounded-lg shadow-md p-4 mb-6">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div>
				<label for="listaPrecio" class="block text-sm font-medium text-gray-700 mb-2">
					Lista de Precios
				</label>
				<select 
					id="listaPrecio" 
					bind:value={listaPrecio}
					class="w-full border border-gray-300 rounded-md shadow-sm p-2"
				>
					<option value="1">Lista 1</option>
					<option value="2">Lista 2</option>
					<option value="3">Lista 3</option>
					<option value="4">Lista 4</option>
					<option value="5">Lista 5</option>
				</select>
			</div>

			<div class="flex items-end">
				<label class="inline-flex items-center">
					<input 
						type="checkbox" 
						bind:checked={mostrarExistencia} 
						class="form-checkbox h-5 w-5 text-indigo-600"
					>
					<span class="ml-2 text-gray-700">Mostrar existencia</span>
				</label>
			</div>

			<div class="flex items-end">
				<label class="inline-flex items-center">
					<input 
						type="checkbox" 
						bind:checked={soloActivos} 
						class="form-checkbox h-5 w-5 text-indigo-600"
					>
					<span class="ml-2 text-gray-700">Solo activos</span>
				</label>
			</div>

			<div class="flex items-end space-x-2">
				<Button 
					variant="primary" 
					on:click={generarPDF}
					disabled={generandoPDF || loading}
				>
					{generandoPDF ? 'Generando...' : 'Descargar PDF'}
				</Button>
				
				<Button 
					variant="secondary" 
					on:click={compartirPDF}
					disabled={generandoPDF || loading}
				>
					Compartir
				</Button>
				
				<Button 
					variant="secondary" 
					on:click={imprimirVistaPrevia}
					disabled={loading}
				>
					Imprimir
				</Button>
			</div>
		</div>
	</div>

	<!-- Configuración de Rubros -->
	<div class="bg-white rounded-lg shadow-md p-4 mb-6">
		<div class="flex justify-between items-center mb-4">
			<h3 class="text-lg font-semibold text-gray-800">Configuración de Rubros</h3>
			<Button 
				variant="secondary" 
				on:click={() => mostrarConfiguracionRubros = !mostrarConfiguracionRubros}
			>
				{mostrarConfiguracionRubros ? 'Ocultar' : 'Configurar'} Rubros
			</Button>
		</div>

		{#if mostrarConfiguracionRubros}
			<div class="space-y-4">
				<!-- Controles generales -->
				<div class="flex space-x-2">
					<Button variant="secondary" size="sm" on:click={mostrarTodosLosRubros}>
						Mostrar Todos
					</Button>
					<Button variant="secondary" size="sm" on:click={ocultarTodosLosRubros}>
						Ocultar Todos
					</Button>
					<Button variant="secondary" size="sm" on:click={() => {
						console.log('Estado actual:');
						console.log('rubros:', rubros);
						console.log('configuracionRubros:', configuracionRubros);
					}}>
						Debug Estado
					</Button>
				</div>

				<!-- Lista de rubros ordenados -->
				<div class="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
					{#each configuracionRubros.sort((a, b) => a.orden - b.orden) as config, index}
						<div class="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
							<div class="flex items-center space-x-3 flex-1">
								<button 
									on:click={() => toggleRubroVisible(config.codigo)}
									class={`px-2 py-1 text-xs rounded ${
										config.visible
											? 'bg-green-100 text-green-700 hover:bg-green-200' 
											: 'bg-red-100 text-red-700 hover:bg-red-200'
									}`}
								>
									{config.visible ? 'Visible' : 'Oculto'}
								</button>
								<span class="text-sm font-mono text-gray-500">{config.codigo}</span>
								<span class="text-sm text-gray-700">
									{config.codigo === 'SIN_RUBRO' ? 'Sin Rubro' : 
										rubros.find(r => r.Codigo === config.codigo)?.Descripcion || config.codigo}
								</span>
							</div>
							
							<div class="flex space-x-1">
								<button 
									on:click={() => moverRubroArriba(index)}
									disabled={index === 0}
									class="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
									title="Mover arriba"
								>
									↑
								</button>
								<button 
									on:click={() => moverRubroAbajo(index)}
									disabled={index === configuracionRubros.length - 1}
									class="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
									title="Mover abajo"
								>
									↓
								</button>
							</div>
						</div>
					{/each}
				</div>

				<!-- Información del orden -->
				<div class="text-sm text-gray-600 bg-gray-50 p-3 rounded">
					<p><strong>Orden actual:</strong> Todos los rubros están incluidos en el orden. Usa los botones ↑/↓ para reorganizar la posición de cada rubro en el listado.</p>
				</div>
			</div>
		{/if}
	</div>

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
		<div class="bg-white rounded-lg shadow-md p-6 print:shadow-none">
			<!-- Encabezado -->
			<div class="text-center mb-8 print:mb-4">
				{#if empresa?.Logo}
					<img src={empresa.Logo} alt="Logo" class="h-16 mx-auto mb-4 print:h-12">
				{/if}
				<h2 class="text-2xl font-bold text-gray-800 print:text-xl">
					{empresa?.RazonSocial || 'Empresa'}
				</h2>
				<p class="text-lg text-gray-600 print:text-base">
					Listado de Precios - Lista {listaPrecio}
				</p>
				<p class="text-sm text-gray-500 print:text-xs">
					Fecha: {formatDate(new Date().toISOString())}
				</p>
			</div>

			<!-- Listado por rubros -->
			{#each articulosPorRubroOrdenado as {codigo: rubroCodigo, articulos: articulosRubro}}
				<div class="mb-8 print:mb-6">
					<h3 class="text-xl font-bold text-gray-800 mb-4 print:text-lg print:mb-3 border-b-2 border-gray-300 pb-2">
						{getNombreRubro(rubroCodigo)}
					</h3>

					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200 print:text-xs">
							<thead class="bg-gray-50 print:bg-gray-100">
								<tr>
									<th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">
										Código
									</th>
									<th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">
										Descripción
									</th>
									<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">
										Precio Lista
									</th>
									<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">
										Precio + IVA
									</th>
									{#if mostrarExistencia}
										<th class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-2">
											Existencia
										</th>
									{/if}
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each articulosRubro as articulo}
									<tr class="hover:bg-gray-50 print:hover:bg-transparent">
										<td class="px-3 py-4 whitespace-nowrap text-sm font-mono print:px-2 print:py-2">
											{articulo.Codigo}
										</td>
										<td class="px-3 py-4 text-sm print:px-2 print:py-2">
											{articulo.Descripcion}
										</td>
										<td class="px-3 py-4 whitespace-nowrap text-sm text-right print:px-2 print:py-2">
											${getPrecioLista(articulo).toFixed(2)}
										</td>
										<td class="px-3 py-4 whitespace-nowrap text-sm text-right print:px-2 print:py-2">
											${getPrecioConIva(articulo).toFixed(2)}
										</td>
										{#if mostrarExistencia}
											<td class="px-3 py-4 whitespace-nowrap text-sm text-center print:px-2 print:py-2">
												<span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
													getNivelExistencia(articulo) === 'NULA' ? 'bg-red-100 text-red-800' :
													getNivelExistencia(articulo) === 'BAJA' ? 'bg-yellow-100 text-yellow-800' :
													'bg-green-100 text-green-800'
												}`}>
													{getNivelExistencia(articulo)}
												</span>
											</td>
										{/if}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}

			<!-- Pie de página -->
			<div class="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500 print:mt-6">
				<p>Total de artículos: {articulos.length}</p>
				<p>Generado el {formatDate(new Date().toISOString())}</p>
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
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Estilos para impresión */
	@media print {
		.container {
			max-width: none;
			padding: 0;
		}
		
		table {
			font-size: 10pt;
		}
		
		th, td {
			padding: 4px 6px;
		}
	}
</style> 