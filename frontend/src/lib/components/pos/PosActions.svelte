<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Banknote, FileText, History, Minus, Plus, Receipt, RotateCcw } from 'lucide-svelte';
	import { POS_RUBROS, type PosRubro } from '$lib/constants/posVarios';
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
		prf: void;
		ticket: void;
		nueva: void;
		rubro: PosRubro;
		historial: void;
		ingreso: void;
		egreso: void;
	}>();
</script>

<div class="flex h-full min-h-0 flex-col gap-4 p-4">
	<div class="rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-lg">
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
	</button>

	<div class="grid grid-cols-1 gap-3">
		<button
			type="button"
			class="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-lg font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
			disabled={disabled || cobrando || !listoParaEmitir}
			on:click={() => dispatch('prf')}
		>
			<FileText class="h-5 w-5" />
			PRF · Remito
			<span class="ml-1 text-sm font-normal text-blue-100">F9</span>
		</button>
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
		class="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
		disabled={disabled || cobrando || ventaCobrada}
		on:click={() => dispatch('nueva')}
	>
		<RotateCcw class="h-4 w-4" />
		Nueva venta
		<span class="text-xs text-slate-400">F8</span>
	</button>

	<div class="min-h-0 flex-1 overflow-y-auto">
		<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Rubros</p>
		<div class="grid grid-cols-2 gap-2">
			{#each POS_RUBROS as rubro}
				<button
					type="button"
					class="min-h-14 rounded-xl border px-3 py-3 text-sm font-semibold shadow-sm disabled:opacity-50 {rubro.clase}"
					disabled={disabled || cobrando || ventaCobrada}
					on:click={() => dispatch('rubro', rubro)}
				>
					{rubro.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="shrink-0">
		<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sesión</p>
		<div class="mb-2 grid grid-cols-2 gap-2">
			<button
				type="button"
				class="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
				on:click={() => dispatch('ingreso')}
			>
				<Plus class="h-4 w-4" />
				Ingreso
			</button>
			<button
				type="button"
				class="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-semibold text-red-800 shadow-sm hover:bg-red-100"
				on:click={() => dispatch('egreso')}
			>
				<Minus class="h-4 w-4" />
				Egreso
			</button>
		</div>
		<button
			type="button"
			class="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
			on:click={() => dispatch('historial')}
		>
			<History class="h-4 w-4" />
			Historial
		</button>
	</div>
</div>
