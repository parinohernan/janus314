<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { adminAuth } from '$lib/stores/adminAuthStore';
	import { PUBLIC_API_URL } from '$env/static/public';
	import Button from '$lib/components/ui/Button.svelte';

	type Empresa = { id: string; nombre: string; estado: string };
	type Vendedor = { Codigo: string; Descripcion: string; Activo: number; Permisos: string };
	type Cuenta = {
		id: string;
		usuario: string;
		empresa_id: string;
		vendedor_codigo: string;
		activo: boolean;
		ultimo_acceso: string | null;
		empresa?: Empresa;
	};

	let cuentas: Cuenta[] = [];
	let empresas: Empresa[] = [];
	let vendedores: Vendedor[] = [];
	let loading = true;
	let error = '';
	let mensaje = '';

	let usuario = '';
	let password = '';
	let empresaId = '';
	let vendedorCodigo = '';
	let guardando = false;

	let resetId = '';
	let resetPassword = '';

	function authHeaders(): HeadersInit {
		const token = adminAuth.getToken();
		return {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		};
	}

	async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
		const response = await fetch(`${PUBLIC_API_URL}${path}`, {
			...options,
			headers: { ...authHeaders(), ...(options.headers || {}) }
		});
		const data = await response.json().catch(() => ({}));
		if (response.status === 401 || response.status === 403) {
			adminAuth.logout();
			goto('/admin/login');
			throw new Error(data.error || 'Sesión de administrador inválida');
		}
		if (!response.ok) {
			throw new Error(data.error || 'Error en la solicitud');
		}
		return data as T;
	}

	async function cargar() {
		loading = true;
		error = '';
		try {
			const [cuentasRes, empresasRes] = await Promise.all([
				api<{ data: Cuenta[] }>('/admin/cuentas'),
				api<{ data: Empresa[] }>('/admin/empresas')
			]);
			cuentas = cuentasRes.data || [];
			empresas = empresasRes.data || [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'No se pudieron cargar las cuentas';
		} finally {
			loading = false;
		}
	}

	async function cargarVendedores() {
		vendedores = [];
		vendedorCodigo = '';
		if (!empresaId) return;
		try {
			const res = await api<{ data: Vendedor[] }>(`/admin/empresas/${empresaId}/vendedores`);
			vendedores = res.data || [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'No se pudieron cargar los vendedores';
		}
	}

	async function crearCuenta() {
		guardando = true;
		error = '';
		mensaje = '';
		try {
			await api('/admin/cuentas', {
				method: 'POST',
				body: JSON.stringify({
					usuario,
					password,
					empresa_id: empresaId,
					vendedor_codigo: vendedorCodigo
				})
			});
			usuario = '';
			password = '';
			empresaId = '';
			vendedorCodigo = '';
			vendedores = [];
			mensaje = 'Cuenta creada';
			await cargar();
		} catch (e) {
			error = e instanceof Error ? e.message : 'No se pudo crear la cuenta';
		} finally {
			guardando = false;
		}
	}

	async function toggleActivo(cuenta: Cuenta) {
		error = '';
		try {
			await api(`/admin/cuentas/${cuenta.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ activo: !cuenta.activo })
			});
			await cargar();
		} catch (e) {
			error = e instanceof Error ? e.message : 'No se pudo actualizar la cuenta';
		}
	}

	async function resetearPassword(cuentaId: string) {
		if (!resetPassword || resetPassword.length < 8) {
			error = 'La contraseña nueva debe tener al menos 8 caracteres';
			return;
		}
		error = '';
		try {
			await api(`/admin/cuentas/${cuentaId}`, {
				method: 'PATCH',
				body: JSON.stringify({ password: resetPassword })
			});
			resetId = '';
			resetPassword = '';
			mensaje = 'Contraseña actualizada';
		} catch (e) {
			error = e instanceof Error ? e.message : 'No se pudo actualizar la contraseña';
		}
	}

	function salir() {
		adminAuth.logout();
		goto('/admin/login');
	}

	onMount(() => {
		if (!adminAuth.hydrate()) {
			goto('/admin/login');
			return;
		}
		cargar();
	});
</script>

<div class="min-h-screen bg-slate-100">
	<header class="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
		<div>
			<h1 class="text-lg font-semibold">Cuentas de acceso</h1>
			<p class="text-xs text-slate-300">Usuario y contraseña hasheada → empresa + vendedor</p>
		</div>
		<Button type="button" variant="secondary" size="sm" on:click={salir}>Cerrar sesión</Button>
	</header>

	<main class="max-w-5xl mx-auto p-6 space-y-8">
		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
		{/if}
		{#if mensaje}
			<div class="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded">{mensaje}</div>
		{/if}

		<section class="bg-white rounded shadow p-6">
			<h2 class="text-lg font-medium mb-4">Nueva cuenta</h2>
			<form class="grid grid-cols-1 md:grid-cols-2 gap-4" on:submit|preventDefault={crearCuenta}>
				<div>
					<label class="block text-sm font-medium text-gray-700" for="nuevo-usuario">Usuario</label>
					<input id="nuevo-usuario" class="mt-1 w-full border rounded px-3 py-2 text-sm" bind:value={usuario} required>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700" for="nuevo-password">Contraseña</label>
					<input id="nuevo-password" type="password" minlength="8" class="mt-1 w-full border rounded px-3 py-2 text-sm" bind:value={password} required>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700" for="nueva-empresa">Empresa</label>
					<select id="nueva-empresa" class="mt-1 w-full border rounded px-3 py-2 text-sm" bind:value={empresaId} on:change={cargarVendedores} required>
						<option value="">Elegí una empresa</option>
						{#each empresas as emp}
							<option value={emp.id}>{emp.nombre} ({emp.id})</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700" for="nuevo-vendedor">Vendedor</label>
					<select id="nuevo-vendedor" class="mt-1 w-full border rounded px-3 py-2 text-sm" bind:value={vendedorCodigo} required disabled={!vendedores.length}>
						<option value="">Elegí un vendedor</option>
						{#each vendedores as vend}
							<option value={vend.Codigo}>{vend.Descripcion} ({vend.Codigo})</option>
						{/each}
					</select>
				</div>
				<div class="md:col-span-2">
					<Button type="submit" variant="primary" disabled={guardando}>
						{guardando ? 'Creando…' : 'Crear cuenta'}
					</Button>
				</div>
			</form>
		</section>

		<section class="bg-white rounded shadow p-6">
			<h2 class="text-lg font-medium mb-4">Cuentas</h2>
			{#if loading}
				<p class="text-sm text-gray-500">Cargando…</p>
			{:else if cuentas.length === 0}
				<p class="text-sm text-gray-500">No hay cuentas todavía.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full text-sm">
						<thead>
							<tr class="text-left border-b">
								<th class="py-2 pr-3">Usuario</th>
								<th class="py-2 pr-3">Empresa</th>
								<th class="py-2 pr-3">Vendedor</th>
								<th class="py-2 pr-3">Estado</th>
								<th class="py-2 pr-3">Último acceso</th>
								<th class="py-2">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{#each cuentas as cuenta}
								<tr class="border-b">
									<td class="py-2 pr-3 font-medium">{cuenta.usuario}</td>
									<td class="py-2 pr-3">{cuenta.empresa?.nombre || cuenta.empresa_id}</td>
									<td class="py-2 pr-3">{cuenta.vendedor_codigo}</td>
									<td class="py-2 pr-3">{cuenta.activo ? 'Activa' : 'Inactiva'}</td>
									<td class="py-2 pr-3">{cuenta.ultimo_acceso ? new Date(cuenta.ultimo_acceso).toLocaleString() : '—'}</td>
									<td class="py-2 space-y-2">
										<Button type="button" size="sm" variant="secondary" on:click={() => toggleActivo(cuenta)}>
											{cuenta.activo ? 'Desactivar' : 'Activar'}
										</Button>
										{#if resetId === cuenta.id}
											<div class="flex gap-2 items-center">
												<input type="password" minlength="8" placeholder="Nueva contraseña" class="border rounded px-2 py-1" bind:value={resetPassword}>
												<Button type="button" size="sm" variant="primary" on:click={() => resetearPassword(cuenta.id)}>Guardar</Button>
												<Button type="button" size="sm" variant="secondary" on:click={() => { resetId = ''; resetPassword = ''; }}>Cancelar</Button>
											</div>
										{:else}
											<Button type="button" size="sm" variant="secondary" on:click={() => { resetId = cuenta.id; resetPassword = ''; }}>Reset password</Button>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
	</main>
</div>
