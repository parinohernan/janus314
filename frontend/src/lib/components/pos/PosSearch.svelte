<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { ScanBarcode, Search } from 'lucide-svelte';

	export let disabled = false;
	export let flashOk = false;

	const dispatch = createEventDispatcher<{
		submit: string;
		focus: void;
		buscar: void;
	}>();

	let inputEl: HTMLInputElement;
	let valor = '';

	export function focusInput() {
		inputEl?.focus();
		inputEl?.select();
	}

	export function blurInput() {
		inputEl?.blur();
	}

	export function tieneTexto() {
		return valor.trim().length > 0;
	}

	export function clear() {
		valor = '';
	}

	onMount(() => {
		focusInput();
	});

	function confirmar() {
		const code = valor.trim();
		if (!code || disabled) return;
		dispatch('submit', code);
		valor = '';
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			confirmar();
		}
	}
</script>

<div class="flex min-w-0 flex-1 items-center gap-2">
	<div class="relative min-w-0 flex-1">
		<ScanBarcode class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-200" />
		<input
			bind:this={inputEl}
			bind:value={valor}
			{disabled}
			class="h-12 w-full rounded-xl border-0 bg-white/15 pl-11 pr-4 text-lg text-white placeholder:text-blue-100/70 shadow-inner outline-none ring-2 ring-transparent focus:bg-white/20 focus:ring-blue-200 {flashOk
				? 'ring-emerald-300'
				: ''}"
			placeholder="Escaneá o escribí el código y Enter"
			autocomplete="off"
			inputmode="numeric"
			aria-label="Código de barras o código de artículo"
			on:keydown={onKeyDown}
			on:focus={() => dispatch('focus')}
		/>
	</div>
	<button
		type="button"
		class="flex h-12 shrink-0 items-center gap-1 rounded-xl bg-white/15 px-3 text-white hover:bg-white/25 disabled:opacity-50"
		{disabled}
		title="Buscar por descripción (F2)"
		aria-label="Buscar por descripción"
		on:click={() => dispatch('buscar')}
	>
		<Search class="h-5 w-5" />
		<span class="hidden text-xs font-medium text-blue-100 sm:inline">F2</span>
	</button>
</div>
