<script lang="ts">
	import '../app.css';
	import MainBar from '$lib/components/MainBar.svelte';
	import Toaster from '$lib/components/Toaster.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { navigationState } from '$lib/stores/navigationState';
	import { auth } from '$lib/stores/authStore';
	import { sidebarCollapsed } from '$lib/stores/sidebarStore';
	import { tabsStore } from '$lib/stores/tabsStore';
	import { getLabelFromUrl, getIconFromUrl } from '$lib/utils/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	
	// Margen izquierdo basado en el estado del sidebar
	let leftMargin = $derived(!$page.url.pathname.includes('/ventas/bot/') 
		? ($sidebarCollapsed ? 'ml-16' : 'ml-60')
		: '');
	
	let { children } = $props();
	let isLoading = $state(true);
	
	// Detectar si estamos en la miniweb de Telegram
	let esMiniWebTelegram = $derived($page.url.pathname.includes('/ventas/bot/'));
	
	onMount(async () => {
		// Solo verificar autenticación si no estamos en una ruta del bot
		if (!esMiniWebTelegram) {
			const isAuthenticated = await auth.verifySession();
			if (!isAuthenticated && $page.url.pathname !== '/login') {
				goto('/login');
			}
		} else {
			// Si es una ruta del bot y no hay token, configurar uno temporal
			if (typeof localStorage !== 'undefined' && !localStorage.getItem('authToken')) {
				localStorage.setItem('authToken', 'bot-telegram-token-temporal');
			}
		}
		isLoading = false;
	});
	
	// Effect para manejar cambios en la autenticación
	$effect(() => {
		if (browser && !isLoading && !esMiniWebTelegram) {
			const token = localStorage.getItem('authToken');
			if (!$auth.isAuthenticated && token && $page.url.pathname !== '/login') {
				// Si hay token pero no está autenticado, verificar la sesión
				auth.verifySession();
			} else if (!$auth.isAuthenticated && !token && $page.url.pathname !== '/login') {
				// Si no hay token y no está autenticado, redirigir a login
				goto('/login');
			}
		}
	});
	
	beforeNavigate(({ from, to, cancel }) => {
		if (from) {
			// Fusionar con estado existente para no sobrescribir filtros/datos de páginas hijas
			const currentState = navigationState.getState(from.url.pathname) || {};
			navigationState.saveState(from.url.pathname, {
				...currentState,
				scroll: window.scrollY
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
			
			// Crear tab automáticamente para la página actual (excepto login y bot)
			if (browser && !to.url.pathname.includes('/ventas/bot/') && to.url.pathname !== '/login' && to.url.pathname !== '/') {
				const label = getLabelFromUrl(to.url.pathname);
				const icon = getIconFromUrl(to.url.pathname);
				
				// Determinar el tipo de tab basado en la URL
				let type: 'view' | 'edit' | 'create' = 'view';
				if (to.url.pathname.includes('/nueva') || to.url.pathname.includes('/nuevo')) {
					type = 'create';
				} else if (to.url.pathname.includes('/editar') || to.url.pathname.match(/\/[^/]+\/[a-zA-Z0-9-]+$/)) {
					type = 'edit';
				}
				
				tabsStore.openTab({
					url: to.url.pathname,
					label,
					icon,
					type
				});
			}
		}
	});
</script>

{#if isLoading}
	<div class="flex items-center justify-center h-screen">
		<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
	</div>
{:else}
	<Toaster />
	<div class="min-h-screen flex flex-col">
		{#if !$page.url.pathname.includes('/ventas/bot/')}
			<MainBar />
			<TabBar />
			<Sidebar />
		{/if}
		<main class="flex-grow container mx-auto px-4 py-6 transition-all duration-300 {leftMargin}">
			{@render children()}
		</main>
		{#if !$page.url.pathname.includes('/ventas/bot/')}
			<footer class="bg-gray-800 text-white text-center py-4 text-sm transition-all duration-300 {leftMargin}">
				<div class="flex items-center justify-center">
					<img src="/janus314.png" alt="janus314" class="w-10 h-10">
					<span>janus314 - sistema de gestión comercial &copy; 2025 - Hernan Parino - v1.0.3</span>
					<img src="/janus314.png" alt="janus314" class="w-10 h-10">
				</div>
			</footer>
		{/if}
	</div>
{/if}
