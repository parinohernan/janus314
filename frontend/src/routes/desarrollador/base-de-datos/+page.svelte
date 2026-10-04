<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import { toast } from '$lib/utils/toast';

	interface Tabla {
		nombre: string;
		filas: number;
		datosMb: number;
		indicesMb: number;
		libreMb: number;
	}

	interface Diagnostico {
		base: string;
		compartida: string[];
		latencia: { promedioMs: number; minimoMs: number };
		servidor: {
			version: string;
			bufferPoolMb: number;
			slowQueryLog: boolean;
			longQueryTime: number;
			totalServidorMb: number | null;
		};
		totales: { filas: number; datosMb: number; indicesMb: number; libreMb: number };
		tablas: Tabla[];
		cantidadTablas: number;
		rangos: { tabla: string; desde: string | null; hasta: string | null }[];
		indicesFaltantes: { tabla: string; columnas: string[]; nombre: string }[];
		temporales: { tablas: number; filas: number };
		preventasAntiguas: number;
		tablasConEspacioLibre: number;
		recomendaciones: string[];
	}

	type Accion = 'crear-indices' | 'analizar' | 'optimizar' | 'vaciar-temporales' | 'purgar-preventas';

	let diagnostico = $state<Diagnostico | null>(null);
	let cargando = $state(false);
	let password = $state('');
	let ejecutando = $state<Accion | null>(null);
	let resultados = $state<{ accion: string; mensaje: string; segundos: number; fallidos?: { tabla: string; nombre: string; error: string }[] }[]>([]);

	const compartida = $derived((diagnostico?.compartida.length ?? 0) > 0);

	const acciones = $derived<{ id: Accion; titulo: string; detalle: string; deshabilitada: boolean; destructiva: boolean }[]>(
		diagnostico
			? [
					{
						id: 'crear-indices',
						titulo: 'Crear índices faltantes',
						detalle: diagnostico.indicesFaltantes.length
							? `${diagnostico.indicesFaltantes.length} índices. Se crean en línea, sin bloquear la facturación.`
							: 'No falta ninguno.',
						deshabilitada: diagnostico.indicesFaltantes.length === 0,
						destructiva: false
					},
					{
						id: 'analizar',
						titulo: 'Actualizar estadísticas',
						detalle: 'ANALYZE TABLE: ayuda a MySQL a elegir el índice correcto. Rápido y seguro.',
						deshabilitada: false,
						destructiva: false
					},
					{
						id: 'optimizar',
						titulo: 'Optimizar tablas',
						detalle: diagnostico.tablasConEspacioLibre
							? `${diagnostico.tablasConEspacioLibre} tablas con espacio sin usar (${diagnostico.totales.libreMb} MB). Reconstruye cada tabla; mejor fuera de horario.`
							: 'Ninguna tabla tiene espacio libre para recuperar.',
						deshabilitada: diagnostico.tablasConEspacioLibre === 0,
						destructiva: false
					},
					{
						id: 'vaciar-temporales',
						titulo: 'Vaciar tablas temporales',
						detalle: `${diagnostico.temporales.filas.toLocaleString('es-AR')} filas en ${diagnostico.temporales.tablas} tablas tmp_* de informes.`,
						deshabilitada: compartida || diagnostico.temporales.filas === 0,
						destructiva: true
					},
					{
						id: 'purgar-preventas',
						titulo: 'Borrar preventas de más de un año',
						detalle: `${diagnostico.preventasAntiguas.toLocaleString('es-AR')} preventas viejas de los móviles.`,
						deshabilitada: compartida || diagnostico.preventasAntiguas === 0,
						destructiva: true
					}
				]
			: []
	);

	function formatoFecha(valor: string | null) {
		if (!valor) return '—';
		return String(valor).slice(0, 10).split('-').reverse().join('/');
	}

	function aniosEntre(desde: string | null, hasta: string | null) {
		if (!desde || !hasta) return '';
		const anios = (new Date(hasta).getTime() - new Date(desde).getTime()) / (365.25 * 24 * 3600 * 1000);
		return anios >= 1 ? `${anios.toFixed(1)} años` : `${Math.round(anios * 12)} meses`;
	}

	async function cargar() {
		cargando = true;
		try {
			const response = await fetchWithAuth('/desarrollador/base/diagnostico', { cache: 'no-store' });
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.message || data.error || 'No se pudo diagnosticar');
			diagnostico = data;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'No se pudo diagnosticar');
		} finally {
			cargando = false;
		}
	}

	async function ejecutar(accion: Accion, titulo: string, destructiva: boolean) {
		if (!password) {
			toast.warning('Ingresá la contraseña de desarrollador');
			return;
		}
		if (destructiva && !confirm(`${titulo}: los datos borrados no se recuperan. ¿Continuar?`)) return;
		ejecutando = accion;
		try {
			const response = await fetchWithAuth('/desarrollador/base/accion', {
				method: 'POST',
				body: JSON.stringify({ accion, password })
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.message || data.error || 'No se pudo completar');
			resultados = [{ accion: titulo, mensaje: data.mensaje, segundos: data.segundos, fallidos: data.fallidos }, ...resultados];
			toast.success(data.mensaje);
			await cargar();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'No se pudo completar');
		} finally {
			ejecutando = null;
		}
	}

	onMount(cargar);
</script>

<svelte:head>
	<title>Base de datos - optimizar</title>
</svelte:head>

<div class="space-y-6 rounded-lg bg-white p-6 shadow-sm">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Base de datos - optimizar</h1>
			<p class="mt-1 max-w-3xl text-sm text-gray-600">
				Diagnóstico de la base de la empresa y tareas de mantenimiento. No archiva ni borra comprobantes.
			</p>
		</div>
		<button
			type="button"
			class="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
			disabled={cargando}
			onclick={cargar}
		>
			{cargando ? 'Analizando...' : 'Volver a analizar'}
		</button>
	</div>

	{#if !diagnostico}
		<p class="text-sm text-gray-500">{cargando ? 'Analizando la base...' : 'Sin datos'}</p>
	{:else}
		{#if compartida}
			<div class="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
				Esta base también la usan: <strong>{diagnostico.compartida.join(', ')}</strong>. Los índices y la
				optimización las benefician a todas; las acciones que borran datos están bloqueadas.
			</div>
		{/if}

		<dl class="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
			<div class="rounded border border-gray-200 p-3">
				<dt class="text-gray-500">Base</dt>
				<dd class="font-semibold text-gray-900">{diagnostico.base}</dd>
				<dd class="text-xs text-gray-500">{diagnostico.cantidadTablas} tablas · MySQL {diagnostico.servidor.version}</dd>
			</div>
			<div class="rounded border border-gray-200 p-3">
				<dt class="text-gray-500">Tamaño</dt>
				<dd class="font-semibold text-gray-900">
					{(diagnostico.totales.datosMb + diagnostico.totales.indicesMb).toFixed(1)} MB
				</dd>
				<dd class="text-xs text-gray-500">
					{diagnostico.totales.filas.toLocaleString('es-AR')} filas aprox. · índices {diagnostico.totales.indicesMb} MB
				</dd>
			</div>
			<div class="rounded border border-gray-200 p-3">
				<dt class="text-gray-500">Latencia a la base</dt>
				<dd class="font-semibold {diagnostico.latencia.promedioMs > 20 ? 'text-red-700' : 'text-gray-900'}">
					{diagnostico.latencia.promedioMs} ms
				</dd>
				<dd class="text-xs text-gray-500">por consulta (mínimo {diagnostico.latencia.minimoMs} ms)</dd>
			</div>
			<div class="rounded border border-gray-200 p-3">
				<dt class="text-gray-500">Buffer pool</dt>
				<dd
					class="font-semibold {diagnostico.servidor.totalServidorMb &&
					diagnostico.servidor.bufferPoolMb < diagnostico.servidor.totalServidorMb
						? 'text-red-700'
						: 'text-gray-900'}"
				>
					{diagnostico.servidor.bufferPoolMb} MB
				</dd>
				<dd class="text-xs text-gray-500">
					bases del servidor: {diagnostico.servidor.totalServidorMb ?? '?'} MB
				</dd>
			</div>
		</dl>

		{#if diagnostico.recomendaciones.length}
			<section>
				<h2 class="text-sm font-semibold text-gray-800">Recomendaciones</h2>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
					{#each diagnostico.recomendaciones as recomendacion, indice (indice)}
						<li>{recomendacion}</li>
					{/each}
				</ul>
				<p class="mt-2 text-xs text-gray-500">
					La latencia, el buffer pool y el registro de consultas lentas se configuran en el servidor (my.cnf), no
					desde acá.
				</p>
			</section>
		{/if}

		<section>
			<h2 class="text-sm font-semibold text-gray-800">Mantenimiento</h2>
			<div class="mt-2 max-w-sm">
				<label class="block text-xs font-medium text-gray-600" for="opt-password">Contraseña de desarrollador</label>
				<input
					id="opt-password"
					type="password"
					autocomplete="off"
					class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
					bind:value={password}
				/>
			</div>
			<div class="mt-3 grid gap-3 md:grid-cols-2">
				{#each acciones as accion (accion.id)}
					<div class="flex items-start justify-between gap-3 rounded border border-gray-200 p-3">
						<div>
							<p class="text-sm font-medium text-gray-900">{accion.titulo}</p>
							<p class="mt-1 text-xs text-gray-500">{accion.detalle}</p>
						</div>
						<button
							type="button"
							class="shrink-0 rounded px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 {accion.destructiva
								? 'bg-red-600 hover:bg-red-700'
								: 'bg-amber-600 hover:bg-amber-700'}"
							disabled={accion.deshabilitada || ejecutando !== null || !password}
							onclick={() => ejecutar(accion.id, accion.titulo, accion.destructiva)}
						>
							{ejecutando === accion.id ? 'Ejecutando...' : 'Ejecutar'}
						</button>
					</div>
				{/each}
			</div>

			{#if resultados.length}
				<ul class="mt-3 space-y-1 text-sm">
					{#each resultados as resultado, indice (indice)}
						<li class="text-green-800">
							{resultado.accion}: {resultado.mensaje} ({resultado.segundos} s)
							{#if resultado.fallidos?.length}
								<ul class="ml-4 list-disc text-red-700">
									{#each resultado.fallidos as fallo (fallo.nombre + fallo.tabla)}
										<li>{fallo.tabla}.{fallo.nombre}: {fallo.error}</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		{#if diagnostico.indicesFaltantes.length}
			<section>
				<h2 class="text-sm font-semibold text-gray-800">Índices faltantes ({diagnostico.indicesFaltantes.length})</h2>
				<ul class="mt-2 grid gap-1 text-sm text-gray-700 md:grid-cols-2">
					{#each diagnostico.indicesFaltantes as indice (indice.tabla + indice.nombre)}
						<li><code>{indice.tabla}</code> ({indice.columnas.join(', ')})</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section>
			<h2 class="text-sm font-semibold text-gray-800">Antigüedad de los datos</h2>
			<table class="mt-2 w-full max-w-2xl text-sm">
				<thead class="text-left text-xs text-gray-500">
					<tr><th class="py-1">Tabla</th><th>Desde</th><th>Hasta</th><th>Período</th></tr>
				</thead>
				<tbody>
					{#each diagnostico.rangos as rango (rango.tabla)}
						<tr class="border-t border-gray-100">
							<td class="py-1"><code>{rango.tabla}</code></td>
							<td>{formatoFecha(rango.desde)}</td>
							<td>{formatoFecha(rango.hasta)}</td>
							<td class="text-gray-500">{aniosEntre(rango.desde, rango.hasta)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>

		<section>
			<h2 class="text-sm font-semibold text-gray-800">Tablas más grandes</h2>
			<table class="mt-2 w-full text-sm">
				<thead class="text-left text-xs text-gray-500">
					<tr>
						<th class="py-1">Tabla</th>
						<th class="text-right">Filas (aprox.)</th>
						<th class="text-right">Datos MB</th>
						<th class="text-right">Índices MB</th>
						<th class="text-right">Libre MB</th>
					</tr>
				</thead>
				<tbody>
					{#each diagnostico.tablas as tabla (tabla.nombre)}
						<tr class="border-t border-gray-100">
							<td class="py-1"><code>{tabla.nombre}</code></td>
							<td class="text-right">{tabla.filas.toLocaleString('es-AR')}</td>
							<td class="text-right">{tabla.datosMb}</td>
							<td class="text-right">{tabla.indicesMb}</td>
							<td class="text-right {tabla.libreMb >= 1 ? 'text-amber-700' : 'text-gray-400'}">{tabla.libreMb}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}
</div>
