<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import AdminBar from '$lib/components/AdminBar.svelte';
	let { children } = $props();
</script>

<Navbar />
<slot />
<AdminBar />
