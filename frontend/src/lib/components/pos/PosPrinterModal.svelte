<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { toast } from '$lib/utils/toast';
	import {
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

	export let show = false;

	const dispatch = createEventDispatcher<{ close: void; saved: PosPrinterConfig }>();

	let config: PosPrinterConfig = loadPosPrinterConfig();
	let printers: string[] = [];
	let loading = false;
	let testing = false;
	let error = '';
	let abiertoAntes = false;

	$: if (show && !abiertoAntes) {
		abiertoAntes = true;
		config = loadPosPrinterConfig();
		queueMicrotask(() => cargarImpresoras());
	}
	$: if (!show) abiertoAntes = false;

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

	function guardar() {
		const saved = savePosPrinterConfig({
			terminalName: config.terminalName.trim() || 'Caja 1',
			printerName: config.printerName,
			anchoMm: 80,
			copias: Math.max(1, Number(config.copias) || 1)
		});
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
			savePosPrinterConfig(config);
			await printTicket(ticketPrueba(), config);
			toast.success('Ticket de prueba enviado');
		} catch (err) {
			error = mensajeErrorImpresion(err);
			toast.error(error);
		} finally {
			testing = false;
		}
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			dispatch('close');
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="presentation"
		on:click|self={() => dispatch('close')}
		on:keydown={onKeyDown}
	>
		<div
			class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="pos-printer-title"
			tabindex="-1"
		>
			<h2 id="pos-printer-title" class="text-xl font-semibold text-slate-900">Impresora de esta caja</h2>
			<p class="mt-1 text-sm text-slate-500">
				La configuración queda en esta PC. Para probar sin térmica, elegí una impresora PDF.
			</p>
			<p class="mt-1 text-xs text-slate-400">
				QZ Tray: {$qzStatus === 'conectado' || $qzStatus === 'imprimiendo' ? 'conectado' : 'cerrado'}.
				La primera vez tocá Allow (Remember puede quedar marcado). Si Allow está gris, desmarcá Remember, Allow, y recargá esta página.
			</p>

			<label class="mt-5 block text-sm font-medium text-slate-700" for="pos-printer-name">Nombre de terminal</label>
			<input
				id="pos-printer-name"
				bind:value={config.terminalName}
				class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
			/>

			<label class="mt-4 block text-sm font-medium text-slate-700" for="pos-printer-device">Impresora</label>
			<select
				id="pos-printer-device"
				bind:value={config.printerName}
				class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
			>
				<option value="">Elegí una impresora</option>
				{#each printers as printer}
					<option value={printer}>{printer}</option>
				{/each}
			</select>

			<label class="mt-4 block text-sm font-medium text-slate-700" for="pos-printer-copies">Copias</label>
			<input
				id="pos-printer-copies"
				type="number"
				min="1"
				max="5"
				bind:value={config.copias}
				class="mt-1 w-24 rounded-xl border border-slate-300 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
			/>

			{#if loading}
				<p class="mt-3 text-sm text-slate-400">Buscando impresoras...</p>
			{/if}
			{#if error}
				<p class="mt-3 text-sm text-red-600">{error}</p>
			{/if}

			<div class="mt-6 flex gap-3">
				<button
					type="button"
					class="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-600 hover:bg-slate-50"
					on:click={() => dispatch('close')}
				>
					Cancelar
				</button>
				<button
					type="button"
					class="flex-1 rounded-xl border border-blue-200 px-4 py-3 font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
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
		</div>
	</div>
{/if}
