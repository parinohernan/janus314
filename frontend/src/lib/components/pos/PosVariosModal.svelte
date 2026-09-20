<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { PosRubro } from '$lib/constants/posVarios';
	import { formatMoneyAR } from '$lib/utils/posTicket';

	export let rubro: PosRubro;
	export let show = false;

	const dispatch = createEventDispatcher<{
		confirm: { descripcion: string; precioConIva: number };
		close: void;
	}>();

	let descripcion = '';
	let precio = '';
	let descEl: HTMLInputElement;
	let precioEl: HTMLInputElement;
	let abiertoAntes = false;

	$: iva = rubro?.iva ?? 21;
	$: precioNum = Number(String(precio).replace(',', '.')) || 0;
	$: if (show && !abiertoAntes) {
		descripcion = rubro?.descripcionDefault || '';
		precio = '';
		abiertoAntes = true;
		queueMicrotask(() => descEl?.focus());
	}
	$: if (!show) abiertoAntes = false;

	function confirmar() {
		if (!descripcion.trim()) return;
		if (precioNum <= 0) {
			precioEl?.focus();
			return;
		}
		dispatch('confirm', {
			descripcion: descripcion.trim(),
			precioConIva: precioNum
		});
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			dispatch('close');
		}
		if (event.key === 'Enter') {
			event.preventDefault();
			if (document.activeElement === descEl) {
				precioEl?.focus();
				return;
			}
			confirmar();
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
			aria-labelledby="pos-varios-title"
			tabindex="-1"
		>
			<h2 id="pos-varios-title" class="text-xl font-semibold text-slate-900">{rubro.label}</h2>
			<p class="mt-1 text-sm text-slate-500">IVA {iva}% · el precio se carga con impuesto incluido</p>

			<label class="mt-5 block text-sm font-medium text-slate-700" for="pos-varios-desc">Descripción</label>
			<input
				id="pos-varios-desc"
				bind:this={descEl}
				bind:value={descripcion}
				class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				maxlength="100"
			/>

			<label class="mt-4 block text-sm font-medium text-slate-700" for="pos-varios-precio">Precio</label>
			<input
				id="pos-varios-precio"
				bind:this={precioEl}
				bind:value={precio}
				class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-2xl font-semibold tabular-nums outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				inputmode="decimal"
				placeholder="0,00"
			/>
			<p class="mt-1 text-xs text-slate-400">
				{precioNum > 0 ? formatMoneyAR(precioNum) : 'Completá el importe'}
			</p>

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
					class="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
					disabled={!descripcion.trim() || precioNum <= 0}
					on:click={confirmar}
				>
					Agregar
				</button>
			</div>
		</div>
	</div>
{/if}
