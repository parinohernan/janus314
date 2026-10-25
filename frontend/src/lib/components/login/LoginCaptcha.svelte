<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { authConfig } from '$lib/config/auth.config';

	interface Props {
		captchaId: string;
		captchaAnswer: string;
		question: string;
		loading?: boolean;
		onRefresh?: () => void;
	}

	let {
		captchaId = $bindable(''),
		captchaAnswer = $bindable(''),
		question = $bindable(''),
		loading = false,
		onRefresh
	}: Props = $props();

	let fetchError = $state('');

	export async function loadChallenge() {
		fetchError = '';
		if (authConfig.mode !== 'online') {
			return;
		}
		try {
			const response = await fetch(`${PUBLIC_API_URL}/auth/captcha-challenge`);
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.error || 'No se pudo cargar la verificación');
			}
			captchaId = data.captchaId ?? '';
			question = data.question ?? '';
			captchaAnswer = '';
		} catch (e) {
			fetchError = e instanceof Error ? e.message : 'Error al cargar verificación';
			captchaId = '';
			question = '';
		}
	}

	onMount(() => {
		if (question) return;
		void loadChallenge();
	});

	function handleRefresh() {
		if (onRefresh) {
			onRefresh();
		} else {
			void loadChallenge();
		}
	}
</script>

<div class="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 space-y-3">
	<p class="text-sm font-medium text-amber-900">Verificación de seguridad</p>
	<p class="text-xs text-amber-800">
		Tras varios intentos fallidos, confirmá que no sos un robot.
	</p>
	{#if fetchError}
		<p class="text-sm text-red-700" role="alert">{fetchError}</p>
	{/if}
	{#if question}
		<label for="captcha-answer" class="block text-sm text-gray-800">{question}</label>
		<div class="flex gap-2">
			<input
				id="captcha-answer"
				name="captchaAnswer"
				type="text"
				inputmode="numeric"
				autocomplete="off"
				required
				disabled={loading}
				bind:value={captchaAnswer}
				class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				placeholder="Respuesta"
			/>
			<button
				type="button"
				class="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				disabled={loading}
				onclick={handleRefresh}
			>
				Otra
			</button>
		</div>
	{:else if !fetchError}
		<div class="flex items-center gap-2 text-sm text-gray-600">
			<div class="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"></div>
			Cargando…
		</div>
	{/if}
</div>
