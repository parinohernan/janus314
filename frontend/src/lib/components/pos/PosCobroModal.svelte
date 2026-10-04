<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
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

	let dialogo: HTMLDivElement | null = null;

	$: if (show && !abiertoAntes) {
		abiertoAntes = true;
		elegido = '';
		recibido = Number(total || 0);
		queueMicrotask(() => cargarTipos());
		void tick().then(() => dialogo?.focus());
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

	let inputRecibido: HTMLInputElement | null = null;

	async function elegir(codigo: string) {
		elegido = codigo;
		if (codigo !== 'CO') return;
		recibido = Number(total || 0);
		await tick();
		inputRecibido?.focus();
		inputRecibido?.select();
	}

	function confirmar() {
		if (!tipoElegido || faltaDinero) return;
		dispatch('confirm', { codigo: tipoElegido.Codigo, descripcion: tipoElegido.Descripcion });
	}

	/** Del 1 al 9 elige el tipo de pago por su posición; en el campo de dinero recibido los números se escriben. */
	function onKeyDown(event: KeyboardEvent) {
		if (!show || event.ctrlKey || event.metaKey || event.altKey) return;
		if (event.key === 'Enter') {
			event.preventDefault();
			confirmar();
			return;
		}
		const target = event.target as HTMLElement | null;
		if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
		if (/^[1-9]$/.test(event.key)) {
			const tipo = lista[Number(event.key) - 1];
			if (!tipo) return;
			event.preventDefault();
			void elegir(tipo.Codigo);
		}
	}
</script>

<svelte:window on:keydown={onKeyDown} />

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="presentation"
		on:click|self={() => dispatch('close')}
	>
		<div
			bind:this={dialogo}
			class="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl outline-none"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Cobrar</h2>
			<p class="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatMoneyAR(total)}</p>
			<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
				Elegí un tipo de pago con su número y confirmá con Enter.
			</p>

			{#if loading}
				<p class="mt-6 text-sm text-slate-400">Cargando tipos de pago...</p>
			{:else if error}
				<p class="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p>
			{:else}
				<div class="mt-5 grid grid-cols-2 gap-2">
					{#each lista as tipo, indice}
						<button
							type="button"
							class="flex min-h-14 items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-semibold {elegido === tipo.Codigo
								? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
								: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'}"
							on:click={() => elegir(tipo.Codigo)}
						>
							{#if indice < 9}
								<span
									class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300"
								>
									{indice + 1}
								</span>
							{/if}
							<span>{tipo.Descripcion || tipo.Codigo}</span>
						</button>
					{/each}
				</div>
			{/if}

			{#if esContado}
				<label class="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-200" for="pos-recibido">Dinero recibido</label>
				<input
					id="pos-recibido"
					bind:this={inputRecibido}
					type="number"
					min="0"
					step="0.01"
					bind:value={recibido}
					class="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
				/>
				<p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
					Vuelto: <span class="font-semibold">{formatMoneyAR(vuelto)}</span>
				</p>
				{#if faltaDinero}
					<p class="mt-1 text-sm text-red-600 dark:text-red-400">El recibido no alcanza el total.</p>
				{/if}
			{/if}

			<div class="mt-6 flex gap-3">
				<button
					type="button"
					class="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
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
					<span class="ml-1 text-sm font-normal text-emerald-100">Enter</span>
				</button>
			</div>
		</div>
	</div>
{/if}
