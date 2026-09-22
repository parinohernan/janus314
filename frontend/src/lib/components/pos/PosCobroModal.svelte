<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { precargarTiposPagoPos, type TipoPagoPos } from '$lib/utils/posTiposPago';
	import { formatMoneyAR } from '$lib/utils/posTicket';

	export let show = false;
	export let total = 0;
	export let tipos: TipoPagoPos[] = [];

	const dispatch = createEventDispatcher<{
		close: void;
		confirm: { codigo: string; descripcion: string };
	}>();

	let loading = false;
	let error = '';
	let elegido = '';
	let recibido = 0;
	let abiertoAntes = false;
	let lista: TipoPagoPos[] = [];

	$: if (tipos.length > 0) lista = tipos;
	$: tipoElegido = lista.find((tipo) => tipo.Codigo === elegido) || null;
	$: esContado = tipoElegido?.Codigo === 'CO';
	$: vuelto = Math.max(0, Number(recibido || 0) - Number(total || 0));
	$: faltaDinero = esContado && Number(recibido || 0) + 0.001 < Number(total || 0);

	$: if (show && !abiertoAntes) {
		abiertoAntes = true;
		elegido = '';
		recibido = Number(total || 0);
		queueMicrotask(() => cargarTipos());
	}
	$: if (!show) abiertoAntes = false;

	async function cargarTipos() {
		if (lista.length > 0) return;
		loading = true;
		error = '';
		try {
			lista = await precargarTiposPagoPos();
			if (lista.length === 0) error = 'No hay tipos de pago activos para cobrar';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al cargar los tipos de pago';
		} finally {
			loading = false;
		}
	}

	function elegir(codigo: string) {
		elegido = codigo;
		if (codigo === 'CO') recibido = Number(total || 0);
	}

	function confirmar() {
		if (!tipoElegido || faltaDinero) return;
		dispatch('confirm', { codigo: tipoElegido.Codigo, descripcion: tipoElegido.Descripcion });
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="presentation"
		on:click|self={() => dispatch('close')}
	>
		<div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
			<h2 class="text-xl font-semibold text-slate-900">Cobrar</h2>
			<p class="mt-1 text-3xl font-bold tabular-nums text-slate-900">{formatMoneyAR(total)}</p>
			<p class="mt-1 text-sm text-slate-500">Elegí un tipo de pago para habilitar el remito o la factura.</p>

			{#if loading}
				<p class="mt-6 text-sm text-slate-400">Cargando tipos de pago...</p>
			{:else if error}
				<p class="mt-6 text-sm text-red-600">{error}</p>
			{:else}
				<div class="mt-5 grid grid-cols-2 gap-2">
					{#each lista as tipo}
						<button
							type="button"
							class="min-h-14 rounded-xl border px-3 py-3 text-left text-sm font-semibold {elegido === tipo.Codigo
								? 'border-emerald-600 bg-emerald-50 text-emerald-800'
								: 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}"
							on:click={() => elegir(tipo.Codigo)}
						>
							{tipo.Descripcion || tipo.Codigo}
						</button>
					{/each}
				</div>
			{/if}

			{#if esContado}
				<label class="mt-5 block text-sm font-medium text-slate-700" for="pos-recibido">Dinero recibido</label>
				<input
					id="pos-recibido"
					type="number"
					min="0"
					step="0.01"
					bind:value={recibido}
					class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
				/>
				<p class="mt-2 text-sm text-slate-600">
					Vuelto: <span class="font-semibold">{formatMoneyAR(vuelto)}</span>
				</p>
				{#if faltaDinero}
					<p class="mt-1 text-sm text-red-600">El recibido no alcanza el total.</p>
				{/if}
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
					class="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
					disabled={!tipoElegido || faltaDinero}
					on:click={confirmar}
				>
					Confirmar cobro
				</button>
			</div>
		</div>
	</div>
{/if}
