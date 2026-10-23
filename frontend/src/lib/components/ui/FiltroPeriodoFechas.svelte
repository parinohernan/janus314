<script lang="ts">
	import FechaCampos from '$lib/components/ui/FechaCampos.svelte';
	import RangosFecha from '$lib/components/ui/RangosFecha.svelte';

	/** Período desde/hasta (fechas locales, mismo criterio que informes/facturacion-neta). */
	export let desde: Date;
	export let hasta: Date;
	export let idPrefix = 'filtro';
	export let label = 'Período';
</script>

<div class="w-full">
	<p class="block text-sm font-medium text-gray-700 mb-2">{label}</p>
	<RangosFecha bind:desde bind:hasta className="mb-3" />
	<div class="flex flex-wrap items-end gap-2">
		<div>
			<label for="{idPrefix}-desde" class="mb-1 block text-xs text-gray-500">Desde</label>
			<FechaCampos id="{idPrefix}-desde" bind:value={desde} ariaLabel="Fecha desde" max={hasta} />
		</div>
		<span class="mb-2 select-none text-gray-300" aria-hidden="true">→</span>
		<div>
			<label for="{idPrefix}-hasta" class="mb-1 block text-xs text-gray-500">Hasta</label>
			<FechaCampos id="{idPrefix}-hasta" bind:value={hasta} ariaLabel="Fecha hasta" min={desde} />
		</div>
	</div>
</div>
