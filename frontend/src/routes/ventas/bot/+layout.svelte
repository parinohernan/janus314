<script lang="ts">
	// Este layout está diseñado específicamente para las páginas de la aplicación de Telegram
	// No incluye barra principal, navbar ni footer

	// Importaciones necesarias
	import '../../../app.css';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { navigationState } from '$lib/stores/navigationState';
	
	let { children } = $props();
	
	beforeNavigate(({ from, to, cancel }) => {
		if (from) {
			// Guardar posición de scroll antes de navegar
			navigationState.saveState(from.url.pathname, {
				scroll: window.scrollY
			});
		}
	});
	
	afterNavigate(({ to }) => {
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

<div class="telegram-app min-h-screen">
	<main>
		{@render children()}
	</main>
</div>

<style>
	.telegram-app {
		/* Estilos específicos para la app de Telegram si son necesarios */
		width: 100%;
		max-width: 100%;
		padding: 0;
		margin: 0;
		overflow-x: hidden;
	}
	
	main {
		width: 100%;
	}
</style> 