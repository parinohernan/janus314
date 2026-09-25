<script lang="ts">
	import FechaCampos from '$lib/components/ui/FechaCampos.svelte';

	export let value: Date = new Date();
	export let id: string = '';
	export let disabled = false;
	export let min: Date | undefined = undefined;
	export let max: Date | undefined = undefined;
</script>

<FechaCampos bind:value {id} {disabled} {min} {max} className="w-full" on:change />
