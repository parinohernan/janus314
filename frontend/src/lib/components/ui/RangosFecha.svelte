<script lang="ts">
	import {
		PRESETS_RANGO_FECHA,
		idRangoActivo,
		rangoFecha,
		type IdRangoFecha
	} from '$lib/utils/rangosFecha';

	export let desde: Date;
	export let hasta: Date;
	export let ids: IdRangoFecha[] = PRESETS_RANGO_FECHA.map((preset) => preset.id);
	export let disabled = false;
	export let className = '';

	$: presets = PRESETS_RANGO_FECHA.filter((preset) => ids.includes(preset.id));
	$: activo = idRangoActivo(desde, hasta, new Date(), ids);

	function aplicar(id: IdRangoFecha) {
		const rango = rangoFecha(id);
		desde = rango.desde;
		hasta = rango.hasta;
	}
</script>

<div
	class="inline-flex flex-wrap gap-0.5 rounded-lg bg-gray-100 p-0.5 {className}"
	role="group"
	aria-label="Períodos rápidos"
>
	{#each presets as preset}
		<button
			type="button"
			{disabled}
			class="rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors
				{activo === preset.id
				? 'bg-white text-indigo-700 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}
				disabled:cursor-not-allowed disabled:opacity-50"
			aria-pressed={activo === preset.id}
			on:click={() => aplicar(preset.id)}
		>
			{preset.label}
		</button>
	{/each}
</div>
