<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/authStore';
	import Button from '$lib/components/ui/Button.svelte';
	import { confirm } from '$lib/utils/toast';
	import {
		esVendedorSuperadm,
		puedeGestionarBackups
	} from '$lib/utils/permisos';
	import { BackupService, type BackupItem, type BackupJob } from '$lib/services/BackupService';

	let mensaje = $state('');
	let mensajeTipo = $state<'success' | 'error'>('success');
	let cargando = $state(true);
	let ejecutando = $state<string | null>(null);
	let jobEstado = $state<BackupJob | null>(null);
	let backups = $state<BackupItem[]>([]);
	let confirmName = $state('');
	let backupElegido = $state('');
	let archivoSubida = $state<FileList | null>(null);

	const puedeEntrar = $derived(puedeGestionarBackups($auth?.user));
	const esSuperadm = $derived(esVendedorSuperadm($auth?.user));
	const nombreEmpresa = $derived($auth?.empresa?.nombre || '');

	onMount(async () => {
		if (!puedeGestionarBackups($auth?.user)) {
			goto('/configuracion');
			return;
		}
		await cargarListado();
	});

	function mostrarMensaje(msg: string, tipo: 'success' | 'error') {
		mensaje = msg;
		mensajeTipo = tipo;
		setTimeout(() => {
			mensaje = '';
		}, 8000);
	}

	function formatoBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatoFecha(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleString('es-AR');
	}

	async function cargarListado() {
		try {
			cargando = true;
			backups = await BackupService.listar();
		} catch (e) {
			mostrarMensaje(e instanceof Error ? e.message : 'Error al listar backups', 'error');
		} finally {
			cargando = false;
		}
	}

	async function seguirJob(job: BackupJob) {
		jobEstado = job;
		const done = await BackupService.esperarJob(job.id, (tick) => {
			jobEstado = tick;
		});
		jobEstado = done;
		return done;
	}

	async function generarBackup() {
		try {
			ejecutando = 'dump';
			const job = await BackupService.crear();
			await seguirJob(job);
			mostrarMensaje('Backup generado. Descargalo y copialo fuera de esta PC.', 'success');
			await cargarListado();
		} catch (e) {
			mostrarMensaje(e instanceof Error ? e.message : 'Error al generar backup', 'error');
		} finally {
			ejecutando = null;
		}
	}

	async function descargar(item: BackupItem) {
		try {
			ejecutando = `dl-${item.id}`;
			await BackupService.descargar(item);
		} catch (e) {
			mostrarMensaje(e instanceof Error ? e.message : 'Error al descargar', 'error');
		} finally {
			ejecutando = null;
		}
	}

	async function restaurar() {
		const archivo = archivoSubida?.[0] || null;
		if (!confirmName.trim()) {
			mostrarMensaje('Escribí el nombre de la empresa para confirmar.', 'error');
			return;
		}
		if (!archivo && !backupElegido) {
			mostrarMensaje('Elegí un backup de la lista o subí un archivo .sql.gz.', 'error');
			return;
		}
		const ok = await confirm(
			'Esto pisa la base actual. Si ya emitiste facturas con CAE después de este backup, la numeración puede chocar con AFIP. ¿Continuar?',
			{ confirmLabel: 'Restaurar', cancelLabel: 'Cancelar' }
		);
		if (!ok) return;
		try {
			ejecutando = 'restore';
			const job = archivo
				? await BackupService.restaurarUpload(archivo, confirmName.trim())
				: await BackupService.restaurar(backupElegido, confirmName.trim());
			await seguirJob(job);
			mostrarMensaje('Restore terminado. Recargá el sistema antes de seguir operando.', 'success');
			archivoSubida = null;
			confirmName = '';
			await cargarListado();
		} catch (e) {
			mostrarMensaje(e instanceof Error ? e.message : 'Error al restaurar', 'error');
		} finally {
			ejecutando = null;
		}
	}
</script>

<svelte:head>
	<title>Backups | Configuración</title>
</svelte:head>

{#if !puedeEntrar}
	<div class="container mx-auto px-4 py-8">
		<p class="text-gray-600">Redirigiendo...</p>
	</div>
{:else}
	<div class="container mx-auto px-4 py-8">
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-gray-800">Backups de la empresa</h1>
			<p class="text-gray-600 mt-2">
				Respaldo de la base de datos de esta empresa. Se guardan los últimos 5 en el servidor.
				Copiá una copia a un USB o carpeta de red.
			</p>
		</div>

		{#if mensaje}
			<div
				class="mb-4 p-4 rounded-lg {mensajeTipo === 'success'
					? 'bg-green-100 text-green-700'
					: 'bg-red-100 text-red-700'}"
			>
				{mensaje}
			</div>
		{/if}

		{#if jobEstado && (jobEstado.status === 'queued' || jobEstado.status === 'running')}
			<div class="mb-4 p-4 rounded-lg bg-blue-50 text-blue-800">
				{jobEstado.message || 'Trabajo en curso…'} ({jobEstado.type})
			</div>
		{/if}

		<div class="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-2">Generar backup</h2>
			<p class="text-sm text-gray-600 mb-4">
				Crea un archivo .sql.gz de la base actual. Puede tardar varios minutos si la base es grande.
			</p>
			<Button variant="primary" on:click={generarBackup} disabled={ejecutando !== null}>
				{ejecutando === 'dump' ? 'Generando…' : 'Generar backup'}
			</Button>
		</div>

		<div class="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-gray-800">Backups guardados</h2>
				<Button variant="secondary" size="sm" on:click={cargarListado} disabled={cargando || ejecutando !== null}>
					Actualizar
				</Button>
			</div>
			{#if cargando}
				<p class="text-sm text-gray-500">Cargando…</p>
			{:else if backups.length === 0}
				<p class="text-sm text-gray-500">Todavía no hay backups en este servidor.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full text-sm">
						<thead>
							<tr class="text-left text-gray-500 border-b">
								<th class="py-2 pr-4">Fecha</th>
								<th class="py-2 pr-4">Archivo</th>
								<th class="py-2 pr-4">Tamaño</th>
								<th class="py-2 pr-4">Tipo</th>
								<th class="py-2 pr-4">Quién</th>
								<th class="py-2">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{#each backups as item (item.id)}
								<tr class="border-b border-gray-100">
									<td class="py-2 pr-4 whitespace-nowrap">{formatoFecha(item.createdAt)}</td>
									<td class="py-2 pr-4 font-mono text-xs">{item.filename}</td>
									<td class="py-2 pr-4">{formatoBytes(item.bytes)}</td>
									<td class="py-2 pr-4">{item.kind === 'safety' ? 'seguridad' : 'manual'}</td>
									<td class="py-2 pr-4">{item.createdBy || '—'}</td>
									<td class="py-2">
										<Button
											variant="secondary"
											size="sm"
											on:click={() => descargar(item)}
											disabled={ejecutando !== null}
										>
											Descargar
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		{#if esSuperadm}
			<div class="bg-white rounded-lg shadow-md p-6 border border-red-200">
				<h2 class="text-lg font-semibold text-gray-800 mb-2">Restaurar</h2>
				<div class="mb-4 p-3 rounded bg-amber-50 text-amber-900 text-sm">
					Pisa toda la base de esta empresa. Si el backup es anterior a facturas ya emitidas con CAE,
					AFIP va a tener comprobantes que acá no existen y el próximo número puede chocar. Antes de
					restaurar se genera un dump de seguridad. Escribí el nombre de la empresa
					{#if nombreEmpresa}
						(<strong>{nombreEmpresa}</strong>)
					{/if}
					para confirmar.
				</div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="confirm-name">
					Nombre de la empresa
				</label>
				<input
					id="confirm-name"
					class="w-full md:w-96 border border-gray-300 rounded px-3 py-2 mb-4"
					bind:value={confirmName}
					placeholder="Nombre exacto"
					disabled={ejecutando !== null}
				/>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="backup-id">
					Backup en el servidor
				</label>
				<select
					id="backup-id"
					class="w-full md:w-96 border border-gray-300 rounded px-3 py-2 mb-4"
					bind:value={backupElegido}
					disabled={ejecutando !== null || Boolean(archivoSubida?.[0])}
				>
					<option value="">— Elegir —</option>
					{#each backups as item (item.id)}
						<option value={item.id}>{formatoFecha(item.createdAt)} · {item.filename}</option>
					{/each}
				</select>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="backup-file">
					O subir un .sql.gz
				</label>
				<input
					id="backup-file"
					type="file"
					accept=".gz,.sql.gz"
					class="block mb-4 text-sm"
					bind:files={archivoSubida}
					disabled={ejecutando !== null}
				/>
				<Button variant="danger" on:click={restaurar} disabled={ejecutando !== null}>
					{ejecutando === 'restore' ? 'Restaurando…' : 'Restaurar'}
				</Button>
			</div>
		{:else}
			<p class="text-sm text-gray-500">
				La restauración solo la puede hacer el vendedor <code>superadm</code>.
			</p>
		{/if}

		<div class="mt-6">
			<a href="/configuracion" class="text-blue-600 hover:underline">← Volver a Configuración</a>
		</div>
	</div>
{/if}
