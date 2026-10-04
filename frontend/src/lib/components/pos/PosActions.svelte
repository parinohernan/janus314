<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Banknote, History, Minus, Plus, Receipt, RotateCcw } from 'lucide-svelte';
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
		historial: void;
		ingreso: void;
		egreso: void;
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

	<div class="shrink-0">
		<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sesión</p>
		<div class="mb-2 grid grid-cols-2 gap-2">
			<button
				type="button"
				class="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-3 py-3 text-sm font-semibold text-emerald-800 dark:text-emerald-200 shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900"
				on:click={() => dispatch('ingreso')}
			>
				<Plus class="h-4 w-4" />
				Ingreso
			</button>
			<button
				type="button"
				class="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-3 text-sm font-semibold text-red-800 dark:text-red-200 shadow-sm hover:bg-red-100 dark:hover:bg-red-900"
				on:click={() => dispatch('egreso')}
			>
				<Minus class="h-4 w-4" />
				Egreso
			</button>
		</div>
		<button
			type="button"
			class="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
			on:click={() => dispatch('historial')}
		>
			<History class="h-4 w-4" />
			Historial
		</button>
	</div>
</div>
