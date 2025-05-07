<script lang="ts">
	import '../app.css';
	import MainBar from '$lib/components/MainBar.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { navigationState } from '$lib/stores/navigationState';
	import { auth } from '$lib/stores/authStore';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	
	let { children } = $props();
	let isLoading = $state(true);
	
	// Detectar si estamos en la miniweb de Telegram
	let esMiniWebTelegram = $derived($page.url.pathname.includes('/ventas/bot/'));
	
	onMount(async () => {
		const isAuthenticated = await auth.verifySession();
		if (!isAuthenticated && $page.url.pathname !== '/login') {
			goto('/login');
		}
		isLoading = false;
	});
	
	beforeNavigate(({ from, to, cancel }) => {
		if (from) {
			// Guardar posición de scroll antes de navegar
			navigationState.saveState(from.url.pathname, {
				scroll: window.scrollY
				// Los componentes añadirán su estado de paginación/filtros
			});
		}
	});
	
	afterNavigate(({ from, to }) => {
		// Obtener estado guardado
		if (to) {
			const savedState = navigationState.getState(to.url.pathname);
			
			if (savedState?.scroll !== undefined) {
				// Restaurar posición de scroll
				setTimeout(() => {
					window.scrollTo(0, savedState.scroll);
				}, 0);
			} else {
				// Si es una página nueva, ir al inicio
				window.scrollTo(0, 0);
			}
		}
	});
</script>

{#if isLoading}
	<div class="flex items-center justify-center h-screen">
		<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
	</div>
{:else}
	<div class="min-h-screen flex flex-col">
		{#if !$page.url.pathname.includes('/ventas/bot/')}
			<MainBar />
			<Navbar />
		{/if}
		<main class="flex-grow container mx-auto px-4 py-6">
			{@render children()}
		</main>
		{#if !$page.url.pathname.includes('/ventas/bot/')}
			<footer class="bg-gray-800 text-white text-center py-4 text-sm">
				<div class="flex items-center justify-center">
					<img src="/janus314.png" alt="janus314" class="w-10 h-10 rotate-180">
					<span>janus314 - sistema de gestión comercial &copy; 2025</span>
					<img src="/janus314.png" alt="janus314" class="w-10 h-10">
				</div>
			</footer>
		{/if}
	</div>
{/if}
