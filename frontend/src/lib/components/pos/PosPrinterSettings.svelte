<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { toast } from '$lib/utils/toast';
	import {
		COLUMNAS_ESCPOS,
		loadPosPrinterConfig,
		savePosPrinterConfig,
		type PosPrinterConfig
	} from '$lib/utils/posPrinterConfig';
	import {
		connectQz,
		listQzPrinters,
		mensajeErrorImpresion,
		printTicket,
		qzStatus
	} from '$lib/services/QzTrayService';
	import { ticketPrueba } from '$lib/utils/posTicketHtml';

	const dispatch = createEventDispatcher<{ close: void; saved: PosPrinterConfig }>();

	const etiqueta = 'mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300';
	const campo =
		'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900';

	const ETIQUETA_COLUMNAS: Record<number, string> = {
		48: '48 columnas (papel de 80 mm)',
		42: '42 columnas (papel de 58 mm)',
		32: '32 columnas (papel de 58 mm, letra grande)'
	};

	let config: PosPrinterConfig = loadPosPrinterConfig();
	let printers: string[] = [];
	let loading = false;
	let testing = false;
	let error = '';

	onMount(() => {
		void cargarImpresoras();
	});

	async function cargarImpresoras() {
		loading = true;
		error = '';
		try {
			await connectQz();
			printers = await listQzPrinters();
			if (config.printerName && !printers.includes(config.printerName)) {
				printers = [config.printerName, ...printers];
			}
		} catch (err) {
			printers = config.printerName ? [config.printerName] : [];
			error = mensajeErrorImpresion(err);
		} finally {
			loading = false;
		}
	}

	function datosFormulario(): Partial<PosPrinterConfig> {
		return {
			terminalName: config.terminalName.trim() || 'Caja 1',
			printerName: config.printerName,
			anchoMm: 80,
			copias: Math.max(1, Number(config.copias) || 1),
			modo: config.modo,
			columnas: Number(config.columnas) || 48,
			cortarPapel: config.cortarPapel,
			abrirCajon: config.abrirCajon
		};
	}

	function guardar() {
		const saved = savePosPrinterConfig(datosFormulario());
		config = saved;
		dispatch('saved', saved);
		dispatch('close');
	}

	async function probar() {
		if (!config.printerName) {
			error = 'Elegí la impresora de esta caja';
			return;
		}
		testing = true;
		error = '';
		try {
			config = savePosPrinterConfig(datosFormulario());
			dispatch('saved', config);
			await printTicket(ticketPrueba(), config);
			toast.success('Ticket de prueba enviado');
		} catch (err) {
			error = mensajeErrorImpresion(err);
			toast.error(error);
		} finally {
			testing = false;
		}
	}
</script>

<p class="text-sm text-slate-500 dark:text-slate-400">
	La configuración queda en esta PC. Para probar sin térmica, elegí una impresora PDF.
</p>
<p class="mt-1 text-xs text-slate-400 dark:text-slate-500">
	QZ Tray: {$qzStatus === 'conectado' || $qzStatus === 'imprimiendo' ? 'conectado' : 'cerrado'}.
	La primera vez tocá Allow (Remember puede quedar marcado). Si Allow está gris, desmarcá Remember, Allow, y recargá esta página.
</p>

<label class={etiqueta} for="pos-printer-name">Nombre de terminal</label>
<input id="pos-printer-name" bind:value={config.terminalName} class={campo} />

<label class={etiqueta} for="pos-printer-device">Impresora</label>
<select id="pos-printer-device" bind:value={config.printerName} class={campo}>
	<option value="">Elegí una impresora</option>
	{#each printers as printer}
		<option value={printer}>{printer}</option>
	{/each}
</select>

<label class={etiqueta} for="pos-printer-mode">Modo de impresión</label>
<select id="pos-printer-mode" bind:value={config.modo} class={campo}>
	<option value="qz">QZ (imagen HTML)</option>
	<option value="escpos">ESC/POS (Epson TM-T20II, recomendado)</option>
</select>

{#if config.modo === 'escpos'}
	<label class={etiqueta} for="pos-printer-columns">Columnas</label>
	<select id="pos-printer-columns" bind:value={config.columnas} class={campo}>
		{#each COLUMNAS_ESCPOS as columnas}
			<option value={columnas}>{ETIQUETA_COLUMNAS[columnas]}</option>
		{/each}
	</select>

	<label class="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
		<input type="checkbox" bind:checked={config.cortarPapel} class="h-4 w-4" />
		Cortar papel al final
	</label>
	<label class="mt-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
		<input type="checkbox" bind:checked={config.abrirCajon} class="h-4 w-4" />
		Abrir cajón de dinero
	</label>
{/if}

<label class={etiqueta} for="pos-printer-copies">Copias</label>
<input
	id="pos-printer-copies"
	type="number"
	min="1"
	max="5"
	bind:value={config.copias}
	class="{campo} !w-24"
/>

{#if loading}
	<p class="mt-3 text-sm text-slate-400">Buscando impresoras...</p>
{/if}
{#if error}
	<p class="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
{/if}

<div class="mt-6 flex gap-3">
	<button
		type="button"
		class="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
		on:click={() => dispatch('close')}
	>
		Cancelar
	</button>
	<button
		type="button"
		class="flex-1 rounded-xl border border-blue-200 px-4 py-3 font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
		disabled={testing || !config.printerName}
		on:click={probar}
	>
		{testing ? 'Enviando...' : 'Probar'}
	</button>
	<button
		type="button"
		class="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
		on:click={guardar}
	>
		Guardar
	</button>
</div>
