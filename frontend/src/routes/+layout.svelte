<script lang="ts">
	import '../app.css';
	import MainBar from '$lib/components/MainBar.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<MainBar />
	<Navbar />
	
	<main class="flex-grow container mx-auto px-4 py-6">
		<slot />
	</main>
	
	<footer class="bg-gray-800 text-white text-center py-4 text-sm">
		juno314 - sistema de gestión comercial &copy; 2025
	</footer>
</div>
