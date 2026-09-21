<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Minus, Plus, Trash2 } from 'lucide-svelte';
	import { formatMoneyAR, type PosLinea } from '$lib/utils/posTicket';

	export let lineas: PosLinea[] = [];
	export let seleccionId: string | null = null;
	export let disabled = false;

	const dispatch = createEventDispatcher<{
		select: string;
		deselect: void;
		qty: { lineId: string; delta: number };
		remove: string;
	}>();

	const cols = 'grid-cols-[2.5rem_1fr_3.75rem_6rem_7.5rem_2.5rem]';

	function enEdicion(lineId: string) {
		return seleccionId === lineId;
	}

	function toggleEdicion(lineId: string) {
		if (disabled) return;
		if (enEdicion(lineId)) dispatch('deselect');
		else dispatch('select', lineId);
	}
</script>

<div class="flex h-full min-h-0 flex-col bg-white">
	<div
		class="grid {cols} gap-2 border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
	>
		<span>Cant.</span>
		<span>Descripción</span>
		<span class="text-right">IVA</span>
		<span class="text-right">P. unit.</span>
		<span class="text-right">Total</span>
		<span></span>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto">
		{#if lineas.length === 0}
			<div class="flex h-full flex-col items-center justify-center px-8 text-center text-slate-400">
				<p class="text-lg font-medium text-slate-500">Ticket vacío</p>
				<p class="mt-1 text-sm">Escaneá un producto o tocá un rubro para cargar un Varios.</p>
			</div>
		{:else}
			{#each lineas as linea (linea.lineId)}
				<div
					class="grid w-full select-none {cols} items-center gap-2 border-b px-4 py-3 {enEdicion(linea.lineId)
						? 'border-amber-200 bg-amber-50 ring-2 ring-inset ring-amber-400'
						: 'border-slate-100 hover:bg-slate-50'}"
					role="row"
					aria-selected={enEdicion(linea.lineId)}
					tabindex="-1"
					title="Doble clic para editar cantidad con + y −"
					on:dblclick={() => toggleEdicion(linea.lineId)}
				>
					<div class="flex flex-col items-center gap-1">
						<button
							type="button"
							class="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
							disabled={disabled}
							aria-label="Sumar cantidad"
							on:click|stopPropagation={() => dispatch('qty', { lineId: linea.lineId, delta: 1 })}
						>
							<Plus class="h-3.5 w-3.5" />
						</button>
						<span class="text-sm font-semibold text-slate-800">{linea.Cantidad}</span>
						<button
							type="button"
							class="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
							disabled={disabled}
							aria-label="Restar cantidad"
							on:click|stopPropagation={() => dispatch('qty', { lineId: linea.lineId, delta: -1 })}
						>
							<Minus class="h-3.5 w-3.5" />
						</button>
					</div>
					<div class="min-w-0">
						<p class="truncate font-medium text-slate-900">{linea.Descripcion}</p>
						<p class="truncate text-xs text-slate-400">{linea.ArticuloCodigo}</p>
					</div>
					<span class="text-right text-sm tabular-nums text-slate-600">{linea.PorcentajeIva}%</span>
					<span class="text-right text-sm text-slate-600">{formatMoneyAR(linea.PrecioUnitarioConIva)}</span>
					<span class="text-right text-base font-semibold text-slate-900">{formatMoneyAR(linea.Total)}</span>
					<button
						type="button"
						class="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
						disabled={disabled}
						aria-label="Quitar línea"
						on:click|stopPropagation={() => dispatch('remove', linea.lineId)}
					>
						<Trash2 class="h-4 w-4" />
					</button>
				</div>
			{/each}
		{/if}
	</div>
</div>
