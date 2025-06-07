<script lang="ts">
	import { auth } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { authConfig } from '$lib/config/auth.config';
	import Button from '$lib/components/ui/Button.svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import type { Usuario } from '$lib/types/usuario.types';
	
	let usuario = '';
	let password = '';
	let empresa = '1'; // Valor predeterminado para facilitar el inicio de sesión
	let error = '';
	let loading = false;
	let isAuthenticated = false;
	let userData: Usuario | null = null;
	
	onMount(async () => {
		const authState = get(auth);
		isAuthenticated = authState.isAuthenticated;
		userData = authState.user;
		if (!isAuthenticated) {
			await auth.verifySession();
			const newAuthState = get(auth);
			isAuthenticated = newAuthState.isAuthenticated;
			userData = newAuthState.user;
		}
	});
	
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
			console.error('Error de login:', e);
		} finally {
			loading = false;
		}
	}

	async function handleLogout() {
		try {
			await auth.logout();
			isAuthenticated = false;
			userData = null;
		} catch (e) {
			console.error('Error al cerrar sesión:', e);
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<img class="mx-auto h-12 w-auto" src="/janus314.png" alt="janus314">
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				{#if isAuthenticated}
					Usuario Logueado
				{:else}
					Iniciar Sesión
				{/if}
			</h2>
		</div>
		
		{#if isAuthenticated && userData}
			<div class="bg-white shadow rounded-lg p-6 space-y-4">
				<div class="text-center">
					<p class="text-xl font-semibold text-gray-800">{userData.nombre} {userData.apellido}</p>
					<p class="text-gray-600">Usuario: {userData.usuario}</p>
					{#if userData.empresa}
						<p class="text-gray-600">Empresa: {userData.empresa.nombre}</p>
					{/if}
				</div>
				<div class="flex justify-center">
					<button
						class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						on:click={handleLogout}
					>
						Cerrar Sesión
					</button>
				</div>
			</div>
		{:else}
			<form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
				{#if error}
					<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
						<span class="block sm:inline">{error}</span>
					</div>
				{/if}
				
				<div class="rounded-md shadow-sm -space-y-px">
					{#if authConfig.mode === 'online'}
						<div>
							<p>Empresa</p>
							<label for="empresa" class="sr-only">Empresa</label>
							<input
								id="empresa"
								name="empresa"
								type="text"
								required
								bind:value={empresa}
								class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
								placeholder="Código de Empresa"
							>
						</div>
					{/if}
					<div>
						<p>Usuario</p>
						<label for="usuario" class="sr-only">Usuario</label>
						<input
							id="usuario"
							name="usuario"
							type="text"
							required
							bind:value={usuario}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 {authConfig.mode === 'online' ? '' : 'rounded-t-md'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
							placeholder="Usuario"
						>
					</div>
					<div>
						<p>Contraseña</p>
						<label for="password" class="sr-only">Contraseña</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							bind:value={password}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
							placeholder="Contraseña"
						>
					</div>
				</div>
				
				<div>
					<button
						type="submit"
						disabled={loading}
						class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
					>
						{#if loading}
							<span class="absolute left-0 inset-y-0 flex items-center pl-3">
								<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							</span>
							Iniciando sesión...
						{:else}
							Iniciar Sesión
						{/if}
					</button>
				</div>
				<div class="mt-4 text-center text-sm text-gray-500">
					<br>
					Puedes usar la empresa de prueba: <strong>Test S.A.</strong>
					<br>
					usa el código de empresa: <strong>1</strong>
					<br>
					usa el usuario: <strong>1</strong>
					<br>
					usa la contraseña: <strong>1234</strong>
					<br>
					<a href="/register" class="font-medium text-blue-500 hover:text-blue-700">
						¿No tienes una cuenta? Regístrate
					</a>
				</div>
			</form>
		{/if}
	</div>
</div> 