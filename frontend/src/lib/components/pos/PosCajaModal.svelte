<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import { confirm, toast } from '$lib/utils/toast';
	import { formatMoneyAR } from '$lib/utils/posTicket';

	export let show = false;
	export let cajaId: number | null = null;
	export let vendedorId = '';

	type IngresoTipo = { codigo: string; descripcion: string; importe: number };
	type Resumen = {
		saldoInicial: number;
		totalIngresos: number;
		totalEgresos: number;
		saldoTeorico: number;
		ingresosPorTipo: IngresoTipo[];
	};

	const dispatch = createEventDispatcher<{ close: void; cambio: void }>();

	let loading = false;
	let guardando = false;
	let error = '';
	let resumen: Resumen | null = null;
	let saldoInicial = 0;
	let efectivoFinal = 0;
	let observaciones = '';
	let abiertoAntes = false;

	$: diferencia = Math.round((Number(efectivoFinal || 0) - Number(resumen?.saldoTeorico || 0)) * 100) / 100;
	$: diferenciaLabel =
		diferencia < -0.004 ? 'Faltante' : diferencia > 0.004 ? 'Sobrante' : 'Sin diferencia';

	$: if (show && !abiertoAntes) {
		abiertoAntes = true;
		saldoInicial = 0;
		queueMicrotask(() => cargar());
	}
	$: if (!show) abiertoAntes = false;

	async function cargar() {
		if (!cajaId) {
			resumen = null;
			error = '';
			return;
		}
		loading = true;
		error = '';
		resumen = null;
		try {
			const response = await fetchWithAuth(`/cajas/${cajaId}/resumen`);
			if (!response.ok) throw new Error('No se pudo cargar la caja');
			const data = await response.json();
			if (!data.success) throw new Error(data.message || 'No se pudo cargar la caja');
			resumen = data.data;
			efectivoFinal = Number(data.data?.saldoTeorico) || 0;
			observaciones = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al cargar la caja';
		} finally {
			loading = false;
		}
	}

	function textoCierre() {
		const monto = formatMoneyAR(Math.abs(diferencia));
		const estado = diferenciaLabel === 'Sin diferencia' ? 'Sin diferencia' : `${diferenciaLabel} ${monto}`;
		const nota = observaciones.trim();
		return nota ? `Cierre desde punto de venta. ${estado}. ${nota}` : `Cierre desde punto de venta. ${estado}`;
	}

	async function cerrarCaja() {
		if (!cajaId || !resumen || guardando) return;
		const ok = await confirm('¿Cerrar la caja?', { confirmLabel: 'Cerrar caja', cancelLabel: 'Cancelar' });
		if (!ok) return;
		guardando = true;
		error = '';
		try {
			const response = await fetchWithAuth(`/cajas/${cajaId}/cierre`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					efectivoFinal: Number(efectivoFinal) || 0,
					observaciones: textoCierre(),
					usuarioId: vendedorId
				})
			});
			const data = await response.json();
			if (!response.ok || !data.success) {
				throw new Error(data.message || 'No se pudo cerrar la caja');
			}
			toast.success('Caja cerrada');
			dispatch('cambio');
			dispatch('close');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al cerrar la caja';
		} finally {
			guardando = false;
		}
	}

	async function abrirCaja() {
		if (!vendedorId || guardando) return;
		guardando = true;
		error = '';
		try {
			const response = await fetchWithAuth('/cajas', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					vendedorId,
					saldoInicial: Number(saldoInicial) || 0,
					descripcion: 'Apertura de caja'
				})
			});
			const data = await response.json();
			if (!response.ok || !data.success) {
				throw new Error(data.message || 'No se pudo abrir la caja');
			}
			toast.success('Caja abierta');
			dispatch('cambio');
			dispatch('close');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al abrir la caja';
		} finally {
			guardando = false;
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="presentation"
		on:click|self={() => dispatch('close')}
	>
		<div class="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true">
			<div class="min-h-0 flex-1 overflow-y-auto p-6">
			<h2 class="text-xl font-semibold text-slate-900">{cajaId ? 'Caja abierta' : 'Caja cerrada'}</h2>

			{#if cajaId}
				<p class="mt-1 text-sm text-slate-500">Previsualización de esta caja.</p>

				{#if loading}
					<p class="mt-6 text-sm text-slate-400">Cargando...</p>
				{:else if resumen}
					<div class="mt-5 grid grid-cols-2 gap-3">
						<div class="rounded-xl bg-slate-50 p-3">
							<p class="text-xs uppercase text-slate-500">Saldo inicial</p>
							<p class="text-lg font-semibold">{formatMoneyAR(resumen.saldoInicial)}</p>
						</div>
						<div class="rounded-xl bg-emerald-50 p-3">
							<p class="text-xs uppercase text-emerald-700">Ingresos</p>
							<p class="text-lg font-semibold text-emerald-800">{formatMoneyAR(resumen.totalIngresos)}</p>
						</div>
						<div class="rounded-xl bg-red-50 p-3">
							<p class="text-xs uppercase text-red-700">Egresos</p>
							<p class="text-lg font-semibold text-red-800">{formatMoneyAR(resumen.totalEgresos)}</p>
						</div>
					</div>

					<div class="mt-5">
						<p class="text-sm font-semibold text-slate-700">Ingresos por tipo de pago</p>
						{#if !resumen.ingresosPorTipo?.length}
							<p class="mt-2 text-sm text-slate-500">Todavía no hay ingresos.</p>
						{:else}
							<ul class="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
								{#each resumen.ingresosPorTipo as tipo}
									<li class="flex items-center justify-between px-3 py-2 text-sm">
										<span>{tipo.descripcion}</span>
										<span class="font-semibold tabular-nums">{formatMoneyAR(tipo.importe)}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<div class="mt-5 rounded-xl bg-purple-50 p-3">
						<p class="text-xs uppercase text-purple-700">Saldo teórico</p>
						<p class="text-2xl font-semibold text-purple-800">{formatMoneyAR(resumen.saldoTeorico)}</p>
					</div>

					<label class="mt-5 block text-sm font-medium text-slate-700" for="pos-efectivo-final">Efectivo contado</label>
					<input
						id="pos-efectivo-final"
						type="number"
						min="0"
						step="0.01"
						bind:value={efectivoFinal}
						class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
					/>
					<p
						class="mt-2 text-sm font-semibold {diferenciaLabel === 'Faltante'
							? 'text-red-600'
							: diferenciaLabel === 'Sobrante'
								? 'text-emerald-700'
								: 'text-slate-500'}"
					>
						{diferenciaLabel}
						{#if diferenciaLabel !== 'Sin diferencia'}
							{formatMoneyAR(Math.abs(diferencia))}
						{/if}
					</p>
					<label class="mt-4 block text-sm font-medium text-slate-700" for="pos-obs-cierre">Observaciones</label>
					<textarea
						id="pos-obs-cierre"
						rows="2"
						bind:value={observaciones}
						class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
						placeholder="Opcional"
					></textarea>
				{/if}
			{:else}
				<p class="mt-1 text-sm text-slate-500">Abrí la caja para cobrar en el punto de venta.</p>
				<label class="mt-5 block text-sm font-medium text-slate-700" for="pos-saldo-inicial">Saldo inicial</label>
				<input
					id="pos-saldo-inicial"
					type="number"
					min="0"
					step="0.01"
					bind:value={saldoInicial}
					class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				/>
			{/if}

			</div>

			{#if error}
				<p class="px-6 text-sm text-red-600">{error}</p>
			{/if}

			<div class="flex gap-3 border-t border-slate-100 p-6">
				<button
					type="button"
					class="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-600 hover:bg-slate-50"
					on:click={() => dispatch('close')}
				>
					Volver
				</button>
				{#if cajaId}
					<button
						type="button"
						class="flex-1 rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
						disabled={guardando || loading || !resumen}
						on:click={cerrarCaja}
					>
						{guardando ? 'Cerrando...' : 'Cerrar caja'}
					</button>
				{:else}
					<button
						type="button"
						class="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
						disabled={guardando}
						on:click={abrirCaja}
					>
						{guardando ? 'Abriendo...' : 'Abrir caja'}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
