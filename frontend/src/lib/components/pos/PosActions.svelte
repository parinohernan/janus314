<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Banknote, Receipt, RotateCcw } from 'lucide-svelte';
	import { POS_RUBROS, etiquetaAtajoRubro, type PosRubro } from '$lib/constants/posVarios';
	import { formatMoneyAR } from '$lib/utils/posTicket';

	export let total = 0;
	export let ticketLabel = 'Ticket B';
	export let disabled = false;
	export let cobrando = false;
	export let hayItems = false;
	export let listoParaEmitir = false;
	export let pagoLabel = '';
	export let ventaCobrada = false;

	const dispatch = createEventDispatcher<{
		cobrar: void;
		ticket: void;
		nueva: void;
		rubro: PosRubro;
	}>();
</script>

<div class="flex h-full min-h-0 flex-col gap-4 p-4">
	<div class="rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-lg dark:bg-slate-800 dark:ring-1 dark:ring-slate-700">
		<p class="text-sm font-medium uppercase tracking-widest text-slate-300">Total</p>
		<p class="mt-1 truncate text-4xl font-bold tabular-nums sm:text-5xl">{formatMoneyAR(total)}</p>
		{#if pagoLabel}
			<p class="mt-2 text-sm text-emerald-300">Cobrado · {pagoLabel}</p>
		{:else if hayItems}
			<p class="mt-2 text-sm text-amber-200">Falta cobrar</p>
		{/if}
	</div>

	<button
		type="button"
		class="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-4 text-lg font-semibold text-slate-900 shadow hover:bg-amber-400 disabled:opacity-50"
		disabled={disabled || cobrando || !hayItems || listoParaEmitir}
		on:click={() => dispatch('cobrar')}
	>
		<Banknote class="h-5 w-5" />
		Cobrar
		<span class="ml-1 text-sm font-normal text-slate-700">F4</span>
	</button>

	<div class="grid grid-cols-1 gap-3">
		<button
			type="button"
			class="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-lg font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
			disabled={disabled || cobrando || !listoParaEmitir}
			on:click={() => dispatch('ticket')}
		>
			<Receipt class="h-5 w-5" />
			{ticketLabel}
			<span class="ml-1 text-sm font-normal text-emerald-100">F10</span>
		</button>
	</div>

	<button
		type="button"
		class="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
		disabled={disabled || cobrando || ventaCobrada}
		on:click={() => dispatch('nueva')}
	>
		<RotateCcw class="h-4 w-4" />
		Nueva venta
		<span class="text-xs text-slate-400">F8</span>
	</button>

	<div class="min-h-0 flex-1 overflow-y-auto">
		<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Rubros</p>
		<div class="grid grid-cols-2 gap-2">
			{#each POS_RUBROS as rubro}
				<button
					type="button"
					class="min-h-14 rounded-xl border px-3 py-3 text-sm font-semibold shadow-sm disabled:opacity-50 {rubro.clase}"
					disabled={disabled || cobrando || ventaCobrada}
					title="{rubro.label} (Shift + {POS_RUBROS.indexOf(rubro) + 1})"
					on:click={() => dispatch('rubro', rubro)}
				>
					{rubro.label}
					<span class="ml-1 text-xs font-normal opacity-60">{etiquetaAtajoRubro(rubro)}</span>
				</button>
			{/each}
		</div>
	</div>
</div>
