<script lang="ts">
	// Este layout está diseñado específicamente para las páginas de la aplicación de Telegram
	// No incluye barra principal, navbar ni footer

	// Importaciones necesarias
	import '../../../app.css';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { navigationState } from '$lib/stores/navigationState';
	import './components/bot.css';
	import './components/mobile-fix.css';
	
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

<svelte:head>
	<!-- Meta etiquetas para mejorar la experiencia en dispositivos móviles -->
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="mobile-web-app-capable" content="yes" />
</svelte:head>

<div class="mobile-app-container">
	<div class="telegram-app min-h-screen">
		<main>
			<slot />
		</main>
	</div>
</div>

<style>
	.mobile-app-container {
		width: 100%;
		min-height: 100vh;
		display: flex;
		justify-content: center;
		background-color: #f5f7fa;
	}

	.telegram-app {
		/* Estilos específicos para la app de Telegram si son necesarios */
		width: 100%;
		max-width: 100%;
		padding: 0;
		margin: 0;
		overflow-x: hidden;
		background-color: #fff;
	}
	
	main {
		width: 100%;
	}

	:global(body) {
		background-color: #f5f7fa;
		overflow-x: hidden;
		position: relative;
		width: 100%;
		max-width: 100vw;
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}
	
	:global(.telegram-webapp) {
		max-width: 450px;
		margin: 0 auto;
		min-height: 100vh;
		box-sizing: border-box;
		/* Añadir borde solo en desktop */
		@media (min-width: 768px) {
			border-left: 1px solid rgba(0, 0, 0, 0.05);
			border-right: 1px solid rgba(0, 0, 0, 0.05);
		}
	}
</style> 