<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Search } from 'lucide-svelte';
	import { filtrarPosCatalogo } from '$lib/utils/posCatalogo';
	import { formatMoneyAR, ivaDeArticulo, precioListaSinIva } from '$lib/utils/posTicket';
	import { redondear2 } from '$lib/utils/comprobanteTotales';
	import type { Articulo } from '$lib/types/articulo';

	export let show = false;
	export let listaPrecio = '1';
	export let articulos: Articulo[] = [];
	export let catalogoListo = false;

	const dispatch = createEventDispatcher<{
		select: Articulo;
		close: void;
	}>();

	let busqueda = '';
	let destacado = 0;
	let inputEl: HTMLInputElement;
	let abiertoAntes = false;

	$: if (show && !abiertoAntes) {
		abiertoAntes = true;
		busqueda = '';
		destacado = 0;
		queueMicrotask(() => inputEl?.focus());
	}
	$: if (!show) abiertoAntes = false;
	$: resultados = filtrarPosCatalogo(articulos, busqueda);
	$: if (destacado >= resultados.length) destacado = 0;

	function precioConIva(articulo: Articulo): number {
		const iva = ivaDeArticulo(articulo);
		const sinIva = precioListaSinIva(articulo, listaPrecio);
		return redondear2(sinIva * (1 + iva / 100));
	}

	function elegir(articulo: Articulo) {
		dispatch('select', articulo);
		dispatch('close');
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			dispatch('close');
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (!resultados.length) return;
			destacado = (destacado + 1) % resultados.length;
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (!resultados.length) return;
			destacado = (destacado - 1 + resultados.length) % resultados.length;
			return;
		}
		if (event.key === 'Enter') {
			event.preventDefault();
			const item = resultados[destacado];
			if (item) elegir(item);
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[10vh]"
		role="presentation"
		on:click|self={() => dispatch('close')}
		on:keydown={onKeyDown}
	>
		<div
			class="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="pos-buscar-title"
			tabindex="-1"
		>
			<h2 id="pos-buscar-title" class="text-xl font-semibold text-slate-900">Buscar producto</h2>
			<p class="mt-1 text-sm text-slate-500">Por descripción o código · F2 para abrir · Enter para agregar</p>

			<label class="mt-4 flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
				<Search class="h-5 w-5 shrink-0 text-slate-400" />
				<input
					bind:this={inputEl}
					bind:value={busqueda}
					class="w-full border-0 bg-transparent p-1 text-base text-slate-900 outline-none placeholder:text-slate-400"
					placeholder="Escribí al menos 2 letras..."
					autocomplete="off"
				/>
			</label>

			<div class="mt-3 max-h-80 overflow-y-auto">
				{#if !catalogoListo}
					<p class="px-2 py-4 text-sm text-slate-400">Cargando productos...</p>
				{:else if busqueda.trim().length < 2}
					<p class="px-2 py-4 text-sm text-slate-400">Escribí para filtrar el listado</p>
				{:else if resultados.length === 0}
					<p class="px-2 py-4 text-sm text-slate-400">No hay productos con esa descripción</p>
				{:else}
					{#each resultados as item, index}
						<button
							type="button"
							class="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left {index === destacado
								? 'bg-blue-50 ring-1 ring-blue-200'
								: 'hover:bg-slate-50'}"
							on:click={() => elegir(item)}
							on:mouseenter={() => (destacado = index)}
						>
							<span class="min-w-0">
								<span class="block truncate font-medium text-slate-800">{item.Descripcion}</span>
								<span class="block text-xs text-slate-400">
									{item.Codigo} · stock {Number(item.Existencia) || 0}
								</span>
							</span>
							<span class="shrink-0 text-base font-semibold tabular-nums text-slate-900">
								{formatMoneyAR(precioConIva(item))}
							</span>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
