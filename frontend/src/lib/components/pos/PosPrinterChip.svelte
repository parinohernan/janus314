<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Printer } from 'lucide-svelte';
	import { qzStatus } from '$lib/services/QzTrayService';

	export let printerName = '';
	export let disabled = false;

	const dispatch = createEventDispatcher<{ open: void }>();

	$: desconectado = $qzStatus === 'desconectado' || $qzStatus === 'error';
	$: sinImpresora = !printerName;
	$: label = desconectado ? 'QZ cerrado' : sinImpresora ? 'Sin impresora' : printerName;
	$: tone = desconectado ? 'off' : sinImpresora ? 'warn' : 'ok';
</script>

<button
	type="button"
	class="flex max-w-[11rem] items-center gap-2 rounded-full px-3 py-2 text-sm {tone === 'ok'
		? 'bg-emerald-400 text-emerald-950'
		: tone === 'warn'
			? 'bg-amber-400 text-amber-950'
			: 'bg-white/15 text-white'}"
	{disabled}
	title={label}
	on:click={() => dispatch('open')}
>
	<Printer class="h-4 w-4 shrink-0" />
	<span class="truncate">{label}</span>
</button>
