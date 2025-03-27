<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import type { Cliente, Articulo, ItemFactura, Factura } from '$lib/types/index';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import EntitySelector from '$lib/components/ui/EntitySelector.svelte';
  import CaeModal from '$lib/components/facturas/CaeModal.svelte';
  import { PreventaService } from '$lib/services/PreventaService';
  import type { Preventa } from '$lib/types';
  // import { formatDateOnly } from '$lib/utils/dateUtils';
  
  // Modelo de factura
  let factura = {
    DocumentoTipo: 'FCB',
    DocumentoSucursal: '0001',
    DocumentoNumero: '',
    Fecha: new Date().toISOString().substring(0, 10),
    ClienteCodigo: '',
    Cliente: null as Cliente | null,
    ListaPrecio: '1',
    ImporteBruto: 0,
    PorcentajeDescuento: 0,
    ImporteDescuento: 0,
    ImporteNeto: 0,
    ImporteIva1: 0,
    ImporteIva2: 0,
    BaseImponible1: 0,
    BaseImponible2: 0,
    PorcentajeIngresosBrutos: 0,
    ImporteIngresosBrutos: 0,
    ImporteIva: 0,
    ImporteTotal: 0,
    Observacion: '',
    FormaPagoCodigo: '',
    FormaPago: null as { value: string, label: string } | null,
    Items: [] as ItemFactura[],
    VendedorCodigo: '',
    Vendedor: null as { value: string, label: string } | null,
  };
  
  // Estados para selectores
  let tiposDocumento: {value: string, label: string}[] = [];
  
  let clientesBusqueda = '';
  let clientesOptions: Cliente[] = [];
  let clientesLoading = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  let articuloBusqueda = '';
  let articulosOptions: Articulo[] = [];
  let articulosLoading = false;
  let articuloTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Artículo seleccionado actualmente
  let articuloSeleccionado: Articulo | null = null;
  let cantidadArticulo = 1;
  
  // Estados
  let loading = false;
  let error: string | null = null;
  let guardadoExitoso = false;
  
  // Variable para mostrar sucursal y número
  let sucursalNumeroDisplay = '';
  
  // Actualizar la variable cuando cambian los valores
  $: sucursalNumeroDisplay = factura.DocumentoSucursal + " - " + (factura.DocumentoNumero ? factura.DocumentoNumero.toString().padStart(8, '0') : '00000000');
  
  // Agregar esto junto a las otras variables de estado
  let formasPago: { value: string, label: string }[] = [];
  
  // Agregar variable para controlar la visibilidad del encabezado completo
  let mostrarEncabezadoCompleto = true;
  
  // Añadir variables para vendedores

  let vendedoresOptions: { value: string, label: string }[] = [];
  let vendedoresLoading = false;
  let vendedorTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Agregar esta variable para controlar la visibilidad del selector de clientes
  let mostrarSelectorClientes = false;
  
  // Variables para el modal de CAE
  let showCaeModal = false;
  let facturaCreada:any = null;
  
  // Datos de la preventa (si se está facturando una)
  let preventaParam = $page.url.searchParams.get('preventa');
  let preventaCargada: Preventa | null = null;
  
  // Cargar formas de pago desde la API
  onMount(async () => {
    // Cargar una preventa si viene en los parámetros de URL
    if (preventaParam) {
      await cargarPreventa();
    }
    
    try {

    // obtener sucursal
    const responseSucursal = await fetch(`${PUBLIC_API_URL}/datos-empresa`);
    if (!responseSucursal.ok) {
      throw new Error('Error al cargar datos de la empresa');
    }
    const { data } = await responseSucursal.json();
    factura.DocumentoSucursal = data.Sucursal;
    // Obtener formas de pago
      const response = await fetch(`${PUBLIC_API_URL}/tipos-de-pago`);
      if (response.ok) {
        const data = await response.json();
        console.log("data",data);
        formasPago = data.items.map((item: { Codigo: string, Descripcion: string }) => ({
          value: item.Codigo,
          label: item.Descripcion
        }));
      }
    } catch (error) {
      console.error('Error cargando formas de pago:', error);
    }
    
    // Obtener datos de la empresa para la sucursal
    const responseEmpresa = await fetch(`${PUBLIC_API_URL}/datos-empresa`);
      
    if (!responseEmpresa.ok) {
      throw new Error('Error al cargar datos de la empresa');
    }
      
    const { data } = await responseEmpresa.json();
      
    if (!data || !data.Sucursal) {
      throw new Error('No se encontró configuración de sucursal');
    }
    // Establecer la sucursal automáticamente
    factura.DocumentoSucursal = data.Sucursal;

    // Cargar vendedores
    try {
      const responseVendedores = await fetch(`${PUBLIC_API_URL}/vendedores`);
      
      if (responseVendedores.ok) {
        const {data} = await responseVendedores.json();
        console.log("Datos de vendedores recibidos:", data);
        
        // Verificar la estructura de los datos
        if (data  && Array.isArray(data)) {
          // Filtrar solo vendedores activos antes de mapear
          vendedoresOptions = data
            .filter((item: { Codigo: string, Descripcion: string, Activo: number }) => item.Activo == 1)
            .map((item: { Codigo: string, Descripcion: string }) => ({
              value: item.Codigo || '',
              label: item.Descripcion || 'Sin nombre'
            }));
          console.log("vendedoresOptions procesados:", vendedoresOptions);
        } else {
          console.error("Estructura de datos de vendedores inesperada:", data);
        }
      }
    } catch (error) {
      console.error('Error cargando vendedores:', error);
      vendedoresOptions = [];
    }
  });
  
  // Actualizar tipos de documento según categoría IVA del cliente
  const actualizarTiposDocumento = (categoriaIva: string) => {
    // Por defecto, solo PRF está disponible
    tiposDocumento = [
      { value: 'PRF', label: 'Prefactura' }
    ];
    
    // Según la categoría IVA, añadir opciones
    if (categoriaIva === 'I' || categoriaIva === 'M') {
      tiposDocumento.push({ value: 'FCA', label: 'Factura A' });
      factura.DocumentoTipo = 'FCA'; // Seleccionar FCA por defecto
    } else if (categoriaIva === 'F' || categoriaIva === 'E') {
      tiposDocumento.push({ value: 'FCB', label: 'Factura B' });
      factura.DocumentoTipo = 'FCB'; // Seleccionar FCB por defecto
    } else {
      factura.DocumentoTipo = 'PRF'; // Seleccionar PRF por defecto
    }
  };
  
  // Obtener próximo número de comprobante
  const obtenerProximoNumero = async () => {

    try {
      const response = await fetch(`${PUBLIC_API_URL}/numeros-Control/${factura.DocumentoTipo}/${factura.DocumentoSucursal}`);
      if (response.ok) {
        const data = await response.json();
        factura.DocumentoNumero = data.data.proximoNumero;
        return data.data.proximoNumero;
      }
    } catch (error) {
      console.error('Error obteniendo próximo número:', error);
    }
    return null;
  };
  
  // Funciones de búsqueda
  const buscarClientes = async (busqueda = '') => {
    if (timeoutId) clearTimeout(timeoutId);
    
    if (!busqueda || busqueda.length < 2) {
      clientesOptions = [];
      return;
    }
    
    clientesLoading = true;
    
    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`${PUBLIC_API_URL}/clientes?search=${encodeURIComponent(busqueda)}&limit=10`);
        
        if (!response.ok) {
          throw new Error('Error al buscar clientes');
        }
        
        const data = await response.json();
        console.log("data",data);
        clientesOptions = data.items;
      } catch (error) {
        console.error('Error buscando clientes:', error);
        clientesOptions = [];
      } finally {
        clientesLoading = false;
      }
    }, 300);
  };
  
  const buscarArticulos = async (busqueda = '') => {
    if (articuloTimeoutId) clearTimeout(articuloTimeoutId);
    
    if (!busqueda || busqueda.length < 2) {
      articulosOptions = [];
      return;
    }
    
    articulosLoading = true;
    
    articuloTimeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`${PUBLIC_API_URL}/articulos?search=${encodeURIComponent(busqueda)}&limit=10`);
        
        if (!response.ok) {
          throw new Error('Error al buscar artículos');
        }
        
        const data = await response.json();
        articulosOptions = data.items;
      } catch (error) {
        console.error('Error buscando artículos:', error);
        articulosOptions = [];
      } finally {
        articulosLoading = false;
      }
    }, 300);
  };
  
  // Seleccionar cliente
  const seleccionarCliente = (cliente: Cliente) => {
    factura.ClienteCodigo = cliente.Codigo;
    factura.Cliente = cliente;
    
    // Cerrar el selector de cliente
    mostrarSelectorClientes = false;
    clientesBusqueda = `${cliente.Codigo} - ${cliente.Descripcion}`;
    clientesOptions = [];
    
    // Asignar el vendedor del cliente si existe

    if (cliente.CodigoVendedor) {
      console.log("cliente.CodigoVendedor", cliente.CodigoVendedor);
      factura.VendedorCodigo = cliente.CodigoVendedor;
      
      // Buscar datos del vendedor si es necesario
      buscarDatosVendedor(cliente.CodigoVendedor);
    }


    
    // Actualizar tipos de documento según categoría IVA
    actualizarTiposDocumento(cliente.CategoriaIva);
    
    // Obtener próximo número de comprobante
    obtenerProximoNumero();

  };
  
  // Seleccionar artículo
  const seleccionarArticulo = (articulo: Articulo) => {
    articuloSeleccionado = articulo;
    articuloBusqueda = `${articulo.Codigo} - ${articulo.Descripcion}`;
    articulosOptions = [];
  };
  
  // Agregar artículo a la factura (actualizado)
  const agregarArticulo = () => {
    console.log("agregarArticulo", articuloSeleccionado);
    if (!articuloSeleccionado) return;
    
    // Obtener precio según la lista seleccionada
    const precioLista = obtenerPrecioSegunLista(articuloSeleccionado, factura.ListaPrecio);
    // Usar el PorcentajeIva del artículo o 21 como valor predeterminado
    const porcentajeIva = articuloSeleccionado.PorcentajeIva1 || 21;
    
    const nuevoItem: ItemFactura = {
      ArticuloCodigo: articuloSeleccionado.Codigo,
      Descripcion: articuloSeleccionado.Descripcion,
      Cantidad: cantidadArticulo,
      PrecioLista: precioLista,
      PorcentajeDescuento: 0,
      PrecioUnitario: precioLista, // Inicialmente igual al precio de lista (sin descuento)
      PorcentajeIva: porcentajeIva,
      PrecioUnitarioConIva: 0, // Se calculará en recalcularItem
      Total: 0, // Se calculará en recalcularItem
      enEdicion: false
    };
    
    // Calcular valores derivados
    recalcularItem(nuevoItem);
    
    factura.Items = [...factura.Items, nuevoItem];
    recalcularTotales();
    
    // Resetear selección
    articuloSeleccionado = null;
    articuloBusqueda = '';
    cantidadArticulo = 1;
  };
  
  // Obtener precio según la lista seleccionada
  const obtenerPrecioSegunLista = (articulo: Articulo, listaId: string): number => {
    // Aquí deberías implementar la lógica para obtener el precio según la lista
    // Por ahora, usamos una lógica simple basada en el PrecioCosto
    
    const precioCosto = articulo.PrecioCosto || 0;
    console.log("articulo", articulo);
    
    // Valores predeterminados en caso de que las propiedades no existan
    const lista1 = articulo.Lista1 || 30;
    const lista2 = articulo.Lista2 || 40;
    const lista3 = articulo.Lista3 || 50;
    const lista4 = articulo.Lista4 || 60;
    const lista5 = articulo.Lista5 || 70;
    
    switch(listaId) {
      case '1': return precioCosto * (1 + lista1/100);
      case '2': return precioCosto * (1 + lista2/100);
      case '3': return precioCosto * (1 + lista3/100);
      case '4': return precioCosto * (1 + lista4/100);
      case '5': return precioCosto * (1 + lista5/100);
      default: return precioCosto * (1 + lista1/100);
    }
  };
  
  // Función para recalcular un ítem individual (actualizada)
  const recalcularItem = (item: ItemFactura) => {
    // 1. Calcular precio unitario con descuento aplicado (sin IVA)
    item.PrecioUnitario = item.PrecioLista * (1 - (item.PorcentajeDescuento / 100));
    
    // 2. Calcular precio unitario con IVA
    item.PrecioUnitarioConIva = item.PrecioUnitario * (1 + (item.PorcentajeIva / 100));
    
    // 3. Calcular total del ítem (precio unitario con IVA * cantidad)
    item.Total = item.PrecioUnitarioConIva * item.Cantidad;
    
    // Redondear valores para evitar problemas de precisión
    item.PrecioUnitario = parseFloat(item.PrecioUnitario.toFixed(2));
    item.PrecioUnitarioConIva = parseFloat(item.PrecioUnitarioConIva.toFixed(2));
    item.Total = parseFloat(item.Total.toFixed(2));
  };
  
  // Activar/desactivar modo edición para un ítem
  const toggleEdicion = (index: number) => {
    factura.Items = factura.Items.map((item, i) => {
      if (i === index) {
        return { ...item, enEdicion: !item.enEdicion };
      }
      return { ...item, enEdicion: false }; // Desactivar edición en otros ítems
    });
  };
  
  // Actualizar un ítem después de edición
  const actualizarItem = (index: number) => {
    // Crear una copia del array para mantener reactividad
    const items = [...factura.Items];
    
    // Recalcular el ítem editado
    recalcularItem(items[index]);
    
    // Desactivar modo edición
    items[index].enEdicion = false;
    
    // Actualizar el array de ítems
    factura.Items = items;
    
    // Recalcular totales de la factura
    recalcularTotales();
  };
  
  // Eliminar artículo de la factura
  const eliminarItem = (index: number) => {
    factura.Items = factura.Items.filter((_, i) => i !== index);
    recalcularTotales();
  };
  
  // Recalcular totales (actualizado)
  const recalcularTotales = () => {
    // Inicializar valores
    let importeBruto = 0;
    let importeIva1 = 0; // IVA 21%
    let importeIva2 = 0; // IVA 10.5%
    
    factura.Items.forEach(item => {
      // Calcular importe bruto (suma de precios unitarios * cantidad)
      importeBruto += item.PrecioUnitario * item.Cantidad;
    });
    
    // Actualizar importe bruto
    factura.ImporteBruto = parseFloat(importeBruto.toFixed(2));
    
    // Calcular descuento general
    factura.ImporteDescuento = parseFloat((factura.ImporteBruto * (factura.PorcentajeDescuento / 100)).toFixed(2));
    
    // Calcular importe neto (después del descuento)
    factura.ImporteNeto = parseFloat((factura.ImporteBruto - factura.ImporteDescuento).toFixed(2));
    
    // Calcular IVA sobre el importe neto (después del descuento general)
    // Necesitamos calcular la proporción de cada alícuota de IVA en el total
    let baseIva21 = 0;
    let baseIva10_5 = 0;
    
    factura.Items.forEach(item => {
      const importeItem = item.PrecioUnitario * item.Cantidad;
      // Aplicar el mismo porcentaje de descuento general a cada ítem
      const importeItemConDescuento = importeItem * (1 - (factura.PorcentajeDescuento / 100));
      
      if (item.PorcentajeIva === 21) {
        baseIva21 += importeItemConDescuento;
      } else if (item.PorcentajeIva === 10.5) {
        baseIva10_5 += importeItemConDescuento;
      }
    });
    
    // Calcular IVA sobre las bases imponibles con descuento aplicado
    importeIva1 = baseIva21 * 0.21;
    importeIva2 = baseIva10_5 * 0.105;
    
    // Actualizar valores de IVA y bases imponibles
    factura.ImporteIva1 = parseFloat(importeIva1.toFixed(2));
    factura.ImporteIva2 = parseFloat(importeIva2.toFixed(2));
    factura.ImporteIva = parseFloat((importeIva1 + importeIva2).toFixed(2));
    factura.BaseImponible1 = parseFloat(baseIva21.toFixed(2));
    factura.BaseImponible2 = parseFloat(baseIva10_5.toFixed(2));
    
    // Calcular Ingresos Brutos
    factura.ImporteIngresosBrutos = parseFloat((factura.ImporteNeto * (factura.PorcentajeIngresosBrutos / 100)).toFixed(2));
    
    // Calcular importe total
    factura.ImporteTotal = parseFloat((
      factura.ImporteNeto + 
      factura.ImporteIva1 + 
      factura.ImporteIva2 + 
      factura.ImporteIngresosBrutos
    ).toFixed(2));
  };
  
  // Actualizar descuento general
  const actualizarDescuentoGeneral = () => {
    recalcularTotales();
  };
  
  // Cambiar lista de precios (actualizado)
  const cambiarListaPrecio = () => {
    // Actualizar precios de todos los ítems según la nueva lista
    if (factura.Items.length > 0) {
      // Crear una copia del array para mantener reactividad
      const items = [...factura.Items];
      
      // Para cada ítem, buscar el artículo y actualizar su precio
      items.forEach(async (item) => {
        try {
          // Obtener datos actualizados del artículo
          const response = await fetch(`${PUBLIC_API_URL}/articulos/${item.ArticuloCodigo}`);
          if (response.ok) {
            const articulo = await response.json();
            
            // Actualizar precio de lista según la nueva lista
            item.PrecioLista = obtenerPrecioSegunLista(articulo, factura.ListaPrecio);
            
            // Recalcular valores derivados
            recalcularItem(item);
          }
        } catch (error) {
          console.error('Error actualizando precio del artículo:', error);
        }
      });
      
      // Actualizar el array de ítems
      factura.Items = items;
      
      // Recalcular totales de la factura
      recalcularTotales();
    }
  };
  
  // Funciones de validación modularizadas
  const validarCliente = () => {
    if (!factura.ClienteCodigo) {
      return "Debe seleccionar un cliente";
    }
    return null;
  };

  const validarItems = () => {
    if (factura.Items.length === 0) {
      return "Debe agregar al menos un artículo a la factura";
    }
    return null;
  };

  const validarFormaPago = () => {
    if (!factura.FormaPagoCodigo) {
      return "Debe seleccionar una forma de pago";
    }
    return null;
  };

  // Función principal de validación
  const validarFactura = () => {
    const validaciones = [
      validarCliente(),
      validarItems(),
      validarFormaPago()
    ];
    
    // Filtrar solo los mensajes de error (no nulos)
    const errores = validaciones.filter(v => v !== null);
    
    if (errores.length > 0) {
      error = errores[0]; // Mostrar el primer error encontrado
      return false;
    }
    
    error = null;
    return true;
  };
  
  // Función para crear factura
  const crearFactura = async () => {
    if (!validarFactura()) return;
    
    loading = true;
    error = null;
    guardadoExitoso = false;
    
    try {
      // Realizar las operaciones para guardar la factura...
      const response = await fetch(`${PUBLIC_API_URL}/facturas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(factura)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la factura');
      }
      
      const { data } = await response.json();
      
      // Guardar la factura creada para usarla en el modal de CAE
      facturaCreada = data;
      guardadoExitoso = true;
      
      // Solo mostrar el modal de CAE para facturas electrónicas (no PRF)
      if (factura.DocumentoTipo !== 'PRF') {
        showCaeModal = true;
      } else {
        // Si es PRF, redirigir a la lista de facturas después de un breve retraso
        setTimeout(() => {
          goto('/ventas/facturas/');
        }, 1500);
      }
    } catch (err) {
      console.error('Error al crear factura:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  // Manejador para cuando se obtiene el CAE
  const handleCaeObtenido = (event: any) => {
    const caeData = event.detail;
    console.log('CAE obtenido:', caeData);
    
    // Aquí puedes guardar el CAE en la factura si es necesario
    // mediante otra llamada a la API
  };
  
  // Manejador para cerrar el modal de CAE
  const handleCloseCaeModal = () => {
    showCaeModal = false;
    // Redirigir a la lista de facturas
    goto('/ventas/facturas/');
  };
  
  // Manejador para imprimir la factura
  const handleImprimirFactura = () => {
    goto(`/ventas/facturas/imprimir/${factura.DocumentoTipo}/${factura.DocumentoSucursal}/${factura.DocumentoNumero.toString().padStart(8, '0')}`)
  };

  // Cancelar creación
  const cancelar = () => {
    if (confirm('¿Está seguro que desea cancelar? Perderá todos los datos ingresados.')) {
      goto('/ventas/facturas');
    }
  };

  // Opciones para listas de precios
  const listasPrecio = [
    { value: '1', label: 'Lista 1' },
    { value: '2', label: 'Lista 2' },
    { value: '3', label: 'Lista 3' },
    { value: '4', label: 'Lista 4' },
    { value: '5', label: 'Lista 5' }
  ];

  // Función para buscar datos del vendedor por código
  const buscarDatosVendedor = async (codigoVendedor: string) => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/vendedores/${codigoVendedor}`);
      if (response.ok) {
        const data = await response.json();
        factura.Vendedor = data;
      }
    } catch (error) {
      console.error('Error obteniendo datos del vendedor:', error);
    }
  };

  // Función para manejar la selección de vendedor
  const seleccionarVendedor = (vendedor: { value: string, label: string }) => {
    factura.VendedorCodigo = vendedor.value;
    factura.Vendedor = vendedor;
  };

  // Función para buscar vendedores
  const buscarVendedores = async (busqueda = '') => {
    if (vendedorTimeoutId) clearTimeout(vendedorTimeoutId);
    
    if (!busqueda || busqueda.length < 2) {
      vendedoresOptions = [];
      return;
    }
    
    vendedoresLoading = true;
    
    vendedorTimeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`${PUBLIC_API_URL}/vendedores?search=${encodeURIComponent(busqueda)}&limit=10`);
        
        if (!response.ok) {
          throw new Error('Error al buscar vendedores');
        }
        
        const data = await response.json();
        vendedoresOptions = data.items;
      } catch (error) {
        console.error('Error buscando vendedores:', error);
      } finally {
        vendedoresLoading = false;
      }
    }, 300);
  };

  // Función para cargar datos completos del cliente por código
  async function cargarClientePorCodigo(codigoCliente: string) {
    if (!codigoCliente) return null;
    
    try {
      const response = await fetch(`${PUBLIC_API_URL}/clientes/${codigoCliente}`);
      if (!response.ok) {
        throw new Error('Error al cargar datos del cliente');
      }
      const cliente = await response.json();
      return cliente;
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      return null;
    }
  }

  // Función para cargar la preventa desde la API
  async function cargarPreventa() {
    try {
      loading = true;
      error = null;
      
      const [tipo, sucursal, numero] = preventaParam!.split('/');
      
      // Cargar la preventa con el servicio
      preventaCargada = await PreventaService.obtenerPreventa(tipo, sucursal, numero);
      
      // Llenar el formulario con los datos de la preventa
      if (preventaCargada) {
        console.log("preventaCargada cliente", preventaCargada.preventa.ClienteCodigo);
        
        // Setear cliente
        if (preventaCargada.preventa.ClienteCodigo) {
          // Cargar datos completos del cliente
          const cliente = await cargarClientePorCodigo(preventaCargada.preventa.ClienteCodigo);
          
          if (cliente) {
            // Aplicar los mismos cambios que en seleccionarCliente
            factura.ClienteCodigo = cliente.Codigo;
            factura.Cliente = cliente;
            clientesBusqueda = `${cliente.Codigo} - ${cliente.Descripcion}`;
            
            // Actualizar tipos de documento según categoría IVA
            actualizarTiposDocumento(cliente.CategoriaIva);
            
            // Obtener próximo número de comprobante
            obtenerProximoNumero();
            
            // Si el cliente tiene un vendedor asignado, cargarlo
            if (cliente.CodigoVendedor) {
              factura.VendedorCodigo = cliente.CodigoVendedor;
              buscarDatosVendedor(cliente.CodigoVendedor);
            }
          }
        }
        
        // Setear observación
        factura.Observacion = preventaCargada.preventa.Observacion || '';
        
        // Cargar items de la preventa
        if (preventaCargada.items && preventaCargada.items.length > 0) {
          // Limpiar items actuales
          factura.Items = [];
          
          // Agregar items de la preventa
          for (const item of preventaCargada.items) {
            // Si el artículo existe, agregarlo a la factura
            if (item.Articulo) {
              // Crear nuevo item para la factura
              const facturaItem: ItemFactura = {
                ArticuloCodigo: item.CodigoArticulo,
                Descripcion: item.Articulo.Descripcion,
                Cantidad: item.Cantidad || 0,
                PrecioLista: item.PrecioUnitario || 0,
                PorcentajeDescuento: 0,
                PrecioUnitario: item.PrecioUnitario || 0,
                PorcentajeIva: item.Articulo.PorcentajeIva1 || 21,
                PrecioUnitarioConIva: 0,
                Total: 0,
                enEdicion: false
              };
              
              // Agregar a la lista de items
              factura.Items = [...factura.Items, facturaItem];
            }
          }
          
          // Recalcular totales
          recalcularTotales();
        }
      }
    } catch (err) {
      console.error('Error al cargar preventa:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  }

  // Función para guardar la factura
  async function guardarFactura() {
    // Resto del código existente...
    
    try {
      // ...código existente...
      
      // Si estamos facturando una preventa, actualizar también la preventa
      if (preventaCargada) {
        // Obtener el número de factura generado
        // Actualizar la preventa con los datos de la factura
        await PreventaService.facturarPreventa(
          preventaCargada.preventa.DocumentoTipo,
          preventaCargada.preventa.DocumentoSucursal,
          preventaCargada.preventa.DocumentoNumero,
          factura.DocumentoTipo,
          factura.DocumentoSucursal,
          factura.DocumentoNumero
        );
      }
      
      // ...resto del código existente...
    } catch (err) {
      // ...resto del código existente...
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Nueva Factura</h1>
    <div class="flex space-x-2">
      <Button variant="secondary" on:click={cancelar}>Cancelar</Button>
      <Button variant="primary" on:click={crearFactura} disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar Factura'}
      </Button>
    </div>
  </div>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {/if}
  
  {#if guardadoExitoso}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      <p>Factura guardada correctamente. Redirigiendo...</p>
    </div>
  {/if}
  
  <!-- Si viene de una preventa, mostrar información adicional -->
  {#if preventaCargada}
    <div class="bg-blue-50 p-4 rounded-md mb-4">
      <p class="text-sm text-blue-700">
        Facturando Preventa: {preventaCargada.preventa.DocumentoTipo}-{preventaCargada.preventa.DocumentoSucursal}-{preventaCargada.preventa.DocumentoNumero}
        del {preventaCargada.preventa.Fecha ? new Date(preventaCargada.preventa.Fecha).toLocaleDateString() : ''}
      </p>
    </div>
  {/if}
  
  <!-- Datos de la factura (reestructurado) -->
  <div class="bg-white p-6 rounded-lg shadow-md mb-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Datos de la Factura</h2>
    </div>
    
    <!-- Primera fila - siempre visible -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
      <!-- Cliente (siempre visible) - reducido de col-span-2 a col-span-3 -->
      <div class="relative lg:col-span-3">
        <label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
        <input
          type="text"
          id="cliente"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          placeholder="Buscar cliente..."
          bind:value={clientesBusqueda}
          on:input={() => {
            buscarClientes(clientesBusqueda);
            mostrarSelectorClientes = clientesBusqueda.length >= 2;
          }}
          on:focus={() => {
            if (clientesBusqueda.length >= 2) {
              mostrarSelectorClientes = true;
            }
          }}
          on:blur={() => {
            // Retrasar el cierre para permitir que se capture el clic en las opciones
            setTimeout(() => {
              mostrarSelectorClientes = false;
            }, 200);
          }}
          autocomplete="off"
        />
        
        {#if clientesLoading}
          <div class="absolute right-3 top-1/2 -translate-y-1/2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        {/if}
        
        {#if mostrarSelectorClientes && clientesOptions.length > 0}
          <div class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
            <ul>
              {#each clientesOptions as cliente}
                <li>
                  <button 
                    class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 w-full text-left"
                    on:click={() => seleccionarCliente(cliente)}
                    on:mousedown|preventDefault
                  >
                    <div class="flex items-center">
                      <span class="font-normal block truncate">{cliente.Codigo} - {cliente.Descripcion}</span>
                    </div>
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
      
      {#if mostrarEncabezadoCompleto}
        <!-- Tipo de Documento - aumentado a col-span-4 -->
        <div class="lg:col-span-4">
          <label for="tipoDocumento" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
          <div class="flex space-x-2">
            <select 
              id="tipoDocumento" 
              bind:value={factura.DocumentoTipo}
              on:change={obtenerProximoNumero}
              class="w-2/5 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {#each tiposDocumento as tipo}
                <option value={tipo.value}>{tipo.label}</option>
              {/each}
            </select>
            
            <input 
              id="sucursal" 
              type="text" 
              bind:value={sucursalNumeroDisplay}
              disabled
              class="w-3/5 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
              title="Próximo número de documento"
            />
          </div>
        </div>
        
        <!-- Forma de Pago - reducido a col-span-2 -->
        <div class="lg:col-span-2">
          <label for="formaPago" class="block text-sm font-medium text-gray-700 mb-1">Forma de Pago</label>
          <select 
            id="formaPago" 
            bind:value={factura.FormaPagoCodigo}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Forma de pago</option>
            {#each formasPago as forma}
              <option value={forma.value}>{forma.label}</option>
            {/each}
          </select>
        </div>
        
        <!-- Lista de Precios y Fecha - se mantiene en col-span-3 -->
        <div class="lg:col-span-3">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="listaPrecio" class="block text-sm font-medium text-gray-700 mb-1">Lista de Precios</label>
              <select 
                id="listaPrecio" 
                bind:value={factura.ListaPrecio}
                on:change={cambiarListaPrecio}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {#each listasPrecio as lista}
                  <option value={lista.value}>{lista.label}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input 
                id="fecha" 
                type="date" 
                bind:value={factura.Fecha}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Segunda fila - Observación (visible solo si mostrarEncabezadoCompleto es true)
    {#if mostrarEncabezadoCompleto}
      <div class="mb-4">
        <label for="observacion" class="block text-sm font-medium text-gray-700 mb-1">Observación</label>
        <textarea 
          id="observacion" 
          bind:value={factura.Observacion}
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
      
      <!-- Sucursal - Número (opcional, puedes moverlo donde prefieras)
      <div class="mb-4">
        <label for="sucursal" class="block text-sm font-medium text-gray-700 mb-1">Sucursal - Número</label>
        <input 
          id="sucursal" 
          type="text" 
          bind:value={sucursalNumeroDisplay}
          disabled
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div> 
    {/if} -->
  </div>
  
  <!-- Artículos de la factura -->
  <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
    <h2 class="text-lg font-semibold mb-4">Artículos</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
      <div class="md:col-span-2">
        <label for="articulo" class="block text-sm font-medium text-gray-700 mb-1">Artículo</label>
        <div class="relative">
          <input
            type="text"
            id="articulo"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="Buscar artículo..."
            bind:value={articuloBusqueda}
            on:input={() => buscarArticulos(articuloBusqueda)}
            autocomplete="off"
          />
          
          {#if articulosLoading}
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          {/if}
          
          {#if articulosOptions.length > 0}
            <div class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
              <ul>
                {#each articulosOptions as articulo}
                  <li>
                    <button 
                      class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 w-full text-left"
                      on:click={() => seleccionarArticulo(articulo)}
                    >
                      <div class="flex items-center">
                        <span class="font-normal block truncate">{articulo.Codigo} - {articulo.Descripcion}</span>
                      </div>
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </div>
      
      <div>
        <label for="cantidad" class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
        <input 
          id="cantidad" 
          type="number" 
          min="1" 
          step="1"
          bind:value={cantidadArticulo}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label for="btnAgregar" class="invisible block text-sm font-medium text-gray-700 mb-1">Agregar</label>
        <Button 
          id="btnAgregar"
          variant="secondary" 
          on:click={agregarArticulo} 
          disabled={!articuloSeleccionado}
          class="w-full"
        >
          Agregar
        </Button>
      </div>
    </div>
    
    <!-- Tabla de artículos (actualizada) -->
    {#if factura.Items.length > 0}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Lista</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Desc.</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% IVA</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio C/IVA</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each factura.Items as item, i}
              <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td class="px-4 py-3 whitespace-nowrap text-sm">{item.ArticuloCodigo}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">{item.Descripcion}</td>
                
                <!-- Cantidad -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {#if item.enEdicion}
                    <input 
                      type="number" 
                      bind:value={item.Cantidad} 
                      min="1" 
                      step="1"
                      class="w-16 px-2 py-1 text-right border border-gray-300 rounded"
                    />
                  {:else}
                    {item.Cantidad}
                  {/if}
                </td>
                
                <!-- Precio Lista -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${item.PrecioLista.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                
                <!-- % Descuento -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {#if item.enEdicion}
                    <input 
                      type="number" 
                      bind:value={item.PorcentajeDescuento} 
                      min="0" 
                      max="100" 
                      step="0.1"
                      class="w-16 px-2 py-1 text-right border border-gray-300 rounded"
                    />
                  {:else}
                    {item.PorcentajeDescuento}%
                  {/if}
                </td>
                
                <!-- Precio Unitario (con descuento, sin IVA) -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${item.PrecioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                
                <!-- % IVA (no editable) -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {item.PorcentajeIva}%
                </td>
                
                <!-- Precio con IVA -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${(Number(item.PrecioUnitario) * (1 + Number(item.PorcentajeIva) / 100)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                
                <!-- Total -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${(item.Cantidad * (Number(item.PrecioUnitario) * (1 + Number(item.PorcentajeIva) / 100))).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

                  <!-- ${item.Total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} -->
                </td>
                
                <td class="px-4 py-3 whitespace-nowrap text-center">
                  {#if item.enEdicion}
                    <button 
                      class="text-green-600 hover:text-green-900 mr-2"
                      on:click={() => actualizarItem(i)}
                      aria-label="Guardar cambios"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  {:else}
                    <button 
                      class="text-blue-600 hover:text-blue-900 mr-2"
                      on:click={() => toggleEdicion(i)}
                      aria-label="Editar ítem"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  {/if}
                  
                  <button 
                    class="text-red-600 hover:text-red-900"
                    on:click={() => eliminarItem(i)}
                    aria-label="Eliminar ítem"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Totales -->
      <div class="mt-6 flex justify-end">
        <div class="w-80 space-y-2">
          <div class="flex justify-between">
            <span class="font-medium">Importe Bruto:</span>
            <span>${factura.ImporteBruto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="font-medium">Descuento (%):</span>
            <div class="flex items-center">
              <input 
                type="number" 
                bind:value={factura.PorcentajeDescuento} 
                on:change={actualizarDescuentoGeneral}
                min="0" 
                max="100" 
                step="0.1"
                class="w-16 px-2 py-1 text-right border border-gray-300 rounded mr-2"
              />
              <span>${factura.ImporteDescuento.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div class="flex justify-between">
            <span class="font-medium">Importe Neto:</span>
            <span>${factura.ImporteNeto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="font-medium">IVA 21%:</span>
            <span>${factura.ImporteIva1.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="font-medium">IVA 10.5%:</span>
            <span>${factura.ImporteIva2.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="font-medium">Ingresos Brutos (%):</span>
            <div class="flex items-center">
              <input 
                type="number" 
                bind:value={factura.PorcentajeIngresosBrutos} 
                on:change={actualizarDescuentoGeneral}
                min="0" 
                max="100" 
                step="0.1"
                class="w-16 px-2 py-1 text-right border border-gray-300 rounded mr-2"
              />
              <span>${factura.ImporteIngresosBrutos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span>Total:</span>
            <span>${factura.ImporteTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    {:else}
      <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
        <p>No hay artículos agregados a la factura.</p>
      </div>
    {/if}
  </div>

  <!-- Añadir el selector de vendedor en la sección de detalles -->
  {#if mostrarEncabezadoCompleto}
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5>Detalles adicionales</h5>
        <Button variant="secondary" size="sm" on:click={() => mostrarEncabezadoCompleto = false}>
          Ocultar detalles
        </Button>
      </div>
      <div class="card-body">
        <div class="row">
          <!-- Otras filas existentes para detalles adicionales -->
          <!-- Segunda fila - Observación (visible solo si mostrarEncabezadoCompleto es true) -->
    
    <div class="mb-4">
      <label for="observacion" class="block text-sm font-medium text-gray-700 mb-1">Observación</label>
      <textarea 
        id="observacion" 
        bind:value={factura.Observacion}
        rows="2"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>
    </div>
    
          <!-- Nuevo selector de vendedor similar al de forma de pago -->
          <div class="col-md-6 mb-3">
            <label for="vendedor" class="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
            <select 
              id="vendedor" 
              bind:value={factura.VendedorCodigo}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar vendedor</option>
              {#each vendedoresOptions as vendedor}
                <option value={vendedor.value}>{vendedor.label}</option>
              {/each}
            </select>
          </div>
          
          <!-- Otras columnas de detalles -->
        </div>
      </div>
    </div>
  {:else}
    <div class="d-flex justify-content-end mb-3">
      <Button variant="secondary"  on:click={() => mostrarEncabezadoCompleto = true}>
        Mostrar más detalles
      </Button>
    </div>
  {/if}
</div> 

<!-- Al final del HTML, añadir el componente modal: -->
<CaeModal 
  bind:show={showCaeModal} 
  factura={facturaCreada}
  on:close={handleCloseCaeModal}
  on:caeObtenido={handleCaeObtenido}
  on:imprimir={handleImprimirFactura}
/> 