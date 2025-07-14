<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatDate, formatDateTime } from '$lib/utils/dateUtils';
	import { PreventaService } from '$lib/services/PreventaService';
	import type { PreventaCabeza, PreventaFiltros, PreventaItem, Preventa } from '$lib/types';
	import { goto } from '$app/navigation';
	import { ClienteService } from '$lib/services/ClienteService';
	import { VendedorService } from '$lib/services/VendedorService';
	import EntitySelector from '$lib/components/ui/EntitySelector.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	
	// Estado
	let preventas: PreventaCabeza[] = [];
	let loading = true;
	let error: string | null = null;
	
	// Selección múltiple
	let selectedPreventas: string[] = []; // IDs de preventas seleccionadas
	let selectedAll = false;
	
	// Variables para informes
	let showInformeModal = false;
	let informeText = "";
	let informeTitle = "";
	let preventasDetalle: Preventa[] = [];
	let loadingInforme = false;
	
	// Variable para ordenamiento del resumen
	let ordenamientoResumen: 'codigo' | 'descripcion' | 'proveedor' | 'rubro' | 'cantidad' = 'codigo';
	
	// Paginación
	let currentPage = 1;
	let totalPages = 0;
	let itemsPerPage = 100;
	let totalItems = 0;
	
	// Filtros
	let filtros: PreventaFiltros = {
		cliente: '',
		vendedores: [], // Cambiado a array para múltiples vendedores
		fechaDesde: '',
		fechaHasta: '',
		pendientes: true
	};
	let resumenVisible = false;
	
	// Variables para almacenar el cliente y vendedor seleccionados
	let clienteSeleccionado: any = null;
	let vendedores: any[] = []; // Array de vendedores disponibles
	let vendedoresSeleccionados: string[] = []; // Array de códigos de vendedores seleccionados
	
	// Variable para controlar la carga asíncrona del selector de vendedor
	let vendedorSelectorReady = false;
	
	// Reactive statement para actualizar filtros cuando cambien los vendedores seleccionados
	$: if (vendedorSelectorReady && vendedoresSeleccionados) {
		filtros.vendedores = [...vendedoresSeleccionados];
	}
	
	// Cargar preventas al montar el componente
	onMount(() => {
		cargarPreventas();
		cargarVendedores();
	});
	
	// Función para cargar vendedores
	async function cargarVendedores() {
		try {
			const vendedoresOptions = await VendedorService.obtenerVendedoresActivos();
			// Convertir las opciones al formato que espera el MultiSelect
			vendedores = vendedoresOptions.map(option => ({
				Codigo: option.value,
				Descripcion: option.label
			}));
			// Activar el selector de vendedor después de cargar los vendedores
			vendedorSelectorReady = true;
		} catch (err) {
			console.error('Error al cargar vendedores:', err);
			// Activar el selector incluso si hay error para que no se quede bloqueado
			vendedorSelectorReady = true;
		}
	}
	
	// Función para cargar preventas usando el servicio
	async function cargarPreventas() {
		loading = true;
		error = null;
		
		try {
			const resultado = await PreventaService.listarPreventas(currentPage, itemsPerPage, filtros);
			preventas = resultado.data;
			totalItems = resultado.meta.totalItems;
			totalPages = resultado.meta.totalPages;
			// Limpiar selecciones al cambiar la página
			console.log("%%%%preventas", preventas);
			selectedPreventas = [];
			selectedAll = false;
		} catch (err) {
			console.error('Error al cargar preventas:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			loading = false;
		}
	}
	
	// Cambiar de página
	function cambiarPagina(pagina: number) {
		if (pagina < 1 || pagina > totalPages) return;
		currentPage = pagina;
		cargarPreventas();
	}
	
	// Aplicar filtros
	function aplicarFiltros() {
		// Actualizar filtros con los vendedores seleccionados
		filtros.vendedores = [...vendedoresSeleccionados]; // Crear una copia del array
		currentPage = 1; // Resetear a primera página
		cargarPreventas();
	}
	
	// Limpiar filtros
	function limpiarFiltros() {
		filtros = {
			cliente: '',
			vendedores: [],
			fechaDesde: '',
			fechaHasta: '',
			pendientes: true
		};
		vendedoresSeleccionados = [];
		currentPage = 1;
		cargarPreventas();
	}
	
	// Editar preventa
	function editarPreventa(preventa: PreventaCabeza) {
		goto(`/ventas/preventas/nueva?editar=${preventa.DocumentoTipo}/${preventa.DocumentoSucursal}/${preventa.DocumentoNumero}`);
	}
	
	// Anular preventa
	async function anularPreventa(preventa: PreventaCabeza) {
		if (!confirm('¿Está seguro que desea anular esta preventa?')) return;
		
		try {
			await PreventaService.anularPreventa(
				preventa.DocumentoTipo,
				preventa.DocumentoSucursal,
				preventa.DocumentoNumero
			);
			alert('Preventa anulada correctamente');
			cargarPreventas(); // Recargar lista
		} catch (err) {
			console.error('Error al anular preventa:', err);
			alert(`Error al anular preventa: ${err instanceof Error ? err.message : 'Error desconocido'}`);
		}
	}
	
	// Facturar preventa - Redirigir a formulario de factura con datos precargados
	function facturarPreventa(preventa: PreventaCabeza) {
		goto(`/ventas/facturas/nueva?preventa=${preventa.DocumentoTipo}/${preventa.DocumentoSucursal}/${preventa.DocumentoNumero}`);
	}
	
	// Determinar el estado de la preventa
	function getEstadoPreventa(preventa: PreventaCabeza): string {
		if (preventa.FechaAnulacion) return 'Anulada';
		if (preventa.FacturaNumero) return 'Facturada';
		return 'Pendiente';
	}
	
	// Retornar clase CSS según estado
	function getClaseEstado(estado: string): string {
		switch (estado) {
			case 'Anulada':
				return 'bg-red-100 text-red-800';
			case 'Facturada':
				return 'bg-green-100 text-green-800';
			case 'Pendiente':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
	
	// Alternar selección de una preventa
	function toggleSelectPreventa(preventa: PreventaCabeza) {
		const preventaId = `${preventa.DocumentoTipo}-${preventa.DocumentoSucursal}-${preventa.DocumentoNumero}`;
		
		if (selectedPreventas.includes(preventaId)) {
			selectedPreventas = selectedPreventas.filter(id => id !== preventaId);
		} else {
			selectedPreventas = [...selectedPreventas, preventaId];
		}
		
		// Actualizar estado de "seleccionar todos"
		selectedAll = preventas.length > 0 && selectedPreventas.length === preventas.length;
	}
	
	// Manejar seleccionar/deseleccionar todos
	function handleSelectAll() {
		if (selectedAll) {
			selectedPreventas = [];
		} else {
			selectedPreventas = preventas.map(preventa => 
				`${preventa.DocumentoTipo}-${preventa.DocumentoSucursal}-${preventa.DocumentoNumero}`
			);
		}
		selectedAll = !selectedAll;
	}
	
	// Obtener resumen de preventas
	async function generarResumen() {
		if (selectedPreventas.length === 0) {
			alert('Seleccione al menos una preventa para generar el resumen');
			return;
		}
		
		loadingInforme = true;
		
		try {
			// Preparar los datos de las preventas seleccionadas
			const preventasData = selectedPreventas.map(preventaId => {
				const [tipo, sucursal, numero] = preventaId.split('-');
				return { numero, sucursal };
			});
			
			console.log('🔍 Datos de preventas a enviar:', preventasData);
			console.log('🔍 Preventas seleccionadas:', selectedPreventas);
			console.log('🔍 Ordenamiento:', ordenamientoResumen);
			
			// Llamar al nuevo endpoint con ordenamiento
			const resultado = await PreventaService.obtenerResumenPreventas(preventasData, ordenamientoResumen);
			
			console.log('📥 Respuesta del servidor:', resultado);
			
			if (resultado.success) {
				const resumen = resultado.data;
				
				console.log('📊 Datos del resumen:', resumen);
				
				// Generar texto del informe
				let texto = "RESUMEN DE PREVENTAS SELECCIONADAS\n";
				texto += "=====================================\n\n";
				texto += `CANTIDAD DE PREVENTAS: ${resumen.encabezado.cantidadPreventas}\n`;
				texto += `CANTIDAD DE ARTÍCULOS: ${resumen.encabezado.cantidadArticulos}\n`;
				texto += `TOTAL DE CANTIDAD: ${resumen.encabezado.totalCantidad}\n`;
				texto += `ORDENADO POR: ${getOrdenamientoTexto(resumen.encabezado.ordenadoPor)}\n\n`;
				texto += "DETALLE DE ARTÍCULOS:\n";
				texto += "===================\n";
				texto += "CANTIDAD  DESCRIPCIÓN                                    CÓDIGO    PREV\n";
				texto += "==================================================================\n";
				
				// Listar cada ítem
				let currentGroup = '';
				for (const item of resumen.items) {
					// Agregar separador si cambia el grupo (para rubro o proveedor)
					if (ordenamientoResumen === 'rubro' || ordenamientoResumen === 'proveedor') {
						const groupKey = ordenamientoResumen === 'rubro' ? item.rubroDescripcion : item.proveedorDescripcion;
						if (groupKey !== currentGroup) {
							currentGroup = groupKey;
							texto += "\n";
							texto += `${"=".repeat(70)}\n`;
							texto += `${ordenamientoResumen === 'rubro' ? 'RUBRO' : 'PROVEEDOR'}: ${groupKey}\n`;
							texto += `${"=".repeat(70)}\n\n`;
						}
					}
					
					const cantidad = item.cantidad.toString().padStart(6);
					const descripcion = item.descripcion.padEnd(53);
					const codigo = item.codigo.padEnd(10);
					const preventas = item.preventas || 1; // Cantidad de preventas donde aparece
					
					texto += `${cantidad}  ${descripcion} ${codigo} ${preventas}\n`;
				}
				
				informeTitle = "Resumen de Preventas";
				informeText = texto;
				showInformeModal = true;
			} else {
				alert('Error al generar el resumen: ' + (resultado.message || 'Error desconocido'));
			}
		} catch (err) {
			console.error('Error al generar resumen:', err);
			alert(`Error al generar resumen: ${err instanceof Error ? err.message : 'Error desconocido'}`);
		} finally {
			loadingInforme = false;
		}
	}
	
	// Función auxiliar para obtener texto del ordenamiento
	function getOrdenamientoTexto(orden: string): string {
		switch (orden) {
			case 'codigo': return 'Código';
			case 'descripcion': return 'Descripción';
			case 'proveedor': return 'Proveedor';
			case 'rubro': return 'Rubro';
			case 'cantidad': return 'Cantidad (mayor a menor)';
			default: return 'Código';
		}
	}
	
	// Calcular totales para el resumen
	function calcularTotales() {
		const preventasSeleccionadas = selectedPreventas.length > 0 
			? preventas.filter(p => selectedPreventas.includes(`${p.DocumentoTipo}-${p.DocumentoSucursal}-${p.DocumentoNumero}`))
			: preventas;
		
		const totalImporte = preventasSeleccionadas.reduce((sum, p) => sum + (p.ImporteTotal || 0), 0);
		const totalPendientes = preventasSeleccionadas.filter(p => !p.FechaAnulacion && !p.FacturaNumero).length;
		const totalFacturadas = preventasSeleccionadas.filter(p => p.FacturaNumero).length;
		const totalAnuladas = preventasSeleccionadas.filter(p => p.FechaAnulacion).length;
		
		return {
			totalImporte,
			totalPendientes,
			totalFacturadas,
			totalAnuladas,
			totalPreventas: preventasSeleccionadas.length
		};
	}
	
	// Función para manejar la selección de cliente
	function handleClienteSelect(event: CustomEvent) {
		filtros.cliente = event.detail.value;
	}
	

	
	// Función para cargar los detalles de las preventas seleccionadas
	async function cargarDetallesPreventas() {
		if (selectedPreventas.length === 0) {
			alert('Seleccione al menos una preventa para generar informes');
			return false;
		}
		
		loadingInforme = true;
		preventasDetalle = [];
		
		try {
			// Cargar los detalles de cada preventa seleccionada
			for (const preventaId of selectedPreventas) {
				const [tipo, sucursal, numero] = preventaId.split('-');
				const detalle = await PreventaService.obtenerPreventa(tipo, sucursal, numero);
				if (detalle) {
					preventasDetalle.push(detalle);
				}
			}
			loadingInforme = false;
			return true;
		} catch (err) {
			console.error('Error al cargar detalles de preventas:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
			loadingInforme = false;
			return false;
		}
	}
	
	// Función para generar informe detallado
	async function generarInformeDetallado() {
		if (await cargarDetallesPreventas()) {
			let texto = "";
			
			texto += "INFORME DETALLADO DE PREVENTAS\n";
			texto += "===============================\n\n";
			texto += `CANTIDAD DE PREVENTAS: ${preventasDetalle.length}\n\n`;
			
			// Para cada preventa, generar detalle
			for (const preventa of preventasDetalle) {
				const cabecera = preventa.preventa;
				
				// Información de la cabecera simplificada
				texto += `CLIENTE: ${cabecera.Cliente?.Descripcion || 'No especificado'} - DOCUMENTO: ${cabecera.DocumentoTipo}-${cabecera.DocumentoSucursal}-${cabecera.DocumentoNumero}\n`;
				
				texto += "-".repeat(70) + "\n";
				texto += "CANT.  DESCRIPCIÓN                                    CÓDIGO\n";
				texto += "-".repeat(70) + "\n";
				
				// Listar cada ítem
				for (const item of preventa.items) {
					const cantidad = (item.Cantidad || 0).toString().padStart(6);
					const descripcion = (item.Articulo?.Descripcion || 'Sin descripción').padEnd(40);
					const codigo = (item.CodigoArticulo || '').padEnd(10);
					
					texto += `${cantidad}  ${descripcion} ${codigo}\n`;
				}
				
				// Separador entre preventas
				texto += "\n\n";
			}
			
			informeTitle = "Informe por Preventa";
			informeText = texto;
			showInformeModal = true;
		}
	}
</script>

<div class="container mx-auto px-4 py-6">
	<h1 class="text-2xl font-bold mb-6">Listado de Preventas</h1>
	
	<!-- Filtros siempre visibles -->
	<div class="bg-white rounded-lg shadow-md p-4 mb-6">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-4">
			<!-- Selector de cliente usando EntitySelector -->
			<div>
				<EntitySelector
					label="Cliente"
					placeholder="Buscar cliente..."
					apiEndpoint="/clientes"
					valueField="Codigo"
					labelField="Descripcion"
					initialValue={filtros.cliente}
					minSearchLength={3}
					on:select={handleClienteSelect}
				/>
			</div>
			
			<!-- Selector múltiple de vendedores usando MultiSelect -->
			<div>
				<label for="vendedores-select" class="block text-sm font-medium text-gray-700 mb-2">
					Vendedores
				</label>
				<MultiSelect
					items={vendedores}
					bind:selectedValues={vendedoresSeleccionados}
					labelField="Descripcion"
					valueField="Codigo"
					placeholder="Seleccione vendedores..."
				/>
			</div>
			
			<div>
				<label for="filtroFechaDesde" class="block text-sm font-medium text-gray-700">Fecha desde</label>
				<input 
					type="date" 
					id="filtroFechaDesde" 
					bind:value={filtros.fechaDesde}
					class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
				/>
			</div>
			
			<div>
				<label for="filtroFechaHasta" class="block text-sm font-medium text-gray-700">Fecha hasta</label>
				<input 
					type="date" 
					id="filtroFechaHasta" 
					bind:value={filtros.fechaHasta}
					class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
				/>
			</div>
			
			<div class="flex items-end">
				<label class="inline-flex items-center">
					<input type="checkbox" bind:checked={filtros.pendientes} class="form-checkbox h-5 w-5 text-indigo-600">
					<span class="ml-2 text-gray-700">Solo pendientes</span>
				</label>
			</div>
		</div>
		
		<div class="flex justify-between items-center">
			<div class="flex space-x-2">
				<Button variant="secondary" on:click={limpiarFiltros}>Limpiar Filtros</Button>
				<Button variant="primary" on:click={aplicarFiltros}>Aplicar Filtros</Button>
			</div>
			
			<Button variant="primary" on:click={() => goto('/ventas/preventas/nueva')}>
				Nueva Preventa
			</Button>
		</div>
	</div>
	
	<!-- Barra de acciones y selección -->
	<div class="flex flex-wrap items-center justify-between mb-6">
		<div class="flex flex-wrap items-center space-x-4">
			<!-- Botón de resumen -->
			<Button 
				variant="primary"
				on:click={generarResumen}
				disabled={selectedPreventas.length === 0 || loadingInforme}
			>
				Resumen
			</Button>
			
			<!-- Botón de informe por preventa -->
			<Button 
				variant="secondary"
				on:click={generarInformeDetallado}
				disabled={selectedPreventas.length === 0 || loadingInforme}
			>
				Informe por Preventa
			</Button>
			
			<!-- Selector de ordenamiento para resúmenes -->
			{#if selectedPreventas.length > 0}
				<div class="flex items-center space-x-2">
					<label for="ordenamiento" class="text-sm font-medium text-gray-700">Ordenar por:</label>
					<select 
						id="ordenamiento" 
						bind:value={ordenamientoResumen}
						class="border border-gray-300 rounded-md shadow-sm p-2 text-sm"
					>
						<option value="codigo">Código</option>
						<option value="descripcion">Descripción</option>
						<option value="proveedor">Proveedor</option>
						<option value="rubro">Rubro</option>
						<option value="cantidad">Cantidad</option>
					</select>
				</div>
			{/if}
		</div>
		
		<!-- Mostrar cantidad seleccionada -->
		{#if selectedPreventas.length > 0}
			<div class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-sm font-medium">
				{selectedPreventas.length} preventas seleccionadas
			</div>
		{/if}
	</div>
	
	<!-- Resumen de preventas (visible cuando se solicita) -->
	{#if resumenVisible}
		{@const totales = calcularTotales()}
		<div class="bg-white rounded-lg shadow-md p-4 mb-6">
			<h2 class="text-lg font-bold mb-4">Resumen de Preventas</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div class="bg-gray-50 p-3 rounded-lg">
					<p class="text-sm text-gray-500">Total Preventas</p>
					<p class="text-2xl font-bold">{totales.totalPreventas}</p>
				</div>
				
				<div class="bg-yellow-50 p-3 rounded-lg">
					<p class="text-sm text-yellow-500">Pendientes</p>
					<p class="text-2xl font-bold">{totales.totalPendientes}</p>
				</div>
				
				<div class="bg-green-50 p-3 rounded-lg">
					<p class="text-sm text-green-500">Facturadas</p>
					<p class="text-2xl font-bold">{totales.totalFacturadas}</p>
				</div>
				
				<div class="bg-red-50 p-3 rounded-lg">
					<p class="text-sm text-red-500">Anuladas</p>
					<p class="text-2xl font-bold">{totales.totalAnuladas}</p>
				</div>
			</div>
			
			<div class="mt-4 p-3 bg-indigo-50 rounded-lg">
				<p class="text-sm text-indigo-500">Importe Total</p>
				<p class="text-2xl font-bold">${totales.totalImporte.toFixed(2)}</p>
			</div>
			
			<div class="mt-4 flex justify-end">
				<Button variant="secondary" on:click={() => resumenVisible = false}>Cerrar Resumen</Button>
			</div>
		</div>
	{/if}
	
	<!-- Modal para mostrar informes -->
	{#if showInformeModal}
		<div class="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen flex flex-col">
				<div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
					<h3 class="text-lg font-medium">{informeTitle}</h3>
					<button 
						on:click={() => showInformeModal = false}
						class="text-gray-400 hover:text-gray-500"
					>
						<!-- <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"> -->
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						<!-- </svg> -->
					</button>
				</div>
				
				<div class="p-4 flex-grow overflow-auto">
					<pre class="font-mono text-sm whitespace-pre-wrap bg-gray-100 p-4 h-full overflow-y-auto" style="font-size: 10pt;">{informeText}</pre>
				</div>
				
				<div class="px-4 py-3 border-t border-gray-200 flex justify-end space-x-3">
					<Button 
						variant="secondary" 
						on:click={() => showInformeModal = false}
					>
						Cerrar
					</Button>
					
					<Button 
						variant="secondary" 
						on:click={() => {
							// Copiar al portapapeles
							navigator.clipboard.writeText(informeText);
							alert('Informe copiado al portapapeles');
						}}
					>
						Copiar
					</Button>
					
					<Button 
						variant="secondary" 
						on:click={() => {
							// Crear blob y descargar
							const blob = new Blob([informeText], { type: 'text/plain' });
							const url = URL.createObjectURL(blob);
							const a = document.createElement('a');
							a.href = url;
							a.download = `${informeTitle.replace(/\s+/g, '_')}.txt`;
							document.body.appendChild(a);
							a.click();
							document.body.removeChild(a);
							URL.revokeObjectURL(url);
						}}
					>
						Descargar
					</Button>
					
					<Button 
						variant="primary" 
						on:click={() => {
							// Abrir ventana de impresión
							const printWindow = window.open('', '_blank');
							if (printWindow) {
								printWindow.document.write(`
									<html>
										<head>
											<title>${informeTitle}</title>
											<style>
												body {
													font-family: monospace;
													font-size: 10pt;
													white-space: pre;
													line-height: 1.2;
												}
												@media print {
													body { margin: 0.5cm; }
												}
											</style>
										</head>
										<body>${informeText.replace(/\n/g, '<br>')}</body>
									</html>
								`);
								printWindow.document.close();
								printWindow.focus();
								printWindow.print();
							}
						}}
					>
						Imprimir
					</Button>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Loading indicator para informes -->
	{#if loadingInforme}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white p-6 rounded-lg shadow-xl">
				<div class="flex items-center">
					<div class="spinner mr-3"></div>
					<p>Generando informe, por favor espere...</p>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Loading indicator -->
	{#if loading}
		<div class="flex justify-center items-center h-48">
			<div class="spinner"></div>
		</div>
	{:else if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
			<strong class="font-bold">Error: </strong>
			<span class="block sm:inline">{error}</span>
		</div>
	{:else if preventas.length === 0}
		<div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-6" role="alert">
			<span class="block sm:inline">No se encontraron preventas con los criterios seleccionados.</span>
		</div>
	{:else}
		<!-- Tabla de preventas -->
		<div class="overflow-x-auto shadow-md rounded-lg">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							<input 
								type="checkbox" 
								checked={selectedAll}
								on:click={handleSelectAll}
								class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
							/>
						</th>
						<th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Tipo
						</th>
						<th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Número
						</th>
						<th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Fecha
						</th>
						<th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Cliente
						</th>
						<th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Vendedor
						</th>
						<th scope="col" class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
							Total
						</th>
						<th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Estado
						</th>
						<th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Acciones
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each preventas as preventa (preventa.DocumentoTipo + preventa.DocumentoSucursal + preventa.DocumentoNumero)}
						{@const estado = getEstadoPreventa(preventa)}
						{@const preventaId = `${preventa.DocumentoTipo}-${preventa.DocumentoSucursal}-${preventa.DocumentoNumero}`}
						<tr class="hover:bg-gray-50">
							<td class="px-3 py-4 whitespace-nowrap">
								<input 
									type="checkbox" 
									checked={selectedPreventas.includes(preventaId)}
									on:click={() => toggleSelectPreventa(preventa)}
									class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
								/>
							</td>
							<td class="px-3 py-4 whitespace-nowrap">
								{preventa.DocumentoTipo}
							</td>
							<td class="px-3 py-4 whitespace-nowrap">
								{preventa.DocumentoSucursal}-{preventa.DocumentoNumero}
							</td>
							<td class="px-3 py-4 whitespace-nowrap">
								{formatDateTime(preventa.Fecha)}
							</td>
							<td class="px-3 py-4 whitespace-nowrap">
								{preventa.Cliente?.Descripcion || 'No especificado'}
							</td>
							<td class="px-3 py-4 whitespace-nowrap">
								{preventa.Vendedor?.Descripcion || 'No especificado'}
							</td>
							<td class="px-3 py-4 whitespace-nowrap text-right">
								${preventa.ImporteTotal?.toFixed(2) || '0.00'}
							</td>
							<td class="px-3 py-4 whitespace-nowrap">
								<span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getClaseEstado(estado)}`}>
									{estado}
								</span>
							</td>
							<td class="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
								<div class="flex items-center space-x-2">
									<!-- Editar (reemplaza el botón de Ver detalle) -->
									<button 
										class="text-indigo-600 hover:text-indigo-900"
										on:click={() => editarPreventa(preventa)}
										title="Editar preventa"
										aria-label="Editar preventa"
										disabled={preventa.FechaAnulacion !== null}
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
									</button>
									
									<!-- Facturar (siempre disponible) -->
									<button 
										class="text-green-600 hover:text-green-900"
										on:click={() => facturarPreventa(preventa)}
										title="Facturar"
										aria-label="Facturar preventa"
										disabled={preventa.FechaAnulacion !== null}
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
										</svg>
									</button>
									
									<!-- Anular (siempre disponible) -->
									<button 
										class="text-red-600 hover:text-red-900"
										on:click={() => anularPreventa(preventa)}
										title="Anular"
										aria-label="Anular preventa"
										disabled={preventa.FechaAnulacion !== null}
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		
		<!-- Paginación -->
		{#if totalPages > 1}
			<div class="flex justify-between items-center mt-6">
				<div class="flex items-center space-x-4">
					<div class="text-sm text-gray-700">
						Mostrando <span class="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span class="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span class="font-medium">{totalItems}</span> resultados
					</div>
					
					<div class="flex items-center space-x-2">
						<label for="itemsPerPage" class="text-sm text-gray-700">Mostrar:</label>
						<select 
							id="itemsPerPage" 
							bind:value={itemsPerPage}
							on:change={() => { currentPage = 1; cargarPreventas(); }}
							class="border border-gray-300 rounded-md text-sm p-1"
						>
							<option value="100">100</option>
							<option value="50">50</option>
							<option value="25">25</option>
							<option value="10">10</option>
							<option value="5">5</option>
						</select>
					</div>
				</div>
				
				<nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
					<button 
						class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
						on:click={() => cambiarPagina(1)}
						disabled={currentPage === 1}
						aria-label="Primera página"
					>
						<span class="sr-only">Primera</span>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
						</svg>
					</button>
					
					<button 
						class="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
						on:click={() => cambiarPagina(currentPage - 1)}
						disabled={currentPage === 1}
						aria-label="Página anterior"
					>
						<span class="sr-only">Anterior</span>
						<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
					</button>
					
					<!-- Botones de página -->
					{#each Array(totalPages > 5 ? 5 : totalPages) as _, i}
						{@const pageNum = 
							totalPages <= 5 
								? i + 1 
								: currentPage <= 3 
									? i + 1 
									: currentPage >= totalPages - 2 
										? totalPages - 4 + i 
										: currentPage - 2 + i}
						
						{#if pageNum > 0 && pageNum <= totalPages}
							<button 
								class={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === pageNum ? 'text-indigo-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
								on:click={() => cambiarPagina(pageNum)}
							>
								{pageNum}
							</button>
						{/if}
					{/each}
					
					<button 
						class="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
						on:click={() => cambiarPagina(currentPage + 1)}
						disabled={currentPage === totalPages}
						aria-label="Página siguiente"
					>
						<span class="sr-only">Siguiente</span>
						<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
						</svg>
					</button>
					
					<button 
						class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
						on:click={() => cambiarPagina(totalPages)}
						disabled={currentPage === totalPages}
						aria-label="Última página"
					>
						<span class="sr-only">Última</span>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
						</svg>
					</button>
				</nav>
			</div>
		{/if}
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
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style> 