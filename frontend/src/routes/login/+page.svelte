<script lang="ts">
	import { auth } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { authConfig } from '$lib/config/auth.config';
	import Button from '$lib/components/ui/Button.svelte';
	
	let usuario = '';
	let password = '';
	let empresa = '1'; // Valor predeterminado para facilitar el inicio de sesión
	let error = '';
	let loading = false;
	let showPassword = false;
	
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
				<div class="relative">
					<p>Contraseña</p>
					<label for="password" class="sr-only">Contraseña</label>
					<input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						required
						bind:value={password}
						class="appearance-none rounded-none relative block w-full px-3 py-2 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
						placeholder="Contraseña"
					>
				    <div id="password-toggle" class="absolute inset-y-0 right-0 pr-2 flex items-end">
						<button
							type="button"
							class="pb-2"
							on:click={() => showPassword = !showPassword}
							aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
						>
							{#if showPassword}
								<!-- Icono de ojo tachado (ocultar) -->
								<svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
								</svg>
							{:else}
								<!-- Icono de ojo (mostrar) -->
								<svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							{/if}
						</button>
				</div>
				</div>
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
	</div>
</div> 