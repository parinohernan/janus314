<script lang="ts">
	import { auth } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { authConfig } from '$lib/config/auth.config';
	import Button from '$lib/components/ui/Button.svelte';
	
	let usuario = '';
	let password = '';
	let empresa = '';
	let error = '';
	let loading = false;
	
	async function handleSubmit() {
		loading = true;
		error = '';
		
		try {
			const credentials = authConfig.mode === 'online' 
				? { usuario, password, empresa }
				: { usuario, password };
				
			await auth.login(credentials);
			goto('/');
		} catch (e) {
			error = 'Credenciales inválidas';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<img class="mx-auto h-12 w-auto" src="/janus314.png" alt="janus314">
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Iniciar Sesión
			</h2>
		</div>
		
		<form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
			{#if error}
				<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
					<span class="block sm:inline">{error}</span>
				</div>
			{/if}
			
			<div class="rounded-md shadow-sm -space-y-px">
				<div>
					<label for="usuario" class="sr-only">Usuario</label>
					<input
						id="usuario"
						name="usuario"
						type="text"
						required
						bind:value={usuario}
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
						placeholder="Usuario"
					>
				</div>
				<div>
					<label for="password" class="sr-only">Contraseña</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						bind:value={password}
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
						placeholder="Contraseña"
					>
				</div>
				
				{#if authConfig.mode === 'online'}
					<div>
						<label for="empresa" class="sr-only">Empresa</label>
						<input
							id="empresa"
							name="empresa"
							type="text"
							required
							bind:value={empresa}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
							placeholder="ID de Empresa"
						>
					</div>
				{/if}
			</div>
			
			<div>
				<Button
					type="submit"
					variant="primary"
					fullWidth={true}
					disabled={loading}
				>
					{#if loading}
						<span class="absolute left-0 inset-y-0 flex items-center pl-3">
							<div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
						</span>
					{/if}
					Iniciar Sesión
				</Button>
			</div>
		</form>
	</div>
</div> 