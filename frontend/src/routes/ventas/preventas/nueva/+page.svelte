<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/Button.svelte';
	import { PreventaService } from '$lib/services/PreventaService';
	import { ClienteService } from '$lib/services/ClienteService';
	import { ConfiguracionService } from '$lib/services/ConfiguracionService';
	import type { Articulo, Cliente, PreventaItem, Vendedor, TipoDePago, PreventaCabeza, PreventaFiltros, Preventa } from '$lib/types';
	import { goto } from '$app/navigation';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	
	// Estado del formulario
	let documentoTipo = 'PPV'; // Preventa por defecto
	let documentoSucursal = '0001'; // Sucursal por defecto
	let codigoCliente = '';
	let codigoVendedor = '';
	let tipoPago = '';
	let fecha = new Date().toISOString().slice(0, 10);
	let fechaEntrega = '';
	let observacion = '';
	
	// Datos seleccionados
	let clienteSeleccionado: Cliente | null = null;
	let vendedorSeleccionado: Vendedor | null = null;
	
	// Items de la preventa
	let items: PreventaItem[] = [];
	
	// Datos para selección
	let clientes: Cliente[] = [];
	let articulos: Articulo[] = [];
	let vendedores: Vendedor[] = [];
	let tiposPago: TipoDePago[] = [];
	
	// Estados UI
	let loadingClientes = false;
	let loadingArticulos = false;
	let loadingVendedores = false;
	let loadingTiposPago = false;
	let buscandoCliente = false;
	let buscandoArticulo = false;
	let guardando = false;
	let loading = false;
	let error: string | null = null;
	
	// Filtros
	let filtroCliente = '';
	let filtroArticulo = '';
	let clientesBusqueda = '';
	let mostrarSelectorClientes = false;
	
	// Variables para búsqueda de cliente (como en nueva factura)
	let clientesOptions: Cliente[] = [];
	let clientesLoading = false;
	let clienteSearch = '';
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	
	// Variables para búsqueda de artículo
	let articulosOptions: Articulo[] = [];
	let articulosLoading = false;
	let articuloSearch = '';
	let articuloTimeoutId: ReturnType<typeof setTimeout> | null = null;
	
	// Artículo en edición
	let articuloSeleccionado: Articulo | null = null;
	let cantidadArticulo = 1;
	let precioArticulo = 0;
	let PorcentajeBonificacion = 0;
	let precioConDescuento = 0;
	
	// Totales
	let importeBruto = 0;
	let importeNeto = 0;
	let importeTotal = 0;
	
	// Control de límite de artículos
	let cantidadMaximaItems = 0;
	let cargandoConfiguracion = true;
	
	// Variables para edición
	let modoEdicion = false;
	let preventaEditar: string | null = $page.url.searchParams.get('editar');
	let preventaOriginal: Preventa | null = null;
	
	// Modificar el modelo de preventa
	let preventa = {
		// Siempre será PRV (preventa)
		DocumentoTipo: 'PRV',
		DocumentoSucursal: '', // Se obtendrá de la API
		DocumentoNumero: '',
		// Quitar fecha como solicitado
		ClienteCodigo: '',
		Cliente: null,
		// Otros campos existentes
		
		// Vendedor fijo como solicitado
		VendedorCodigo: '1',
		
		// Quitar forma de pago como solicitado
	};
	
	// Función para obtener la sucursal al cargar la página
	onMount(async () => {
		try {
			// Verificar si estamos en modo edición
			if (preventaEditar) {
				modoEdicion = true;
				await cargarPreventa();
			}
			
			// Obtener configuración de cantidad máxima de ítems
			cargandoConfiguracion = true;
			const configCantItems = await ConfiguracionService.obtenerConfiguracion('CANT_ITEMS');
			if (configCantItems && configCantItems.ValorConfig) {
				cantidadMaximaItems = parseInt(configCantItems.ValorConfig, 10);
				
			}
			cargandoConfiguracion = false;
			
			// Obtener sucursal (solo si no estamos editando)
			if (!modoEdicion) {
				const responseSucursal = await fetchWithAuth(`/datos-empresa`);
				if (!responseSucursal.ok) {
					throw new Error('Error al cargar datos de la empresa');
				}
				const { data } = await responseSucursal.json();
				preventa.DocumentoSucursal = data.Sucursal;
			}
			
			// Cargar datos iniciales
			await cargarDatos();
			
		} catch (error) {
			console.error('Error al inicializar:', error);
			cargandoConfiguracion = false;
		}
	});
	
	// Cargar datos iniciales
	async function cargarDatos() {
		try {
			await Promise.all([
				cargarClientes(),
				cargarArticulos()
			]);
		} catch (err) {
			console.error('Error al cargar datos iniciales:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
		}
	}
	
	// Buscar clientes (exactamente como en nueva factura)
	const buscarClientes = async (busqueda = '') => {
		if (timeoutId) clearTimeout(timeoutId);
		
		if (!busqueda || busqueda.length < 2) {
			clientesOptions = [];
			return;
		}
		
		clientesLoading = true;
		
		timeoutId = setTimeout(async () => {
			try {
				const response = await fetchWithAuth(`/clientes`, {
					params: {
						search: busqueda,
						limit: 10
					}
				});
				
				if (!response.ok) {
					throw new Error('Error al buscar clientes');
				}
				
				const data = await response.json();
				console.log("data", data);
				clientesOptions = data.items;
			} catch (error) {
				console.error('Error buscando clientes:', error);
				clientesOptions = [];
			} finally {
				clientesLoading = false;
			}
		}, 300);
	};
	
	// Buscar artículos (siguiendo el mismo patrón)
	const buscarArticulos = async (busqueda = '') => {
		if (articuloTimeoutId) clearTimeout(articuloTimeoutId);
		
		if (!busqueda || busqueda.length < 2) {
			articulosOptions = [];
			return;
		}
		
		articulosLoading = true;
		
		articuloTimeoutId = setTimeout(async () => {
			try {
				const response = await fetchWithAuth(`/articulos`, {
					params: {
						search: busqueda,
						limit: 10
					}
				});
				
				if (!response.ok) {
					throw new Error('Error al buscar artículos');
				}
				
				const data = await response.json();
				console.log("articulos data", data);
				articulosOptions = data.items;
			} catch (error) {
				console.error('Error buscando artículos:', error);
				articulosOptions = [];
			} finally {
				articulosLoading = false;
			}
		}, 300);
	};
	
	// Cargar clientes 
	async function cargarClientes() {
		loadingClientes = true;
		try {
			const response = await fetch(`/api/clientes?search=${filtroCliente}`);
			if (!response.ok) throw new Error('Error al cargar clientes');
			const data = await response.json();
			clientes = data.data;
		} catch (err) {
			console.error('Error:', err);
		} finally {
			loadingClientes = false;
		}
	}
	
	// Cargar artículos
	async function cargarArticulos() {
		loadingArticulos = true;
		try {
			const response = await fetch(`/api/articulos?search=${filtroArticulo}`);
			if (!response.ok) throw new Error('Error al cargar artículos');
			const data = await response.json();
			articulos = data.data;
		} catch (err) {
			console.error('Error:', err);
		} finally {
			loadingArticulos = false;
		}
	}
	
	// Seleccionar un cliente
	function seleccionarCliente(cliente: Cliente) {
		clienteSeleccionado = cliente;
		codigoCliente = cliente.Codigo;
		clienteSearch = cliente.Descripcion;
		clientesOptions = [];
		
		// Actualizar precios de los artículos según la lista del cliente
		const listaPrecio = cliente.ListaPrecio || 'LISTA1';
		
		// Actualizar los artículos ya agregados
		if (items.length > 0) {
            console.log("items",listaPrecio,items);
			items = items.map(item => {
				const articulo = item.Articulo;
				if (!articulo) return item;
				
				let nuevoPrecio = articulo.PrecioVenta || 0; // Precio por defecto
				
				// Determinar el precio según la lista
				switch (listaPrecio) {
					case '1':
                        console.log("1",articulo.PrecioCosto,articulo.Lista1);
						nuevoPrecio = articulo.PrecioCosto * (1 + (articulo.Lista1 || 0)/100) || articulo.PrecioVenta || 0;
						break;
					case '2':
                        console.log("2",articulo.PrecioCosto,articulo.Lista2);
						nuevoPrecio = articulo.PrecioCosto * (1 + (articulo.Lista2 || 0)/100) || articulo.PrecioVenta || 0;
						break;
					case '3':
						nuevoPrecio = articulo.PrecioCosto * (1 + (articulo.Lista3 || 0)/100) || articulo.PrecioVenta || 0;
						break;
					case '4':
						nuevoPrecio = articulo.PrecioCosto * (1 + (articulo.Lista4 || 0)/100) || articulo.PrecioVenta || 0;
						break;
					case '5':
						nuevoPrecio = articulo.PrecioCosto * (1 + (articulo.Lista5 || 0)/100) || articulo.PrecioVenta || 0;
						break;
					// Agregar más listas según sea necesario
				}
				
				return {
					...item,
					PrecioUnitario: nuevoPrecio,
					PrecioLista: nuevoPrecio
				};
			});
			
			// Recalcular totales después de actualizar los precios
			calcularTotales();
		}
	}
	
	// Seleccionar un artículo
	function seleccionarArticulo(articulo: Articulo) {
		articuloSeleccionado = articulo;
		
		// Determinar el precio según la lista del cliente
		if (clienteSeleccionado && clienteSeleccionado.ListaPrecio) {
			switch (clienteSeleccionado.ListaPrecio) {
				case 'LISTA1':
					precioArticulo = articulo.PrecioCosto * (1 + (articulo.Lista1 || 0)/100) || articulo.PrecioVenta || 0;
					break;
				case 'LISTA2':
					precioArticulo = articulo.PrecioCosto * (1 + (articulo.Lista2 || 0)/100) || articulo.PrecioVenta || 0;
					break;
				case 'LISTA3':
					precioArticulo = articulo.PrecioCosto * (1 + (articulo.Lista3 || 0)/100) || articulo.PrecioVenta || 0;
					break;
				case 'LISTA4':
					precioArticulo = articulo.PrecioCosto * (1 + (articulo.Lista4 || 0)/100) || articulo.PrecioVenta || 0;
					break;
				case 'LISTA5':
					precioArticulo = articulo.PrecioCosto * (1 + (articulo.Lista5 || 0)/100) || articulo.PrecioVenta || 0;
					break;
				// Agregar más listas según sea  necesario
				default:
					precioArticulo = articulo.PrecioCosto * (1 + (articulo.Lista1 || 0)/100) || articulo.PrecioVenta || 0;
			}
		} else {
			// Si no hay cliente seleccionado o no tiene lista, usar LISTA1 por defecto
			precioArticulo = articulo.PrecioCosto * (1 + (articulo.Lista1 || 0)/100) || articulo.PrecioVenta || 0;
		}
		
		PorcentajeBonificacion = 0;
		precioConDescuento = precioArticulo;
		articuloSearch = articulo.Descripcion;
		articulosOptions = [];
	}
	
	// Calcular precio con descuento
	function calcularPrecioConDescuento() {
		if (PorcentajeBonificacion < 0) PorcentajeBonificacion = 0;
		if (PorcentajeBonificacion > 100) PorcentajeBonificacion = 100;
		
		precioConDescuento = precioArticulo * (1 - PorcentajeBonificacion / 100);
	}
	
	// Agregar artículo a la preventa
	function agregarArticulo() {
		if (!articuloSeleccionado) return;
		
		// Verificar límite de artículos si está configurado
		if (cantidadMaximaItems > 0 && items.length >= cantidadMaximaItems) {
			alert(`No puede agregar más de ${cantidadMaximaItems} artículos a la preventa según la configuración del sistema.`);
			return;
		}
		
		// Calcular precio con descuento
		calcularPrecioConDescuento();
		
		// Verificar si ya existe
		const itemExistente = items.find(item => item.CodigoArticulo === articuloSeleccionado?.Codigo);
		
		if (itemExistente) {
			// Actualizar cantidad si ya existe
			items = items.map(item => 
				item.CodigoArticulo === articuloSeleccionado?.Codigo
					? { ...item, Cantidad: (item.Cantidad || 0) + cantidadArticulo }
					: item
			);
		} else {
			// Agregar nuevo item
			items = [
				...items, 
				{
					DocumentoTipo: preventa.DocumentoTipo,
					DocumentoSucursal: preventa.DocumentoSucursal,
					DocumentoNumero: '',
					CodigoArticulo: articuloSeleccionado.Codigo,
					Cantidad: cantidadArticulo,
					PrecioUnitario: precioConDescuento,
					PrecioLista: precioArticulo,
					PorcentajeBonificacion: PorcentajeBonificacion,
					Articulo: articuloSeleccionado
				}
			];
		}
		
		// Limpiar selección
		articuloSeleccionado = null;
		cantidadArticulo = 1;
		precioArticulo = 0;
		precioConDescuento = 0;
		PorcentajeBonificacion = 0;
		articuloSearch = '';
		
		// Recalcular totales
		calcularTotales();
	}
	
	// Remover un artículo
	function removerArticulo(index: number) {
		items = items.filter((_, i) => i !== index);
		calcularTotales();
	}
	
	// Editar cantidad de un artículo
	function editarCantidad(index: number, nuevaCantidad: number) {
		if (nuevaCantidad <= 0) return;
		
		items = items.map((item, i) => 
			i === index ? { ...item, Cantidad: nuevaCantidad } : item
		);
		
		calcularTotales();
	}
	
	// Calcular totales
	function calcularTotales() {
		importeBruto = items.reduce((total, item) => 
			total + ((item.PrecioUnitario || 0) * (item.Cantidad || 0)), 0);
		
		// Por ahora, sin descuentos ni impuestos
		importeNeto = importeBruto;
		importeTotal = importeNeto;
	}
	
	// Cancelar y volver al listado
	function cancelar() {
		goto('/ventas/preventas');
	}
	
	// Función para cargar la preventa a editar
	async function cargarPreventa() {
		if (!preventaEditar) return;
		
		loading = true;
		error = null;
		
		try {
			const [tipo, sucursal, numero] = preventaEditar.split('/');
			
			// Cargar la preventa con el servicio
			preventaOriginal = await PreventaService.obtenerPreventa(tipo, sucursal, numero) as unknown as Preventa	;
			
			if (preventaOriginal) {
				console.log("preventaOriginal", preventaOriginal);
				const cabecera = preventaOriginal.preventa;
				
				// Actualizar el modelo de preventa con los datos cargados
				preventa.DocumentoTipo = cabecera.DocumentoTipo;
				preventa.DocumentoSucursal = cabecera.DocumentoSucursal;
				preventa.DocumentoNumero = cabecera.DocumentoNumero;
				preventa.ClienteCodigo = cabecera.ClienteCodigo;
				preventa.VendedorCodigo = cabecera.VendedorCodigo || '1';
				
				// Cargar datos del cliente
				if (cabecera.Cliente) {
					clienteSeleccionado = cabecera.Cliente;
					codigoCliente = cabecera.ClienteCodigo;
					clienteSearch = cabecera.Cliente.Descripcion;
				} else if (cabecera.ClienteCodigo) {
					// Si la preventa no tiene el cliente cargado, intentar cargarlo
					const clienteResponse = await fetchWithAuth(`/clientes/${cabecera.ClienteCodigo}`);
					if (clienteResponse.ok) {
						const clienteData = await clienteResponse.json();
						clienteSeleccionado = clienteData;
						codigoCliente = cabecera.ClienteCodigo;
						clienteSearch = clienteData.Descripcion;
					}
				}
				
				// Cargar observación
				observacion = cabecera.Observacion || '';
				
				// Cargar ítems
				items = preventaOriginal.items.map((item: any) => ({
					...item,
					// Asegurarse de que todos los campos necesarios estén presentes
					DocumentoTipo: cabecera.DocumentoTipo,
					DocumentoSucursal: cabecera.DocumentoSucursal,
					DocumentoNumero: cabecera.DocumentoNumero
				}));
				
				// Calcular totales
				calcularTotales();
			}
		} catch (err) {
			console.error('Error al cargar preventa para editar:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			loading = false;
		}
	}
	
	// Modificar la función de guardar para manejar tanto creación como actualización
	async function guardarPreventa() {
		if (!clienteSeleccionado) {
			alert('Debe seleccionar un cliente');
			return;
		}
		
		if (items.length === 0) {
			alert('Debe agregar al menos un artículo');
			return;
		}
		
		// Verificar límite de artículos antes de guardar
		if (cantidadMaximaItems > 0 && items.length > cantidadMaximaItems) {
			alert(`No puede guardar una preventa con más de ${cantidadMaximaItems} artículos según la configuración del sistema.`);
			return;
		}
		
		loading = true;
		guardando = true;
		error = null;
		
		try {
			const preventaData = {
				DocumentoTipo: preventa.DocumentoTipo,
				DocumentoSucursal: preventa.DocumentoSucursal,
				DocumentoNumero: preventa.DocumentoNumero,
				ClienteCodigo: codigoCliente,
				VendedorCodigo: preventa.VendedorCodigo,
				ImporteBruto: importeBruto,
				ImporteNeto: importeNeto,
				ImporteTotal: importeTotal,
				Observacion: observacion,
				ListaPrecio: clienteSeleccionado.ListaPrecio,
			};
			
			let resultado;
			
			// Si estamos en modo edición, actualizar la preventa existente
			if (modoEdicion) {
				resultado = await PreventaService.actualizarPreventa(
					preventaData as unknown as PreventaCabeza, 
					items
				);
				alert('Preventa actualizada correctamente');
			} else {
				// Si es una nueva preventa, crearla
				resultado = await PreventaService.crearPreventa(
					preventaData as unknown as PreventaCabeza, 
					items
				);
				alert('Preventa creada correctamente');
			}
			
			goto('/ventas/preventas'); // Volver al listado
			
		} catch (err) {
			console.error('Error al guardar preventa:', err);
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			guardando = false;
			loading = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold text-gray-800">
			{modoEdicion ? 'Editar Preventa' : 'Nueva Preventa'}
		</h1>
		<div class="flex space-x-2">
			<Button variant="secondary" on:click={cancelar}>Cancelar</Button>
			<Button variant="primary" on:click={guardarPreventa} disabled={loading}>
				{loading ? 'Guardando...' : modoEdicion ? 'Actualizar Preventa' : 'Guardar Preventa'}
			</Button>
		</div>
	</div>
	
	<!-- Mensajes de error/éxito -->
	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			<p>{error}</p>
		</div>
	{/if}
	
	<!-- Información sobre límite de ítems cuando está cargando la configuración -->
	{#if cargandoConfiguracion}
		<div class="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded mb-4">
			<p>Cargando configuraciones del sistema...</p>
		</div>
	{:else if cantidadMaximaItems > 0}
		<div class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded mb-4 text-sm">
			<p>Límite de artículos por preventa: {cantidadMaximaItems} (Artículos actuales: {items.length})</p>
		</div>
	{/if}
	
	<!-- Datos de la preventa (simplificados) -->
	<div class="bg-white p-6 rounded-lg shadow-md mb-6">
		<div class="flex justify-between items-center mb-4">
			<h2 class="text-xl font-semibold">Datos de la Preventa</h2>
		</div>
		
		<!-- Primera fila - Cliente (único campo necesario) -->
		<div class="grid grid-cols-1 gap-4 mb-4">
			<!-- Cliente (como en nueva factura) -->
			<div class="relative">
				<label for="cliente-search" class="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
				<div class="relative">
					<input
						id="cliente-search"
						type="text"
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pr-10"
						placeholder="Buscar cliente..."
						bind:value={clienteSearch}
						on:input={() => buscarClientes(clienteSearch)}
						autocomplete="off"
					/>
					{#if clientesLoading}
						<div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
							<svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						</div>
					{/if}
				</div>
				
				<!-- Resultados de búsqueda de clientes -->
				{#if clientesOptions.length > 0}
					<div class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
						{#each clientesOptions as cliente}
							<button
								type="button"
								class="block w-full text-left px-4 py-2 hover:bg-gray-100"
								on:click={() => seleccionarCliente(cliente)}
							>
								<div class="font-medium">{cliente.Descripcion}</div>
								<div class="text-sm text-gray-500">
									<span>Código: {cliente.Codigo}</span>
									{#if cliente.ImporteDeuda !== undefined}
										<span class="ml-2">Deuda: ${cliente.ImporteDeuda.toFixed(2)}</span>
									{/if}
									{#if cliente.ListaPrecio}
										<span class="ml-2">Lista: {cliente.ListaPrecio}</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
				
				<!-- Cliente seleccionado -->
				{#if clienteSeleccionado}
					<div class="mt-2 p-2 bg-blue-50 rounded-md flex justify-between items-center">
						<div>
							<p class="font-medium">{clienteSeleccionado.Descripcion}</p>
							<p class="text-sm text-gray-600">
								<span>Código: {clienteSeleccionado.Codigo}</span>
								{#if clienteSeleccionado.ImporteDeuda !== undefined}
									<span class="ml-2">Deuda: ${clienteSeleccionado.ImporteDeuda.toFixed(2)}</span>
								{/if}
								{#if clienteSeleccionado.ListaPrecio}
									<span class="ml-2">Lista: {clienteSeleccionado.ListaPrecio}</span>
								{/if}
							</p>
						</div>
						<button 
							type="button" 
							class="text-sm text-blue-600 hover:text-blue-800"
							on:click={() => { clienteSeleccionado = null; codigoCliente = ''; clienteSearch = ''; }}
						>
							Cambiar
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
	
	<!-- Artículos -->
	<div class="bg-white p-6 rounded-lg shadow-md mb-6">
		<div class="flex justify-between items-center mb-4">
			<h2 class="text-xl font-semibold">Artículos</h2>
			<Button variant="secondary" on:click={() => articuloSearch = ''}>Buscar Artículo</Button>
		</div>
		
		<!-- Búsqueda de artículos -->
		<div class="mb-4">
			<label for="articulo-search" class="block text-sm font-medium text-gray-700 mb-1">Buscar Artículo</label>
			<div class="relative">
				<input
					id="articulo-search"
					type="text"
					class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pr-10"
					placeholder="Buscar artículo..."
					bind:value={articuloSearch}
					on:input={() => buscarArticulos(articuloSearch)}
					autocomplete="off"
				/>
				{#if articulosLoading}
					<div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
						<svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					</div>
				{/if}
			</div>
			
			<!-- Resultados de búsqueda de artículos -->
			{#if articulosOptions.length > 0}
				<div class="mt-1 bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
					{#each articulosOptions as articulo}
						<button
							type="button"
							class="block w-full text-left px-4 py-2 hover:bg-gray-100"
							on:click={() => seleccionarArticulo(articulo)}
						>
							<div class="font-medium">{articulo.Descripcion}</div>
							<div class="text-sm text-gray-500">
								<span>Código: {articulo.Codigo}</span>
								<span class="ml-2">Precio: ${(articulo.PrecioCosto * (1 + (articulo.Lista1 || 0)/100) * (1 + (articulo.PorcentajeIva1 || 0)/100))?.toFixed(2) || '0.00'}</span>
								<span class="ml-2">Stock: {articulo.Existencia || 0}</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
		
		<!-- Artículo seleccionado -->
		{#if articuloSeleccionado}
			<div class="bg-gray-50 p-4 rounded-md mb-4">
				<h3 class="font-medium mb-2">{articuloSeleccionado.Descripcion}</h3>
				<p class="text-sm text-gray-600 mb-3">Código: {articuloSeleccionado.Codigo}</p>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<!-- Cantidad -->
					<div>
						<label for="cantidad-input" class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
						<div class="flex">
							<button 
								type="button"
								class="bg-gray-200 px-3 rounded-l-md"
								on:click={() => cantidadArticulo > 1 && cantidadArticulo--}
								aria-label="Disminuir cantidad"
							>
								-
							</button>
							<input 
								id="cantidad-input"
								type="number"
								bind:value={cantidadArticulo}
								min="1"
								class="block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-center"
							/>
							<button 
								type="button"
								class="bg-gray-200 px-3 rounded-r-md"
								on:click={() => cantidadArticulo++}
								aria-label="Aumentar cantidad"
							>
								+
							</button>
						</div>
					</div>
					<!-- Porcentaje de descuento -->
					<div>
						<label for="porcentaje-descuento-input" class="block text-sm font-medium text-gray-700 mb-1">Porcentaje de descuento</label>
						<input 
							id="porcentaje-descuento-input"
							type="number"
							bind:value={PorcentajeBonificacion}
							on:input={calcularPrecioConDescuento}
							min="0"
							max="100"
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
						/>
					</div>
					<!-- Precio original (no editable) -->
					<div>
						<label for="precio-input" class="block text-sm font-medium text-gray-700 mb-1">
							Precio ({clienteSeleccionado?.ListaPrecio || 'LISTA1'})
						</label>
						<input 
							id="precio-input"
							type="number"
							value={precioArticulo}
							readonly
							class="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
						/>
					</div>
					<!-- Precio con descuento -->
					<div>
						<label for="precio-descuento-input" class="block text-sm font-medium text-gray-700 mb-1">
							Precio con descuento
						</label>
						<input 
							id="precio-descuento-input"
							type="number"
							value={precioConDescuento}
							readonly
							class="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
						/>
					</div>
				</div>
				
				<div class="flex justify-end">
					<Button variant="primary" on:click={agregarArticulo}>Agregar a la Preventa</Button>
				</div>
			</div>
		{/if}
		
		<!-- Lista de artículos agregados -->
		{#if items.length > 0}
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Lista</th>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc. %</th>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Final</th>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
							<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each items as item, index}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.CodigoArticulo}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Articulo?.Descripcion}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									<div class="flex items-center">
										<button 
											type="button"
											class="text-gray-500 hover:text-gray-700"
											on:click={() => editarCantidad(index, (item.Cantidad || 0) - 1)}
											aria-label="Disminuir cantidad"
										>
											-
										</button>
										<span class="mx-2">{item.Cantidad}</span>
										<button 
											type="button"
											class="text-gray-500 hover:text-gray-700"
											on:click={() => editarCantidad(index, (item.Cantidad || 0) + 1)}
											aria-label="Aumentar cantidad"
										>
											+
										</button>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.PrecioLista?.toFixed(2)}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.PorcentajeBonificacion || 0}%</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.PrecioUnitario?.toFixed(2)}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									${((item.PrecioUnitario || 0) * (item.Cantidad || 0)).toFixed(2)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<button 
										type="button"
										class="text-red-500 hover:text-red-700"
										on:click={() => removerArticulo(index)}
										aria-label="Eliminar artículo"
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
										</svg>
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="bg-gray-50">
							<td colspan="4" class="px-6 py-3 text-right text-sm font-medium text-gray-900">Total:</td>
							<td class="px-6 py-3 text-left text-sm font-medium text-gray-900">${importeTotal.toFixed(2)}</td>
							<td></td>
						</tr>
					</tfoot>
				</table>
				
				<!-- Mensaje de advertencia si se acerca al límite -->
				{#if cantidadMaximaItems > 0 && items.length >= cantidadMaximaItems * 0.8}
					<div class="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded text-sm">
						<p>Atención: Se está acercando al límite máximo de {cantidadMaximaItems} artículos por preventa.</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center py-8 text-gray-500">
				No hay artículos agregados a la preventa
			</div>
		{/if}
	</div>
</div>

<style>
	/* Estilo para inputs en iOS */
	/* input[type="date"],
	input[type="number"],
	select {
		-webkit-appearance: none;
		appearance: none;
	}
	
	/* Estilos adaptados para móviles */
	/* @media (max-width: 640px) {
		input, select, button {
			font-size: 16px; /* Previene el zoom en iOS 
		}
	} */
</style>
