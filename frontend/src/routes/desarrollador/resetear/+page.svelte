<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import { toast } from '$lib/utils/toast';

	interface Tabla {
		nombre: string;
		filas: number;
	}

	interface Etapa {
		id: string;
		label: string;
		descripcion: string;
		requiere: string[];
		tablas: Tabla[];
		filas: number;
	}

	interface Estado {
		empresa: { nombre: string; base: string };
		compartida: string[];
		etapas: Etapa[];
	}

	interface Resultado {
		backupId: string | null;
		numeracionesReiniciadas: number;
		ajustes: string[];
		eliminadas: { id: string; label: string; filas: number }[];
	}

	let estado = $state<Estado | null>(null);
	let cargando = $state(true);
	let ejecutando = $state(false);
	let seleccion = $state<string[]>([]);
	let password = $state('');
	let confirmacion = $state('');
	let hacerBackup = $state(true);
	let bloqueos = $state<string[]>([]);
	let resultado = $state<Resultado | null>(null);

	const porId = $derived(new Map((estado?.etapas ?? []).map((e) => [e.id, e])));

	function faltantes(etapa: Etapa): Etapa[] {
		return etapa.requiere
			.map((id) => porId.get(id))
			.filter((dep): dep is Etapa => !!dep && dep.filas > 0 && !seleccion.includes(dep.id));
	}

	const seleccionBloqueada = $derived(
		seleccion.some((id) => {
			const etapa = porId.get(id);
			return etapa ? faltantes(etapa).length > 0 : false;
		})
	);
	const filasSeleccionadas = $derived(
		seleccion.reduce((total, id) => total + (porId.get(id)?.filas ?? 0), 0)
	);
	const nombreCoincide = $derived(
		!!estado &&
			confirmacion.trim().toUpperCase() === estado.empresa.nombre.trim().toUpperCase()
	);
	const puedeEjecutar = $derived(
		!!estado &&
			!estado.compartida.length &&
			seleccion.length > 0 &&
			!seleccionBloqueada &&
			password.length > 0 &&
			nombreCoincide &&
			!ejecutando
	);

	async function cargar() {
		cargando = true;
		try {
			const response = await fetchWithAuth('/desarrollador/reset');
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.message || data.error || 'No se pudo leer la base');
			estado = data;
			seleccion = seleccion.filter((id) => (porId.get(id)?.filas ?? 0) > 0);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'No se pudo leer la base');
		} finally {
			cargando = false;
		}
	}

	function alternar(id: string, marcado: boolean) {
		resultado = null;
		bloqueos = [];
		seleccion = marcado ? [...seleccion, id] : seleccion.filter((s) => s !== id);
	}

	async function ejecutar() {
		if (!estado || !puedeEjecutar) return;
		const nombres = seleccion.map((id) => porId.get(id)?.label).join(', ');
		if (!confirm(`Se van a borrar ${filasSeleccionadas} registros de: ${nombres}.\n\nEsto no se puede deshacer. ¿Continuar?`)) {
			return;
		}
		ejecutando = true;
		bloqueos = [];
		try {
			const response = await fetchWithAuth('/desarrollador/reset', {
				method: 'POST',
				body: JSON.stringify({ etapas: seleccion, password, confirmacion, backup: hacerBackup })
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				bloqueos = data.bloqueos ?? [];
				throw new Error(data.message || data.error || 'No se pudo resetear');
			}
			resultado = data;
			toast.success('Reseteo terminado');
			seleccion = [];
			password = '';
			confirmacion = '';
			await cargar();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'No se pudo resetear');
		} finally {
			ejecutando = false;
		}
	}

	onMount(cargar);
</script>

<svelte:head>
	<title>Base de datos - resetear</title>
</svelte:head>

<div class="rounded-lg bg-white p-6 shadow-sm">
	<h1 class="text-2xl font-bold text-gray-800">Base de datos - resetear</h1>
	<p class="mt-2 max-w-3xl text-sm text-gray-600">
		Borra por etapas los datos de la empresa. Marcá lo que querés eliminar: si una etapa depende de otra que
		todavía tiene datos, primero hay que borrar esa. La numeración de los comprobantes borrados vuelve a 1.
	</p>

	{#if cargando && !estado}
		<p class="mt-6 text-sm text-gray-500">Contando registros...</p>
	{:else if estado}
		<p class="mt-4 text-sm text-gray-700">
			Empresa <strong>{estado.empresa.nombre}</strong> · base <code>{estado.empresa.base}</code>
		</p>

		{#if estado.compartida.length}
			<div class="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
				Esta base también la usan: <strong>{estado.compartida.join(', ')}</strong>. Resetearla borraría sus
				datos, así que está bloqueado.
			</div>
		{/if}

		<div class="mt-6 grid gap-3 md:grid-cols-2">
			{#each estado.etapas as etapa (etapa.id)}
				{@const marcada = seleccion.includes(etapa.id)}
				{@const pendientes = faltantes(etapa)}
				{@const deshabilitada = etapa.filas === 0 || (!marcada && pendientes.length > 0) || !!estado.compartida.length}
				<div
					class="rounded border p-3 {marcada
						? 'border-red-400 bg-red-50'
						: 'border-gray-200'} {deshabilitada && !marcada ? 'opacity-60' : ''}"
				>
					<label class="flex cursor-pointer items-start gap-3">
						<input
							type="checkbox"
							class="mt-1 h-4 w-4 accent-red-600"
							checked={marcada}
							disabled={deshabilitada && !marcada}
							onchange={(event) => alternar(etapa.id, event.currentTarget.checked)}
						/>
						<span class="flex-1">
							<span class="flex items-center justify-between gap-2">
								<span class="font-medium text-gray-900">{etapa.label}</span>
								<span class="text-sm {etapa.filas ? 'text-gray-700' : 'text-gray-400'}">
									{etapa.filas ? `${etapa.filas.toLocaleString('es-AR')} registros` : 'vacía'}
								</span>
							</span>
							<span class="mt-1 block text-xs text-gray-500">{etapa.descripcion}</span>
						</span>
					</label>
					{#if pendientes.length}
						<p class="mt-2 text-xs text-amber-700">
							Antes hay que borrar: {pendientes.map((p) => p.label).join(', ')}
						</p>
					{/if}
					{#if etapa.tablas.length}
						<details class="mt-2 text-xs text-gray-500">
							<summary class="cursor-pointer">{etapa.tablas.length} tablas</summary>
							<ul class="mt-1 columns-2">
								{#each etapa.tablas as tabla (tabla.nombre)}
									<li>{tabla.nombre}: {tabla.filas}</li>
								{/each}
							</ul>
						</details>
					{/if}
				</div>
			{/each}
		</div>

		<div class="mt-6 max-w-xl space-y-3 rounded border border-red-200 p-4">
			<p class="text-sm font-semibold text-red-800">
				{seleccion.length
					? `Se van a borrar ${filasSeleccionadas.toLocaleString('es-AR')} registros en ${seleccion.length} ${seleccion.length === 1 ? 'etapa' : 'etapas'}`
					: 'No hay etapas marcadas'}
			</p>
			<label class="flex items-center gap-2 text-sm text-gray-700">
				<input type="checkbox" class="h-4 w-4" bind:checked={hacerBackup} />
				Hacer un backup antes de borrar (recomendado)
			</label>
			<div>
				<label class="block text-sm font-medium text-gray-700" for="reset-password">Contraseña de desarrollador</label>
				<input
					id="reset-password"
					type="password"
					class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
					autocomplete="off"
					bind:value={password}
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700" for="reset-confirmacion">
					Escribí el nombre de la empresa: <strong>{estado.empresa.nombre}</strong>
				</label>
				<input
					id="reset-confirmacion"
					type="text"
					class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
					autocomplete="off"
					bind:value={confirmacion}
				/>
			</div>
			<button
				type="button"
				class="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
				disabled={!puedeEjecutar}
				onclick={ejecutar}
			>
				{ejecutando ? (hacerBackup ? 'Haciendo backup y borrando...' : 'Borrando...') : 'Eliminar lo marcado'}
			</button>
		</div>

		{#if bloqueos.length}
			<ul class="mt-4 max-w-3xl list-disc pl-5 text-sm text-red-700">
				{#each bloqueos as bloqueo, indice (indice)}
					<li>{bloqueo}</li>
				{/each}
			</ul>
		{/if}

		{#if resultado}
			<div class="mt-6 max-w-xl rounded border border-green-300 bg-green-50 p-4 text-sm text-green-900">
				<p class="font-semibold">Listo.</p>
				<ul class="mt-2 list-disc pl-5">
					{#each resultado.eliminadas as item (item.id)}
						<li>{item.label}: {item.filas.toLocaleString('es-AR')} registros</li>
					{/each}
					<li>Numeraciones reiniciadas: {resultado.numeracionesReiniciadas}</li>
					{#each resultado.ajustes as ajuste, indice (indice)}
						<li>{ajuste}</li>
					{/each}
					{#if resultado.backupId}
						<li>Backup previo: {resultado.backupId} (en Configuración → Backups)</li>
					{/if}
				</ul>
			</div>
		{/if}
	{/if}
</div>
