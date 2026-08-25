<script lang="ts">
	import { adminAuth } from '$lib/stores/adminAuthStore';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';

	let usuario = '';
	let password = '';
	let error = '';
	let loading = false;
	let showPassword = false;

	async function handleSubmit() {
		loading = true;
		error = '';
		try {
			await adminAuth.login(usuario, password);
			goto('/admin/cuentas');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Credenciales inválidas';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4">
	<div class="max-w-md w-full space-y-8 bg-white rounded-lg p-8 shadow">
		<div>
			<img class="mx-auto h-12 w-auto" src="/janus314.png" alt="janus314">
			<h2 class="mt-6 text-center text-2xl font-bold text-gray-900">
				Administración Janus
			</h2>
			<p class="mt-2 text-center text-sm text-gray-500">
				Acceso de operador. No es el login de una empresa.
			</p>
		</div>

		<form class="space-y-4" on:submit|preventDefault={handleSubmit}>
			{#if error}
				<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			{/if}

			<div>
				<label for="usuario" class="block text-sm font-medium text-gray-700">Usuario</label>
				<input
					id="usuario"
					type="text"
					required
					autocomplete="username"
					bind:value={usuario}
					class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
				>
			</div>
			<div>
				<label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
				<div class="relative mt-1">
					<input
						id="password"
						type={showPassword ? 'text' : 'password'}
						required
						autocomplete="current-password"
						bind:value={password}
						class="block w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
					>
					<button
						type="button"
						class="absolute inset-y-0 right-0 px-3 text-gray-400"
						on:click={() => showPassword = !showPassword}
					>
						{showPassword ? 'Ocultar' : 'Ver'}
					</button>
				</div>
			</div>
			<Button type="submit" variant="primary" fullWidth={true} disabled={loading}>
				{loading ? 'Ingresando…' : 'Ingresar'}
			</Button>
		</form>
	</div>
</div>
