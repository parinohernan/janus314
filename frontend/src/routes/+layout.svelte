<script lang="ts">
	import '../app.css';
	import MainBar from '$lib/components/MainBar.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { navigationState } from '$lib/stores/navigationState';
	
	let { children } = $props();
	
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

<div class="min-h-screen flex flex-col">
	<MainBar />
	<Navbar />
	
	<main class="flex-grow container mx-auto px-4 py-6">
		{@render children()}
	</main>
	
	<footer class="bg-gray-800 text-white text-center py-4 text-sm">
		juno314 - sistema de gestión comercial &copy; 2025
	</footer>
</div>
