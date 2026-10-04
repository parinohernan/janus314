<script context="module" lang="ts">
	export type PestanaConfig = 'impresora' | 'pantalla';
</script>

<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import type { PosPrinterConfig } from '$lib/utils/posPrinterConfig';
	import type { PosPantallaConfig } from '$lib/utils/posPantallaConfig';
	import PosPrinterSettings from './PosPrinterSettings.svelte';
	import PosPantallaSettings from './PosPantallaSettings.svelte';

	export let show = false;
	export let pestana: PestanaConfig = 'impresora';

	const dispatch = createEventDispatcher<{
		close: void;
		saved: PosPrinterConfig;
		pantalla: PosPantallaConfig;
	}>();

	const PESTANAS: { id: PestanaConfig; label: string }[] = [
		{ id: 'impresora', label: 'Impresora' },
		{ id: 'pantalla', label: 'Pantalla' }
	];

	let dialogo: HTMLDivElement | null = null;
	let abiertoAntes = false;

	$: if (show && !abiertoAntes) {
		abiertoAntes = true;
		void tick().then(() => dialogo?.focus());
	}
	$: if (!show) abiertoAntes = false;

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			dispatch('close');
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="presentation"
		on:click|self={() => dispatch('close')}
		on:keydown={onKeyDown}
	>
		<div
			bind:this={dialogo}
			class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl outline-none dark:bg-slate-900"
			role="dialog"
			aria-modal="true"
			aria-labelledby="pos-config-title"
			tabindex="-1"
		>
			<h2 id="pos-config-title" class="text-xl font-semibold text-slate-900 dark:text-slate-100">
				Configuración de esta caja
			</h2>

			<div class="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist">
				{#each PESTANAS as item}
					<button
						type="button"
						role="tab"
						aria-selected={pestana === item.id}
						class="flex-1 rounded-lg px-3 py-2 text-sm font-semibold {pestana === item.id
							? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-slate-100'
							: 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}"
						on:click={() => (pestana = item.id)}
					>
						{item.label}
					</button>
				{/each}
			</div>

			<div class="mt-5" role="tabpanel">
				{#if pestana === 'impresora'}
					<PosPrinterSettings
						on:saved={(e) => dispatch('saved', e.detail)}
						on:close={() => dispatch('close')}
					/>
				{:else}
					<PosPantallaSettings
						on:change={(e) => dispatch('pantalla', e.detail)}
						on:close={() => dispatch('close')}
					/>
				{/if}
			</div>
		</div>
	</div>
{/if}
