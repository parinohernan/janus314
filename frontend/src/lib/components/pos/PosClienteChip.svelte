<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { UserRound } from 'lucide-svelte';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import type { Cliente } from '$lib/types/cliente';

	export let cliente: Cliente;
	export let disabled = false;

	const dispatch = createEventDispatcher<{ select: Cliente }>();

	let abierto = false;
	let busqueda = '';
	let resultados: Cliente[] = [];
	let loading = false;
	let timeoutId: ReturnType<typeof timeout> | null = null;

	function timeout(fn: () => void, ms: number) {
		return setTimeout(fn, ms);
	}

	async function buscar() {
		if (busqueda.trim().length < 2) {
			resultados = [];
			return;
		}
		loading = true;
		try {
			const response = await fetchWithAuth('/clientes', {
				params: {
					page: 1,
					limit: 8,
					search: busqueda.trim(),
					field: 'Descripcion',
					order: 'ASC'
				}
			});
			const data = await response.json();
			resultados = data.items || [];
		} catch {
			resultados = [];
		} finally {
			loading = false;
		}
	}

	function onInput() {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = timeout(buscar, 250);
	}

	function elegir(item: Cliente) {
		dispatch('select', item);
		abierto = false;
		busqueda = '';
		resultados = [];
	}
</script>

<div class="relative">
	<button
		type="button"
		class="flex max-w-xs items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-left text-white hover:bg-white/25 disabled:opacity-50"
		{disabled}
		on:click={() => (abierto = !abierto)}
	>
		<UserRound class="h-4 w-4 shrink-0" />
		<span class="min-w-0">
			<span class="block truncate text-sm font-semibold">{cliente?.Descripcion || 'Cliente'}</span>
			<span class="block truncate text-xs text-blue-100">
				{cliente?.Codigo || 'CF'} · Contado
			</span>
		</span>
	</button>

	{#if abierto}
		<div class="absolute right-0 z-30 mt-2 w-80 rounded-xl bg-white p-3 text-slate-900 shadow-xl ring-1 ring-slate-200">
			<input
				bind:value={busqueda}
				class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
				placeholder="Buscar cliente..."
				on:input={onInput}
			/>
			<div class="mt-2 max-h-56 overflow-y-auto">
				{#if loading}
					<p class="px-2 py-3 text-sm text-slate-400">Buscando...</p>
				{:else if resultados.length === 0}
					<p class="px-2 py-3 text-sm text-slate-400">Escribí al menos 2 letras</p>
				{:else}
					{#each resultados as item}
						<button
							type="button"
							class="block w-full rounded-lg px-2 py-2 text-left hover:bg-blue-50"
							on:click={() => elegir(item)}
						>
							<p class="text-sm font-medium text-slate-800">{item.Descripcion}</p>
							<p class="text-xs text-slate-400">{item.Codigo} · IVA {item.CategoriaIva || '-'}</p>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
