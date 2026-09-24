<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import { toast } from '$lib/utils/toast';

	export let show = false;
	export let tipo: 'ingreso' | 'egreso' = 'ingreso';
	export let cajaId: number | null = null;
	export let vendedorId = '';

	const MOTIVOS: Record<'ingreso' | 'egreso', string[]> = {
		ingreso: ['Reposición de dinero'],
		egreso: ['Pagos de fletes', 'Pagos de servicios', 'Gastos de caja']
	};

	const dispatch = createEventDispatcher<{ close: void; cambio: void }>();

	let importe = 0;
	let concepto = '';
	let guardando = false;
	let error = '';
	let abiertoAntes = false;

	$: titulo = tipo === 'ingreso' ? 'Ingreso de caja' : 'Egreso de caja';
	$: motivos = MOTIVOS[tipo];

	$: if (show && !abiertoAntes) {
		abiertoAntes = true;
		importe = 0;
		concepto = motivos[0] || '';
		error = '';
	}
	$: if (!show) abiertoAntes = false;

	async function guardar() {
		if (!cajaId || guardando) return;
		const monto = Number(importe);
		if (!monto || monto <= 0) {
			error = 'Ingresá un importe';
			return;
		}
		if (!concepto.trim()) {
			error = 'Elegí o escribí el motivo';
			return;
		}
		guardando = true;
		error = '';
		try {
			const response = await fetchWithAuth('/cajas/movimiento', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					cajaCabezaId: cajaId,
					tipo,
					importe: monto,
					concepto: concepto.trim(),
					metodoPago: 'CO',
					usuarioId: String(vendedorId).replace(/^0+/, '') || vendedorId
				})
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || !data.success) {
				throw new Error(data.message || 'No se pudo registrar el movimiento');
			}
			toast.success(tipo === 'ingreso' ? 'Ingreso registrado' : 'Egreso registrado');
			dispatch('cambio');
			dispatch('close');
		} catch (err) {
			error = err instanceof Error ? err.message : 'No se pudo registrar el movimiento';
		} finally {
			guardando = false;
		}
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
		<form
			class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
			on:submit|preventDefault={guardar}
		>
			<h2 class="text-lg font-semibold text-slate-900">{titulo}</h2>
			<p class="mt-1 text-sm text-slate-500">Se registra en efectivo de esta caja.</p>

			<div class="mt-4 flex flex-wrap gap-2">
				{#each motivos as motivo}
					<button
						type="button"
						class="rounded-full border px-3 py-1.5 text-sm {concepto === motivo
							? 'border-blue-600 bg-blue-50 font-semibold text-blue-800'
							: 'border-slate-200 text-slate-600'}"
						on:click={() => (concepto = motivo)}
					>
						{motivo}
					</button>
				{/each}
			</div>

			<label class="mt-4 block text-sm font-medium text-slate-700" for="pos-mov-motivo">Motivo</label>
			<input
				id="pos-mov-motivo"
				bind:value={concepto}
				maxlength="255"
				class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
			/>

			<label class="mt-4 block text-sm font-medium text-slate-700" for="pos-mov-importe">Importe</label>
			<input
				id="pos-mov-importe"
				type="number"
				min="0.01"
				step="0.01"
				bind:value={importe}
				class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
			/>

			{#if error}
				<p class="mt-3 text-sm text-red-600">{error}</p>
			{/if}

			<div class="mt-6 flex gap-3">
				<button
					type="button"
					class="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-600"
					on:click={() => dispatch('close')}
				>
					Cancelar
				</button>
				<button
					type="submit"
					class="flex-1 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-50 {tipo === 'ingreso'
						? 'bg-emerald-600 hover:bg-emerald-700'
						: 'bg-red-600 hover:bg-red-700'}"
					disabled={guardando}
				>
					{guardando ? 'Guardando...' : 'Registrar'}
				</button>
			</div>
		</form>
	</div>
{/if}
