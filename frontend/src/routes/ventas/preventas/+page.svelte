<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatDate } from '$lib/utils/dateUtils';
	import { PreventaService } from '$lib/services/PreventaService';
	import type { PreventaCabeza, PreventaFiltros } from '$lib/types';
	import { goto } from '$app/navigation';
	
	// Estado
	let preventas: PreventaCabeza[] = [];
	let loading = true;
	let error: string | null = null;
	
	// Paginación
	let currentPage = 1;
	let totalPages = 0;
	let itemsPerPage = 10;
	let totalItems = 0;
	
	// Filtros
	let filtros: PreventaFiltros = {
		cliente: '',
		tipo: '',
		vendedor: '',
		fechaDesde: '',
		fechaHasta: '',
		pendientes: false
	};
	let filtrosVisibles = false;
	
	// Función para cargar preventas usando el servicio
	async function cargarPreventas() {
		loading = true;
		error = null;
		
		try {
			const resultado = await PreventaService.listarPreventas(currentPage, itemsPerPage, filtros);
			preventas = resultado.data;
			totalItems = resultado.meta.totalItems;
			totalPages = resultado.meta.totalPages;
		} catch (err) {
			console.error('Error al cargar preventas:', err);
			error = err.message;
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
		currentPage = 1; // Resetear a primera página
		cargarPreventas();
	}
	
	// Limpiar filtros
	function limpiarFiltros() {
		filtros = {
			cliente: '',
			tipo: '',
			vendedor: '',
			fechaDesde: '',
			fechaHasta: '',
			pendientes: false
		};
		currentPage = 1;
		cargarPreventas();
	}
	
	// Navegar al detalle de la preventa
	function verDetalle(preventa: PreventaCabeza) {
		goto(`/ventas/preventas/${preventa.DocumentoTipo}/${preventa.DocumentoSucursal}/${preventa.DocumentoNumero}`);
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
			alert(`Error al anular preventa: ${err.message}`);
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
	
	// Agregar clases según estado
	function getClaseEstado(estado: string): string {
		switch (estado) {
			case 'Anulada':
				return 'bg-red-100 text-red-800';
			case 'Facturada':
				return 'bg-green-100 text-green-800';
			case 'Pendiente':
			default:
				return 'bg-yellow-100 text-yellow-800';
		}
	}
	
	// Obtener clase para la fila según estado
	function getClaseFila(preventa: PreventaCabeza): string {
		const estado = getEstadoPreventa(preventa);
		switch (estado) {
			case 'Anulada':
				return 'bg-red-50';
			case 'Facturada':
				return 'bg-green-50';
			default:
				return '';
		}
	}
	
	// Cargar datos al montar el componente
	onMount(() => {
		cargarPreventas();
	});
</script>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold">Preventas</h1>
		<Button variant="primary" href="/ventas/preventas/nueva">Nueva Preventa</Button>
	</div>
	
	<!-- Botón para mostrar/ocultar filtros -->
	<div class="mb-4">
		<Button 
			variant="secondary" 
			on:click={() => filtrosVisibles = !filtrosVisibles}
		>
			{filtrosVisibles ? 'Ocultar filtros' : 'Mostrar filtros'}
		</Button>
	</div>
	
	<!-- Filtros -->
	{#if filtrosVisibles}
		<div class="bg-white rounded-lg shadow-md p-4 mb-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label for="filtroCliente" class="block text-sm font-medium text-gray-700">Cliente</label>
					<input 
						type="text" 
						id="filtroCliente" 
						bind:value={filtros.cliente}
						class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
					/>
				</div>
				
				<div>
					<label for="filtroTipo" class="block text-sm font-medium text-gray-700">Tipo</label>
					<select 
						id="filtroTipo" 
						bind:value={filtros.tipo}
						class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
					>
						<option value="">Todos</option>
						<option value="PPV">Preventa</option>
						<option value="PRE">Presupuesto</option>
					</select>
				</div>
				
				<div>
					<label for="filtroVendedor" class="block text-sm font-medium text-gray-700">Vendedor</label>
					<input 
						type="text" 
						id="filtroVendedor" 
						bind:value={filtros.vendedor}
						class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
				
				<div class="flex items-center mt-6">
					<input 
						type="checkbox" 
						id="filtroPendientes" 
						bind:checked={filtros.pendientes}
						class="h-4 w-4 text-indigo-600 border-gray-300 rounded"
					/>
					<label for="filtroPendientes" class="ml-2 block text-sm text-gray-700">Solo pendientes</label>
				</div>
			</div>
			
			<div class="flex justify-end mt-4 space-x-3">
				<Button variant="outline" on:click={limpiarFiltros}>Limpiar</Button>
				<Button variant="primary" on:click={aplicarFiltros}>Aplicar filtros</Button>
			</div>
		</div>
	{/if}
	
	<!-- Tabla de preventas -->
	{#if loading}
		<div class="flex justify-center p-12">
			<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-700"></div>
		</div>
	{:else if error}
		<div class="p-4 bg-red-100 text-red-700 rounded-md">
			<p>Error: {error}</p>
			<Button variant="outline" class="mt-2" on:click={cargarPreventas}>Reintentar</Button>
		</div>
	{:else if preventas.length === 0}
		<div class="p-8 text-center bg-gray-50 rounded-md">
			<p class="text-gray-500">No se encontraron preventas. Intente cambiar los filtros o cree una nueva preventa.</p>
		</div>
	{:else}
		<div class="overflow-x-auto shadow-md rounded-lg">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
						<th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each preventas as preventa}
						<tr class={getClaseFila(preventa)}>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{preventa.DocumentoTipo}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{preventa.DocumentoSucursal}-{preventa.DocumentoNumero}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{formatDate(preventa.Fecha)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{preventa.Cliente?.Descripcion || preventa.ClienteCodigo}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{preventa.Vendedor?.Nombre || preventa.VendedorCodigo || 'N/A'}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
								${preventa.ImporteTotal?.toFixed(2) || '0.00'}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getClaseEstado(getEstadoPreventa(preventa))}`}>
									{getEstadoPreventa(preventa)}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
								<div class="flex justify-end space-x-2">
									<!-- Ver detalle -->
									<button 
										class="text-indigo-600 hover:text-indigo-900"
										on:click={() => verDetalle(preventa)}
										title="Ver detalle"
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										</svg>
									</button>
									
									<!-- Facturar (solo si está pendiente) -->
									{#if !preventa.FechaAnulacion && !preventa.FacturaNumero}
										<button 
											class="text-green-600 hover:text-green-900"
											on:click={() => facturarPreventa(preventa)}
											title="Facturar"
										>
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
											</svg>
										</button>
									{/if}
									
									<!-- Anular (solo si está pendiente) -->
									{#if !preventa.FechaAnulacion && !preventa.FacturaNumero}
										<button 
											class="text-red-600 hover:text-red-900"
											on:click={() => anularPreventa(preventa)}
											title="Anular"
										>
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		
		<!-- Paginación -->
		{#if totalPages > 1}
			<div class="flex justify-center mt-6">
				<nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
					<button 
						class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
						on:click={() => cambiarPagina(1)}
						disabled={currentPage === 1}
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