<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		TAMANOS_POS,
		loadPosPantallaConfig,
		savePosPantallaConfig,
		tamanoSugerido,
		type PosPantallaConfig,
		type PosTamanoPantalla
	} from '$lib/utils/posPantallaConfig';

	const dispatch = createEventDispatcher<{ change: PosPantallaConfig; close: void }>();

	let config: PosPantallaConfig = loadPosPantallaConfig();
	let ancho = 0;
	let alto = 0;

	onMount(() => {
		ancho = window.screen?.width || window.innerWidth;
		alto = window.screen?.height || window.innerHeight;
	});

	$: sugerido = alto ? tamanoSugerido(ancho, alto) : null;

	function actualizar(parcial: Partial<PosPantallaConfig>) {
		config = savePosPantallaConfig(parcial);
		dispatch('change', config);
	}

	function elegirTamano(tamano: PosTamanoPantalla) {
		actualizar({ tamano });
	}
</script>

<p class="text-sm text-slate-500 dark:text-slate-400">
	Se guarda en esta PC y se aplica al instante.
	{#if alto}
		Pantalla detectada: {ancho} × {alto}.
	{/if}
</p>

<p class="mt-5 text-sm font-medium text-slate-700 dark:text-slate-300">Tamaño</p>
<div class="mt-2 grid gap-2" role="radiogroup" aria-label="Tamaño de pantalla">
	{#each TAMANOS_POS as opcion}
		<button
			type="button"
			role="radio"
			aria-checked={config.tamano === opcion.id}
			class="rounded-xl border px-4 py-3 text-left {config.tamano === opcion.id
				? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950'
				: 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'}"
			on:click={() => elegirTamano(opcion.id)}
		>
			<span class="flex items-center justify-between gap-2">
				<span class="font-semibold text-slate-900 dark:text-slate-100">{opcion.titulo}</span>
				{#if sugerido === opcion.id}
					<span
						class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
					>
						Recomendado para tu pantalla ({ancho} × {alto})
					</span>
				{/if}
			</span>
			<span class="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{opcion.detalle}</span>
		</button>
	{/each}
</div>

<label
	class="mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"
>
	<span>
		<span class="block font-semibold text-slate-900 dark:text-slate-100">Modo oscuro</span>
		<span class="block text-sm text-slate-500 dark:text-slate-400">Fondo oscuro para el punto de venta.</span>
	</span>
	<input
		type="checkbox"
		role="switch"
		class="peer sr-only"
		checked={config.oscuro}
		on:change={(e) => actualizar({ oscuro: e.currentTarget.checked })}
	/>
	<span
		class="relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-blue-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300 dark:bg-slate-600"
		aria-hidden="true"
	></span>
</label>

<div class="mt-6 flex justify-end">
	<button
		type="button"
		class="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
		on:click={() => dispatch('close')}
	>
		Listo
	</button>
</div>
