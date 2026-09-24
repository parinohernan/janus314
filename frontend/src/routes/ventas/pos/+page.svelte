<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { LogOut, Wallet } from 'lucide-svelte';
	import { auth } from '$lib/stores/authStore';
	import { esCajero } from '$lib/utils/permisos';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import { toast } from '$lib/utils/toast';
	import { EmpresaService } from '$lib/services/EmpresaService';
	import CaeModal from '$lib/components/facturas/CaeModal.svelte';
	import { decodificarCodigoBalanza, type PosRubro } from '$lib/constants/posVarios';
	import {
		agregarOIncrementar,
		cambiarCantidad,
		completarImportes,
		labelTicketFiscal,
		lineaDesdeBalanza,
		lineaDesdeRubro,
		mergeLineasParaPersistir,
		quitarLinea,
		tipoTicketFiscal,
		totalTicket,
		type PosLinea
	} from '$lib/utils/posTicket';
	import { calcularTotalesComprobante } from '$lib/utils/comprobanteTotales';
	import { datosComercialesDesdeCliente } from '$lib/utils/facturaClienteDefaults';
	import { armarPosTicketDto, extraerCae, type PosTicketDto } from '$lib/utils/posTicketHtml';
	import {
		catalogoVacio,
		incorporarPosCatalogo,
		indexarPosCatalogo,
		resolverPosCatalogo,
		type PosCatalogo
	} from '$lib/utils/posCatalogo';
	import { loadPosPrinterConfig, type PosPrinterConfig } from '$lib/utils/posPrinterConfig';
	import {
		connectQz,
		disconnectQz,
		mensajeErrorImpresion,
		printTicket
	} from '$lib/services/QzTrayService';
	import type { Articulo } from '$lib/types/articulo';
	import type { Cliente } from '$lib/types/cliente';
	import type { DatosEmpresa } from '$lib/services/EmpresaService';
	import PosSearch from '$lib/components/pos/PosSearch.svelte';
	import PosCart from '$lib/components/pos/PosCart.svelte';
	import PosActions from '$lib/components/pos/PosActions.svelte';
	import PosVariosModal from '$lib/components/pos/PosVariosModal.svelte';
	import PosClienteChip from '$lib/components/pos/PosClienteChip.svelte';
	import PosPrinterChip from '$lib/components/pos/PosPrinterChip.svelte';
	import PosPrinterModal from '$lib/components/pos/PosPrinterModal.svelte';
	import PosArticuloBuscarModal from '$lib/components/pos/PosArticuloBuscarModal.svelte';
	import PosCobroModal from '$lib/components/pos/PosCobroModal.svelte';
	import PosCajaModal from '$lib/components/pos/PosCajaModal.svelte';
	import PosHistorialModal from '$lib/components/pos/PosHistorialModal.svelte';
	import PosCajaMovimientoModal from '$lib/components/pos/PosCajaMovimientoModal.svelte';
	import { precargarTiposPagoPos, type TipoPagoPos } from '$lib/utils/posTiposPago';

	const CLIENTE_CF: Cliente = {
		Codigo: 'CF',
		Descripcion: 'Consumidor Final',
		NombreFantasia: '',
		CategoriaIva: 'F',
		ImporteDeuda: 0,
		Calle: '',
		Numero: '',
		Piso: '',
		Departamento: '',
		ProvinciaCodigo: '',
		CodigoPostal: '',
		Localidad: '',
		ContactoNombre: '',
		Mail: '',
		TelefonoMovil: '',
		ContactoComercial: '',
		CodigoVendedor: '',
		Actualizado: 0,
		SaldoNTCNoAplicado: 0,
		LimiteCredito: 0,
		CanalCodigo: '',
		FechaDeAlta: null,
		FechaDeBaja: null,
		TransporteCodigo: '',
		DirEntregaCalle: '',
		DirEntregaNumero: '',
		DirEntregaPiso: '',
		DirEntregaDpto: '',
		DirEntregaProvinciaCodigo: '',
		DirEntregaLocalidadCodigo: '',
		CondicionVentaCodigo: '',
		PorcentajeBonificacionGeneral: 0,
		GrupoPercepcionIIBBCodigo: '',
		PorcentajePercepcionIIBB: 0,
		GrupoCodigo: '',
		cant_facturas_impagas_max: 0,
		ZonaCodigo: '',
		InvCuentaVentas: null,
		CliCuentaCredito: null,
		TipoDocumento: '',
		CodigoLocalidad: ''
	};

	let search: PosSearch;
	let lineas: PosLinea[] = [];
	let seleccionId: string | null = null;
	let cliente: Cliente = CLIENTE_CF;
	let listaPrecio = '1';
	let sucursal = '0001';
	let cajaAbierta: {
		Codigo: number;
		SaldoTeorico?: string | number;
		SaldoInicial?: string | number;
	} | null = null;
	let loadingInit = true;
	let cobrando = false;
	let flashOk = false;
	let rubroActivo: PosRubro | null = null;
	let showVarios = false;
	let showCae = false;
	let showPrinter = false;
	let showBuscar = false;
	let showCobro = false;
	let showCaja = false;
	let showHistorial = false;
	let movimientoCaja: 'ingreso' | 'egreso' | null = null;
	let pagoConfirmado: { codigo: string; descripcion: string; total: number } | null = null;
	let tiposPago: TipoPagoPos[] = [];
	let printerConfig: PosPrinterConfig = loadPosPrinterConfig();
	let datosEmpresa: DatosEmpresa | null = null;
	let ultimoTicket: PosTicketDto | null = null;
	let facturaCreada: { DocumentoTipo: string; DocumentoSucursal: string; DocumentoNumero: string } | null =
		null;
	let catalogo: PosCatalogo = catalogoVacio();
	let catalogoListo = false;
	let catalogoTimer: ReturnType<typeof setInterval> | null = null;
	let catalogoSeq = 0;
	const REFRESCO_CATALOGO_MS = 5 * 60 * 1000;

	$: total = totalTicket(lineas);
	$: ticketLabel = labelTicketFiscal(cliente?.CategoriaIva);
	$: vendedorCodigo = String($auth.user?.usuario || '1');
	$: sinCaja = !loadingInit && !cajaAbierta;
	$: if (
		pagoConfirmado &&
		Number(pagoConfirmado.total.toFixed(2)) !== Number(total.toFixed(2))
	) {
		pagoConfirmado = null;
	}
	$: listoParaEmitir = !!pagoConfirmado && lineas.length > 0;
	$: nombreCajero = [$auth.user?.nombre, $auth.user?.apellido].filter(Boolean).join(' ');

	function fechaHoy(): string {
		const hoy = new Date();
		hoy.setHours(hoy.getHours() - 3);
		return hoy.toISOString().substring(0, 10);
	}

	async function cargarClienteCf() {
		try {
			const ensure = await fetchWithAuth('/clientes/pos/ensure-cf', { method: 'POST' });
			if (ensure.ok) {
				const payload = await ensure.json();
				const data = payload.data || payload;
				if (data?.Codigo) {
					cliente = { ...CLIENTE_CF, ...data, CategoriaIva: data.CategoriaIva || 'F' };
					const comercial = datosComercialesDesdeCliente(cliente);
					listaPrecio = comercial.listaPrecio;
					return;
				}
			}
			const response = await fetchWithAuth('/clientes/CF');
			if (!response.ok) return;
			const data = await response.json();
			cliente = { ...CLIENTE_CF, ...data, CategoriaIva: data.CategoriaIva || 'F' };
			const comercial = datosComercialesDesdeCliente(cliente);
			listaPrecio = comercial.listaPrecio;
		} catch {
			cliente = CLIENTE_CF;
		}
	}

	async function verificarCaja() {
		const response = await fetchWithAuth(`/cajas/vendedor/${vendedorCodigo}`);
		const data = await response.json();
		if (data.success && data.data?.length) {
			cajaAbierta = data.data[0];
			return true;
		}
		cajaAbierta = null;
		return false;
	}

	async function cargarCatalogo() {
		const seq = ++catalogoSeq;
		try {
			const response = await fetchWithAuth('/articulos/pos/catalogo');
			if (!response.ok || seq !== catalogoSeq) return;
			const payload = await response.json();
			if (seq !== catalogoSeq) return;
			catalogo = indexarPosCatalogo((payload.data || []) as Articulo[]);
			catalogoListo = true;
		} catch (error) {
			console.error(error);
		}
	}

	function onVisible() {
		if (document.visibilityState === 'visible') {
			cargarCatalogo();
		}
	}

	onMount(async () => {
		window.addEventListener('keydown', onGlobalKey, true);
		document.addEventListener('visibilitychange', onVisible);
		catalogoTimer = setInterval(cargarCatalogo, REFRESCO_CATALOGO_MS);
		try {
			const empresa = await EmpresaService.obtenerDatos();
			datosEmpresa = empresa;
			if (empresa?.Sucursal) sucursal = String(empresa.Sucursal).padStart(4, '0');
			await Promise.all([
				cargarClienteCf(),
				verificarCaja(),
				precargarTiposPagoPos()
					.then((tipos) => {
						tiposPago = tipos;
					})
					.catch(() => null),
				fetchWithAuth('/articulos/pos/ensure-varios', { method: 'POST' }).catch(() => null)
			]);
			await cargarCatalogo();
			connectQz().catch(() => null);
		} catch (error) {
			console.error(error);
			toast.error('No se pudo inicializar la caja');
		} finally {
			loadingInit = false;
			search?.focusInput();
		}
	});

	onDestroy(() => {
		window.removeEventListener('keydown', onGlobalKey, true);
		document.removeEventListener('visibilitychange', onVisible);
		if (catalogoTimer) clearInterval(catalogoTimer);
		disconnectQz().catch(() => null);
	});

	function esTeclaMas(event: KeyboardEvent) {
		return event.key === '+' || event.code === 'NumpadAdd';
	}

	function esTeclaMenos(event: KeyboardEvent) {
		return event.key === '-' || event.code === 'NumpadSubtract';
	}

	function salirEdicion() {
		seleccionId = null;
		search?.focusInput();
	}

	function entrarEdicion(lineId: string) {
		seleccionId = lineId;
		search?.blurInput();
	}

	function onGlobalKey(event: KeyboardEvent) {
		if (showVarios || showCae || showPrinter || showBuscar || showCobro || showCaja || showHistorial || movimientoCaja || cobrando) {
			if (event.key === 'Escape' && showVarios) {
				showVarios = false;
			}
			if (event.key === 'Escape' && showPrinter) {
				showPrinter = false;
			}
			if (event.key === 'Escape' && showBuscar) {
				showBuscar = false;
			}
			if (event.key === 'Escape' && showCobro) {
				showCobro = false;
			}
			if (event.key === 'Escape' && showCaja) {
				showCaja = false;
			}
			if (event.key === 'Escape' && showHistorial) {
				showHistorial = false;
			}
			if (event.key === 'Escape' && movimientoCaja) {
				movimientoCaja = null;
			}
			return;
		}

		if (event.key === 'F2') {
			event.preventDefault();
			if (!sinCaja) showBuscar = true;
			return;
		}

		if (event.key === 'F9') {
			event.preventDefault();
			if (listoParaEmitir) cobrar('PRF');
			return;
		}
		if (event.key === 'F10') {
			event.preventDefault();
			if (listoParaEmitir) cobrar(tipoTicketFiscal(cliente.CategoriaIva));
			return;
		}
		if (event.key === 'F8') {
			event.preventDefault();
			if (!pagoConfirmado) nuevaVenta();
			return;
		}
		if (event.key === 'Delete' && seleccionId && !pagoConfirmado) {
			event.preventDefault();
			quitar(seleccionId);
			return;
		}

		if (seleccionId && !pagoConfirmado) {
			if (esTeclaMas(event)) {
				event.preventDefault();
				ajustarCantidad(seleccionId, 1);
				return;
			}
			if (esTeclaMenos(event)) {
				event.preventDefault();
				ajustarCantidad(seleccionId, -1);
				return;
			}
		}
		if (seleccionId) {
			if (event.key === 'Enter' && !search?.tieneTexto()) {
				event.preventDefault();
				salirEdicion();
				return;
			}
			if (event.key === 'Escape') {
				event.preventDefault();
				salirEdicion();
				return;
			}
		}

		const target = event.target as HTMLElement | null;
		const enCampo = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
		if (!enCampo && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
			search?.focusInput();
		}
	}

	function agregarArticulo(articulo: Articulo) {
		lineas = agregarOIncrementar(lineas, articulo, listaPrecio);
		flashOk = true;
		setTimeout(() => (flashOk = false), 250);
		search?.focusInput();
	}

	async function agregarDesdeBalanza(code: string): Promise<boolean> {
		const leido = decodificarCodigoBalanza(code);
		if (!leido) return false;
		if (!leido.ok) {
			toast.error(leido.mensaje);
			search?.focusInput();
			return true;
		}
		const clave = leido.datos.codigoBarras;
		let articulo = resolverPosCatalogo(catalogo, clave);
		if (!articulo) {
			try {
				const response = await fetchWithAuth('/articulos/lookup', { params: { code: clave } });
				if (response.ok) {
					const payload = await response.json();
					articulo = (payload.data || payload) as Articulo;
					catalogo = incorporarPosCatalogo(catalogo, articulo);
					catalogoListo = true;
				}
			} catch {
				articulo = null;
			}
		}
		if (!articulo) {
			toast.error(`Falta el artículo ${clave}`);
			search?.focusInput();
			return true;
		}
		const linea = lineaDesdeBalanza(articulo, leido.datos.kg, listaPrecio);
		if (!linea) {
			toast.error(`El artículo ${clave} no tiene precio por kilo`);
			search?.focusInput();
			return true;
		}
		lineas = [...lineas, linea];
		flashOk = true;
		setTimeout(() => (flashOk = false), 250);
		search?.focusInput();
		return true;
	}

	async function lookup(codigo: string) {
		const code = codigo.trim();
		if (!code) return;
		if (await agregarDesdeBalanza(code)) return;

		const local = resolverPosCatalogo(catalogo, code);
		if (local) {
			agregarArticulo(local);
			return;
		}

		try {
			const response = await fetchWithAuth('/articulos/lookup', {
				params: { code }
			});
			if (!response.ok) {
				toast.error('Producto no encontrado');
				search?.focusInput();
				return;
			}
			const payload = await response.json();
			const articulo = (payload.data || payload) as Articulo;
			catalogo = incorporarPosCatalogo(catalogo, articulo);
			catalogoListo = true;
			agregarArticulo(articulo);
		} catch {
			toast.error('No se pudo buscar el producto');
		} finally {
			search?.focusInput();
		}
	}

	function ajustarCantidad(lineId: string, delta: number) {
		const linea = lineas.find((l) => l.lineId === lineId);
		if (!linea) return;
		const siguiente = linea.Cantidad + delta;
		if (siguiente <= 0) {
			quitar(linea.lineId);
			return;
		}
		lineas = cambiarCantidad(lineas, linea.lineId, siguiente);
	}

	function onQty(event: CustomEvent<{ lineId: string; delta: number }>) {
		ajustarCantidad(event.detail.lineId, event.detail.delta);
	}

	function quitar(lineId: string) {
		lineas = quitarLinea(lineas, lineId);
		if (seleccionId === lineId) seleccionId = lineas[lineas.length - 1]?.lineId ?? null;
		search?.focusInput();
	}

	function onSelectCliente(event: CustomEvent<Cliente>) {
		cliente = event.detail;
		const comercial = datosComercialesDesdeCliente(cliente);
		listaPrecio = comercial.listaPrecio;
		search?.focusInput();
	}

	function abrirRubro(event: CustomEvent<PosRubro>) {
		rubroActivo = event.detail;
		showVarios = true;
	}

	function confirmarVarios(event: CustomEvent<{ descripcion: string; precioConIva: number }>) {
		if (!rubroActivo) return;
		const linea = lineaDesdeRubro(rubroActivo, event.detail.descripcion, event.detail.precioConIva);
		lineas = [...lineas, completarImportes(linea)];
		showVarios = false;
		rubroActivo = null;
		search?.focusInput();
	}

	async function salir() {
		if (esCajero($auth.user)) {
			await auth.logout();
			goto('/login');
			return;
		}
		goto('/ventas/facturas');
	}

	function nuevaVenta() {
		lineas = [];
		seleccionId = null;
		facturaCreada = null;
		pagoConfirmado = null;
		showCae = false;
		void cargarClienteCf();
		search?.focusInput();
	}

	function confirmarCobro(event: CustomEvent<{ codigo: string; descripcion: string }>) {
		pagoConfirmado = { ...event.detail, total };
		showCobro = false;
	}

	async function registrarCaja(tipo: string, numero: string, importe: number, metodoPago: string) {
		if (!cajaAbierta) return;
		const response = await fetchWithAuth('/cajas/movimiento', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				cajaCabezaId: cajaAbierta.Codigo,
				tipo: 'ingreso',
				importe,
				concepto: `POS ${tipo} ${sucursal}-${numero}`,
				metodoPago,
				documentoAsociado: numero,
				tipoDocumento: tipo,
				usuarioId: String(vendedorCodigo).replace(/^0+/, '') || vendedorCodigo
			})
		});
		if (!response.ok) {
			throw new Error('La venta se guardó pero no se registró el movimiento de caja');
		}
	}

	async function imprimirTicket(dto: PosTicketDto) {
		try {
			await printTicket(dto, printerConfig);
		} catch (error) {
			toast.error(mensajeErrorImpresion(error));
		}
	}

	async function cobrar(tipo: 'PRF' | 'FCA' | 'FCB') {
		if (cobrando || lineas.length === 0) return;
		if (!cajaAbierta) {
			toast.error('Abrí la caja antes de cobrar');
			return;
		}
		if (!pagoConfirmado) {
			toast.error('Cobrá el total antes de emitir');
			return;
		}
		const pago = pagoConfirmado;

		cobrando = true;
		try {
			const items = mergeLineasParaPersistir(lineas);
			const totales = calcularTotalesComprobante({
				items: items.map((item) => ({
					Cantidad: item.Cantidad,
					PrecioUnitario: item.PrecioUnitario,
					PrecioLista: item.PrecioLista,
					PorcentajeIva: item.PorcentajeIva,
					PrecioUnitarioConIva: item.PrecioUnitarioConIva,
					Total: item.Total
				})),
				tipo
			});

			const factura = {
				DocumentoTipo: tipo,
				DocumentoSucursal: sucursal,
				DocumentoNumero: '',
				Fecha: fechaHoy(),
				ClienteCodigo: cliente.Codigo || 'CF',
				Cliente: cliente,
				ListaPrecio: listaPrecio,
				ImporteBruto: totales.ImporteBruto,
				PorcentajeBonificacion: 0,
				ImporteBonificado: totales.ImporteBonificado,
				ImporteNeto: totales.ImporteNeto,
				ImporteIva1: totales.ImporteIva1,
				ImporteIva2: totales.ImporteIva2,
				BaseImponible1: totales.BaseImponible1,
				BaseImponible2: totales.BaseImponible2,
				PorcentajeIngresosBrutos: 0,
				ImporteIngresosBrutos: 0,
				ImporteIva: totales.ImporteIva,
				ImporteTotal: totales.ImporteTotal,
				Observacion: 'POS supermercado',
				FormaPagoCodigo: pago.codigo,
				FormaPago: pago.descripcion,
				Vendedor: vendedorCodigo,
				Items: items.map((item) => ({
					ArticuloCodigo: item.ArticuloCodigo,
					Descripcion: item.Descripcion,
					DescripcionLibre: item.DescripcionLibre || item.Descripcion,
					Cantidad: item.Cantidad,
					PrecioLista: item.PrecioLista,
					PorcentajeBonificado: 0,
					ImporteBonificado: 0,
					PrecioUnitario: item.PrecioUnitario,
					PorcentajeIva: item.PorcentajeIva,
					PrecioUnitarioConIva: item.PrecioUnitarioConIva,
					Total: item.Total
				}))
			};

			const response = await fetchWithAuth('/facturas', {
				method: 'POST',
				body: JSON.stringify(factura)
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || errorData.error || 'Error al crear la venta');
			}

			const responseData = await response.json();
			const creada = responseData.data?.factura || responseData.factura || responseData.data || responseData;
			facturaCreada = {
				DocumentoTipo: creada.DocumentoTipo || tipo,
				DocumentoSucursal: creada.DocumentoSucursal || sucursal,
				DocumentoNumero: creada.DocumentoNumero
			};

			if (!facturaCreada.DocumentoNumero) {
				throw new Error('La venta se creó sin número de comprobante');
			}

			await registrarCaja(
				facturaCreada.DocumentoTipo,
				facturaCreada.DocumentoNumero,
				totales.ImporteTotal,
				pago.codigo
			);
			void verificarCaja();
			void cargarCatalogo();

			ultimoTicket = armarPosTicketDto({
				tipo,
				sucursal: facturaCreada.DocumentoSucursal,
				numero: facturaCreada.DocumentoNumero,
				fecha: fechaHoy(),
				empresa: datosEmpresa,
				cliente,
				items,
				totales
			});

			if (tipo === 'PRF') {
				await imprimirTicket(ultimoTicket);
				toast.success('PRF emitida');
				nuevaVenta();
			} else {
				showCae = true;
			}
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : 'No se pudo cobrar');
		} finally {
			cobrando = false;
			search?.focusInput();
		}
	}

	async function onCaeObtenido(event: CustomEvent) {
		if (!facturaCreada) return;
		const cae = extraerCae(event.detail);
		if (ultimoTicket) {
			ultimoTicket = { ...ultimoTicket, cae };
		}
		if (ultimoTicket) {
			await imprimirTicket(ultimoTicket);
		}
		toast.success(`${labelTicketFiscal(cliente.CategoriaIva)} emitida`);
		showCae = false;
		nuevaVenta();
	}

	function onCaeClose() {
		showCae = false;
		nuevaVenta();
	}

	function onCaeImprimir() {
		if (ultimoTicket) {
			imprimirTicket(ultimoTicket);
			return;
		}
		toast.error('Elegí la impresora de esta caja');
	}
</script>

<svelte:head>
	<title>Punto de venta</title>
</svelte:head>

<div class="flex h-screen min-h-0 flex-col bg-slate-100">
	<header class="flex items-center gap-3 bg-blue-700 px-4 py-3 text-white shadow">
		<div class="hidden shrink-0 sm:block">
			<p class="text-xs uppercase tracking-widest text-blue-100">Janus314</p>
			<p class="text-sm font-semibold">Punto de venta</p>
		</div>
		<PosSearch
			bind:this={search}
			disabled={sinCaja || cobrando || !!pagoConfirmado}
			{flashOk}
			on:submit={(e) => lookup(e.detail)}
			on:buscar={() => (showBuscar = true)}
		/>
		<PosClienteChip {cliente} disabled={sinCaja || cobrando} on:select={onSelectCliente} />
		<PosPrinterChip
			printerName={printerConfig.printerName}
			disabled={cobrando}
			on:open={() => (showPrinter = true)}
		/>
		<button
			type="button"
			class="flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold {cajaAbierta
				? 'bg-emerald-500 text-white hover:bg-emerald-400'
				: 'bg-white/15 hover:bg-white/25'}"
			on:click={() => (showCaja = true)}
		>
			<Wallet class="h-4 w-4" />
			<span class="max-w-[10rem] truncate">
				{nombreCajero || 'Caja'} · {cajaAbierta ? 'Abierta' : 'Cerrada'}
			</span>
		</button>
		<button
			type="button"
			class="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
			on:click={salir}
		>
			<LogOut class="h-4 w-4" />
			<span class="hidden sm:inline">Salir</span>
		</button>
	</header>

	{#if loadingInit}
		<div class="flex flex-1 items-center justify-center text-slate-500">Abriendo caja...</div>
	{:else if sinCaja}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
			<p class="text-xl font-semibold text-slate-800">No hay una caja abierta</p>
			<p class="max-w-md text-slate-500">Abrí la caja del vendedor para cobrar en el punto de venta.</p>
			<button
				type="button"
				class="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
				on:click={() => (showCaja = true)}
			>
				Abrir caja
			</button>
		</div>
	{:else}
		<div class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_22rem]">
			<PosCart
				{lineas}
				{seleccionId}
				disabled={cobrando || !!pagoConfirmado}
				on:select={(e) => entrarEdicion(e.detail)}
				on:deselect={salirEdicion}
				on:qty={onQty}
				on:remove={(e) => quitar(e.detail)}
			/>
			<div class="border-t border-slate-200 bg-slate-50 lg:border-l lg:border-t-0">
				<PosActions
					{total}
					{ticketLabel}
					disabled={sinCaja}
					{cobrando}
					hayItems={lineas.length > 0}
					{listoParaEmitir}
					ventaCobrada={!!pagoConfirmado}
					pagoLabel={pagoConfirmado?.descripcion || ''}
					on:cobrar={() => (showCobro = true)}
					on:prf={() => cobrar('PRF')}
					on:ticket={() => cobrar(tipoTicketFiscal(cliente.CategoriaIva))}
					on:nueva={nuevaVenta}
					on:rubro={abrirRubro}
					on:historial={() => (showHistorial = true)}
					on:ingreso={() => (movimientoCaja = 'ingreso')}
					on:egreso={() => (movimientoCaja = 'egreso')}
				/>
			</div>
		</div>
	{/if}
</div>

{#if rubroActivo}
	<PosVariosModal
		rubro={rubroActivo}
		show={showVarios}
		on:close={() => (showVarios = false)}
		on:confirm={confirmarVarios}
	/>
{/if}

{#if showPrinter}
	<PosPrinterModal
		show={showPrinter}
		on:close={() => (showPrinter = false)}
		on:saved={(e) => (printerConfig = e.detail)}
	/>
{/if}

{#if showBuscar}
	<PosArticuloBuscarModal
		show={showBuscar}
		{listaPrecio}
		articulos={catalogo.items}
		{catalogoListo}
		on:close={() => {
			showBuscar = false;
			search?.focusInput();
		}}
		on:select={(e) => agregarArticulo(e.detail)}
	/>
{/if}

{#if showCobro}
	<PosCobroModal
		show={showCobro}
		{total}
		tipos={tiposPago}
		on:close={() => (showCobro = false)}
		on:confirm={confirmarCobro}
	/>
{/if}

{#if movimientoCaja}
	<PosCajaMovimientoModal
		show={!!movimientoCaja}
		tipo={movimientoCaja}
		cajaId={cajaAbierta?.Codigo ?? null}
		vendedorId={vendedorCodigo}
		on:close={() => (movimientoCaja = null)}
		on:cambio={verificarCaja}
	/>
{/if}

{#if showHistorial}
	<PosHistorialModal
		show={showHistorial}
		cajaId={cajaAbierta?.Codigo ?? null}
		{sucursal}
		empresa={datosEmpresa}
		on:close={() => (showHistorial = false)}
	/>
{/if}

{#if showCaja}
	<PosCajaModal
		show={showCaja}
		cajaId={cajaAbierta?.Codigo ?? null}
		vendedorId={vendedorCodigo}
		on:close={() => (showCaja = false)}
		on:cambio={verificarCaja}
	/>
{/if}

{#if facturaCreada}
	<CaeModal
		show={showCae}
		factura={facturaCreada}
		on:close={onCaeClose}
		on:caeObtenido={onCaeObtenido}
		on:imprimir={onCaeImprimir}
	/>
{/if}
