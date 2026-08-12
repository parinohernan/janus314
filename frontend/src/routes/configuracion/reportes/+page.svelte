<script lang="ts">
  import { onMount } from 'svelte';
  import { ConfiguracionService } from '$lib/services/ConfiguracionService';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import type { Configuracion } from '$lib/types';

  const CODIGOS = [
    'reportes_auto_enabled',
    'reportes_auto_dir',
    'reportes_auto_rclone'
  ] as const;

  type Codigo = (typeof CODIGOS)[number];

  let cargando = $state(true);
  let guardando = $state(false);
  let generando = $state(false);
  let mensaje = $state('');
  let mensajeTipo: 'success' | 'error' = $state('success');
  let valores: Record<string, string> = $state({
    reportes_auto_enabled: '0',
    reportes_auto_dir: '',
    reportes_auto_rclone: ''
  });
  let originales: Record<string, string> = $state({});
  let configs: Record<string, Configuracion | null> = $state({});

  let fechaDesde = $state('');
  let fechaHasta = $state('');
  let ultimoResultado = $state<string>('');

  onMount(async () => {
    const rango = mesAnterior();
    fechaDesde = rango.desde;
    fechaHasta = rango.hasta;
    await cargar();
  });

  function pad2(n: number) {
    return String(n).padStart(2, '0');
  }

  function mesAnterior(now = new Date()) {
    const y = now.getFullYear();
    const m = now.getMonth();
    const py = m === 0 ? y - 1 : y;
    const pm = m === 0 ? 11 : m - 1;
    const last = new Date(py, pm + 1, 0).getDate();
    const mm = pad2(pm + 1);
    return {
      desde: `${py}-${mm}-01`,
      hasta: `${py}-${mm}-${pad2(last)}`
    };
  }

  function mostrarMensaje(msg: string, tipo: 'success' | 'error') {
    mensaje = msg;
    mensajeTipo = tipo;
    setTimeout(() => {
      mensaje = '';
    }, 4000);
  }

  function label(codigo: Codigo): string {
    const map: Record<Codigo, string> = {
      reportes_auto_enabled: 'Activar export automático',
      reportes_auto_dir: 'Carpeta local en el servidor',
      reportes_auto_rclone: 'Remoto rclone (Google Drive)'
    };
    return map[codigo];
  }

  function ayuda(codigo: Codigo): string {
    const map: Record<Codigo, string> = {
      reportes_auto_enabled:
        'Si está activo, el cron mensual (npm run job:rubros-provincia) exporta esta empresa.',
      reportes_auto_dir:
        'Path absoluto en el servidor donde se guardan los PDF, ej. /var/janus/contador/rubros-provincia',
      reportes_auto_rclone:
        'Opcional. Ej. gdrive:Contabilidad/RubrosProvincia — ver docs/informe-contador-rubros-provincia.md'
    };
    return map[codigo];
  }

  async function cargar() {
    try {
      cargando = true;
      const todas = await ConfiguracionService.obtenerConfiguraciones();
      for (const codigo of CODIGOS) {
        const cfg = todas.find((c) => c.Codigo === codigo) ?? null;
        configs[codigo] = cfg;
        let valor = cfg?.ValorConfig ?? '';
        if (codigo === 'reportes_auto_enabled') {
          valor = String(valor).trim() === '1' ? '1' : '0';
        }
        valores[codigo] = valor;
        originales[codigo] = valor;
      }
    } catch (e) {
      console.error(e);
      mostrarMensaje('Error al cargar la configuración de reportes', 'error');
    } finally {
      cargando = false;
    }
  }

  async function guardarTodo() {
    try {
      guardando = true;
      for (const codigo of CODIGOS) {
        if (valores[codigo] === originales[codigo] && configs[codigo]) continue;
        const ok = await ConfiguracionService.actualizarConfiguracion(
          codigo,
          codigo === 'reportes_auto_enabled'
            ? valores[codigo] === '1'
              ? '1'
              : '0'
            : valores[codigo]
        );
        if (!ok) {
          mostrarMensaje(`No se pudo guardar ${codigo}`, 'error');
          return;
        }
      }
      mostrarMensaje('Configuración de reportes guardada', 'success');
      await cargar();
    } catch (e) {
      console.error(e);
      mostrarMensaje('Error al guardar', 'error');
    } finally {
      guardando = false;
    }
  }

  async function generarAhora() {
    if (!valores.reportes_auto_dir?.trim()) {
      mostrarMensaje('Primero guardá una carpeta local válida', 'error');
      return;
    }
    try {
      generando = true;
      ultimoResultado = '';
      // Asegurar que la carpeta esté persistida antes de exportar
      if (valores.reportes_auto_dir !== originales.reportes_auto_dir) {
        await ConfiguracionService.actualizarConfiguracion(
          'reportes_auto_dir',
          valores.reportes_auto_dir
        );
      }
      if (valores.reportes_auto_rclone !== originales.reportes_auto_rclone) {
        await ConfiguracionService.actualizarConfiguracion(
          'reportes_auto_rclone',
          valores.reportes_auto_rclone
        );
      }

      const res = await fetchWithAuth('/informes/ventas-rubros-provincia/export-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaDesde,
          fechaHasta,
          tipo: 'ambos'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Error al generar');
      }
      const files = (data.data?.files || [])
        .map((f: { filename: string }) => f.filename)
        .join(', ');
      ultimoResultado = `${data.message}${files ? ` — ${files}` : ''}`;
      if (data.data?.rclone?.remote) {
        ultimoResultado += ` · Drive: ${data.data.rclone.remote}`;
      }
      mostrarMensaje('Informes generados correctamente', 'success');
      await cargar();
    } catch (e) {
      console.error(e);
      mostrarMensaje(e instanceof Error ? e.message : 'Error al generar informes', 'error');
    } finally {
      generando = false;
    }
  }

  const hayCambios = $derived(
    CODIGOS.some((c) => valores[c] !== (originales[c] ?? ''))
  );
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-800">Reportes automáticos</h1>
    <p class="text-gray-600 mt-2">
      Export mensual de <strong>Rubros por Provincia</strong> para el contador (carpeta local y/o Google Drive vía rclone), sin darle acceso a Janus.
    </p>
  </div>

  {#if mensaje}
    <div
      class="mb-4 p-4 rounded-lg {mensajeTipo === 'success'
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700'}"
    >
      {mensaje}
    </div>
  {/if}

  {#if cargando}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow-md mb-6">
      <div class="p-6 space-y-6">
        <h2 class="text-xl font-semibold text-gray-800">Parámetros</h2>

        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
          <div class="flex-1">
            <span class="block text-lg font-semibold text-gray-700 mb-1"
              >{label('reportes_auto_enabled')}</span
            >
            <p class="text-sm text-gray-500">{ayuda('reportes_auto_enabled')}</p>
          </div>
          <div class="md:w-1/3">
            <select
              bind:value={valores.reportes_auto_enabled}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={guardando}
            >
              <option value="0">No</option>
              <option value="1">Sí</option>
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-2 border-b border-gray-200 pb-6">
          <label class="block text-lg font-semibold text-gray-700" for="reportes_auto_dir"
            >{label('reportes_auto_dir')}</label
          >
          <p class="text-sm text-gray-500">{ayuda('reportes_auto_dir')}</p>
          <input
            id="reportes_auto_dir"
            type="text"
            bind:value={valores.reportes_auto_dir}
            placeholder="/var/janus/contador/rubros-provincia"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            disabled={guardando}
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="block text-lg font-semibold text-gray-700" for="reportes_auto_rclone"
            >{label('reportes_auto_rclone')}</label
          >
          <p class="text-sm text-gray-500">{ayuda('reportes_auto_rclone')}</p>
          <input
            id="reportes_auto_rclone"
            type="text"
            bind:value={valores.reportes_auto_rclone}
            placeholder="gdrive:Contabilidad/RubrosProvincia"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            disabled={guardando}
          />
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="button"
            onclick={guardarTodo}
            disabled={guardando || !hayCambios}
            class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md mb-6">
      <div class="p-6 space-y-4">
        <h2 class="text-xl font-semibold text-gray-800">Generar ahora</h2>
        <p class="text-sm text-gray-500">
          Crea los PDF de facturas y notas de crédito del período indicado en la carpeta configurada
          (y sube a Drive si hay remoto rclone). No requiere que el export automático esté activado.
        </p>
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1" for="desde">Desde</label>
            <input
              id="desde"
              type="date"
              bind:value={fechaDesde}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              disabled={generando}
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1" for="hasta">Hasta</label>
            <input
              id="hasta"
              type="date"
              bind:value={fechaHasta}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              disabled={generando}
            />
          </div>
        </div>
        <button
          type="button"
          onclick={generarAhora}
          disabled={generando || !valores.reportes_auto_dir?.trim()}
          class="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {generando ? 'Generando...' : 'Generar PDF del período'}
        </button>
        {#if ultimoResultado}
          <p class="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
            {ultimoResultado}
          </p>
        {/if}
      </div>
    </div>

    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 class="font-semibold text-blue-800 mb-2">Cómo funciona</h3>
      <ul class="text-sm text-blue-700 space-y-1 list-disc list-inside">
        <li>
          El job del servidor (<code class="text-xs bg-blue-100 px-1 rounded">npm run job:rubros-provincia</code>)
          corre por cron el día 1 y solo procesa empresas con export automático en <strong>Sí</strong>.
        </li>
        <li>Los archivos van a <code class="text-xs bg-blue-100 px-1 rounded">carpeta/YYYY-MM/</code>.</li>
        <li>
          La cuenta de servicio de Google Drive y rclone se configuran en el servidor; detalle en
          <code class="text-xs bg-blue-100 px-1 rounded">docs/informe-contador-rubros-provincia.md</code>.
        </li>
        <li>El contador solo necesita acceso de lectura a la carpeta compartida en Drive.</li>
      </ul>
    </div>
  {/if}
</div>
