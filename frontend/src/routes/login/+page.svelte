<script lang="ts">
	import { auth } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { authConfig } from '$lib/config/auth.config';
	import { PUBLIC_API_URL } from '$env/static/public';
	import Button from '$lib/components/ui/Button.svelte';
	
	let usuario = '';
	let password = '';
	let empresa = '';
	let error = '';
	let exito = '';
	let loading = false;
	let showPassword = false;
	let modoEmpresa = false;
	let modoAsociar = false;
	let pasoAsociar = 1;
	let claveVendedor = '';
	let vendedorCodigo = '';
	
	function abrirAsociar() {
		if (authConfig.mode !== 'online') return;
		modoAsociar = true;
		modoEmpresa = false;
		pasoAsociar = 1;
		error = '';
		exito = '';
		claveVendedor = '';
		vendedorCodigo = '';
		empresa = '';
	}

	function volverAlLogin() {
		modoAsociar = false;
		pasoAsociar = 1;
		error = '';
		claveVendedor = '';
		vendedorCodigo = '';
		empresa = '';
		password = '';
	}

	function avanzarPasoAsociar() {
		error = '';
		if (!usuario.trim() || !password) {
			error = 'Ingresá el usuario y la contraseña que vas a usar para entrar.';
			return;
		}
		if (password.length < 8) {
			error = 'La contraseña nueva debe tener al menos 8 caracteres.';
			return;
		}
		pasoAsociar = 2;
	}

	async function handleSubmit() {
		if (modoAsociar) {
			if (pasoAsociar === 1) {
				avanzarPasoAsociar();
				return;
			}
			await asociarCuenta();
			return;
		}

		loading = true;
		error = '';
		exito = '';
		
		try {
			const credentials = authConfig.mode === 'online'
				? (modoEmpresa
					? { usuario, password, empresa }
					: { usuario, password })
				: { usuario, password };
				
			await auth.login(credentials);
			goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Credenciales inválidas';
			console.error('Error de login:', e);
		} finally {
			loading = false;
		}
	}

	async function asociarCuenta() {
		loading = true;
		error = '';
		exito = '';
		try {
			const response = await fetch(`${PUBLIC_API_URL}${authConfig.endpoints.online.asociar}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					usuario,
					password,
					empresa,
					vendedor: vendedorCodigo,
					clave: claveVendedor
				})
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.error || 'No se pudo asociar el usuario');
			}
			volverAlLogin();
			exito = 'Listo. Ya podés entrar con tu usuario y contraseña.';
		} catch (e) {
			error = e instanceof Error ? e.message : 'No se pudo asociar el usuario';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<button
				type="button"
				class="mx-auto block bg-transparent border-0 p-0 cursor-default"
				on:click={abrirAsociar}
				tabindex="-1"
			>
				<img class="mx-auto h-12 w-auto pointer-events-none" src="/janus314.png" alt="janus314">
			</button>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				{#if modoAsociar}
					{pasoAsociar === 1 ? 'Tu usuario' : 'Tu empresa'}
				{:else}
					Iniciar Sesión
				{/if}
			</h2>
			{#if modoAsociar}
				<p class="mt-2 text-center text-sm text-gray-500">
					{#if pasoAsociar === 1}
						Elegí el usuario y la contraseña con los que vas a entrar de ahora en más.
					{:else}
						Confirmá con el número de vendedor, el de empresa y la clave actual.
					{/if}
				</p>
			{/if}
		</div>
		
		<form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
			{#if error}
				<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
					<span class="block sm:inline">{error}</span>
				</div>
			{/if}
			{#if exito}
				<div class="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded relative" role="alert">
					<span class="block sm:inline">{exito}</span>
				</div>
			{/if}
			
			<div class="rounded-md shadow-sm -space-y-px">
				{#if modoAsociar && pasoAsociar === 2}
					<div>
						<p>Número de vendedor</p>
						<label for="vendedor" class="sr-only">Número de vendedor</label>
						<input
							id="vendedor"
							name="vendedor"
							type="text"
							required
							bind:value={vendedorCodigo}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
							placeholder="Número de vendedor"
						>
					</div>
					<div>
						<p>Número de empresa</p>
						<label for="empresa-asociar" class="sr-only">Número de empresa</label>
						<input
							id="empresa-asociar"
							name="empresa"
							type="text"
							required
							bind:value={empresa}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
							placeholder="Número de empresa"
						>
					</div>
					<div>
						<p>Clave actual</p>
						<label for="clave-vendedor" class="sr-only">Clave actual</label>
						<input
							id="clave-vendedor"
							name="clave"
							type="password"
							required
							bind:value={claveVendedor}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
							placeholder="Clave del vendedor"
						>
					</div>
				{:else}
					{#if authConfig.mode === 'online' && modoEmpresa && !modoAsociar}
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
							autocomplete="username"
							bind:value={usuario}
							class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 {authConfig.mode === 'online' && modoEmpresa && !modoAsociar ? '' : 'rounded-t-md'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
							placeholder={modoAsociar ? 'Usuario nuevo' : 'Usuario'}
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
							autocomplete={modoAsociar ? 'new-password' : 'current-password'}
							bind:value={password}
							class="appearance-none rounded-none relative block w-full px-3 py-2 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
							placeholder={modoAsociar ? 'Contraseña nueva' : 'Contraseña'}
						>
					    <div id="password-toggle" class="absolute inset-y-0 right-0 pr-2 flex items-end">
							<button
								type="button"
								class="pb-2"
								on:click={() => showPassword = !showPassword}
								aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
							>
								{#if showPassword}
									<svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
									</svg>
								{:else}
									<svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
									</svg>
								{/if}
							</button>
					</div>
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
					{#if modoAsociar}
						{pasoAsociar === 1 ? 'Continuar' : 'Crear acceso'}
					{:else}
						Iniciar Sesión
					{/if}
				</Button>
			</div>
			{#if modoAsociar}
				<div class="text-center">
					<button
						type="button"
						class="text-sm font-medium text-blue-600 hover:text-blue-800"
						on:click={() => {
							if (pasoAsociar === 2) {
								pasoAsociar = 1;
								error = '';
							} else {
								volverAlLogin();
							}
						}}
					>
						{pasoAsociar === 2 ? 'Volver' : 'Cancelar'}
					</button>
				</div>
			{:else if authConfig.mode === 'online'}
				<div class="text-center">
					<button
						type="button"
						class="text-sm font-medium text-blue-600 hover:text-blue-800"
						on:click={() => { modoEmpresa = !modoEmpresa; error = ''; }}
					>
						{#if modoEmpresa}
							Volver al acceso con usuario y contraseña
						{:else}
							Acceso con código de empresa
						{/if}
					</button>
				</div>
			{/if}
			{#if !modoAsociar}
				<div class="mt-4 text-center text-sm text-gray-500">
					{#if modoEmpresa}
						Empresa de prueba: <strong>Test S.A.</strong>
						<br>
						código de empresa: <strong>1</strong>
						<br>
						usuario: <strong>1</strong>
						<br>
						contraseña: <strong>1234</strong>
					{:else}
						Si todavía no tenés usuario de acceso, pedilo a Janus o usá el acceso con código de empresa.
					{/if}
				</div>
			{/if}
		</form>
	</div>
</div>
