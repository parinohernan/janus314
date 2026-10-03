<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { devOptions } from '$lib/stores/devOptionsStore';

	let { children } = $props();
	let permitido = $state(false);

	onMount(() => {
		devOptions.hydrate();
		if (!get(devOptions)) {
			goto('/');
			return;
		}
		permitido = true;
	});
</script>

{#if permitido}
	{@render children()}
{/if}
