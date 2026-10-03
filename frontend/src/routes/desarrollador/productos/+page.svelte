<script lang="ts">
	import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
	import { toast } from '$lib/utils/toast';

	interface ProveedorNuevo {
		codigo: string;
		descripcion: string;
	}

	interface BarraDuplicada {
		barra: string;
		codigos: string[];
	}

	interface ErrorFila {
		fila: number;
		codigo: string;
		mensaje: string;
	}

	interface Resumen {
		filas: number;
		nuevos: number;
		actualizar: number;
		omitidos: number;
		proveedoresNuevos: ProveedorNuevo[];
		barrasDuplicadas: BarraDuplicada[];
		barrasDuplicadasTotal: number;
		errores: ErrorFila[];
		erroresTotal: number;
		confirmado?: boolean;
		creados?: number;
		actualizados?: number;
	}

	let archivo = $state<File | null>(null);
	let resumen = $state<Resumen | null>(null);
	let cargando = $state<'preview' | 'importar' | null>(null);
	let mensaje = $state('');

	function alElegirArchivo(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		archivo = input.files?.[0] ?? null;
		resumen = null;
		mensaje = '';
	}

	async function enviar(confirmar: boolean) {
		if (!archivo) {
			toast.warning('Elegí un archivo CSV');
			return;
		}
		cargando = confirmar ? 'importar' : 'preview';
		mensaje = '';
		try {
			const form = new FormData();
			form.append('archivo', archivo);
			form.append('confirmar', confirmar ? 'true' : 'false');
			const response = await fetchWithAuth('/articulos/importar-catalogo', {
				method: 'POST',
				body: form
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'No se pudo procesar el archivo');
			}
			resumen = data;
			if (confirmar) {
				mensaje = `Listo: ${data.creados ?? 0} creados y ${data.actualizados ?? 0} actualizados.`;
				toast.success(mensaje);
			}
		} catch (error) {
			const texto = error instanceof Error ? error.message : 'Error al importar';
			toast.error(texto);
			mensaje = texto;
		} finally {
			cargando = null;
		}
	}
</script>

<svelte:head>
	<title>Productos - importar</title>
</svelte:head>

<div class="rounded-lg bg-white p-6 shadow-sm">
	<h1 class="text-2xl font-bold text-gray-800">Productos - importar</h1>
	<p class="mt-2 max-w-3xl text-sm text-gray-600">
		CSV del otro sistema, separado por punto y coma. Crea los códigos que no existen y actualiza los que ya
		están. El precio de góndola se conserva con margen cero. No modifica el stock.
	</p>

	<label class="mt-6 block text-sm font-medium text-gray-700" for="csv-productos">Archivo CSV</label>
	<input
		id="csv-productos"
		class="mt-1 block w-full max-w-xl text-sm text-gray-700"
		type="file"
		accept=".csv,text/csv"
		onchange={alElegirArchivo}
	/>

	<div class="mt-4 flex gap-2">
		<button
			type="button"
			class="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
			disabled={!archivo || cargando !== null}
			onclick={() => enviar(false)}
		>
			{cargando === 'preview' ? 'Leyendo...' : 'Vista previa'}
		</button>
		<button
			type="button"
			class="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
			disabled={!resumen || resumen.confirmado || cargando !== null || (resumen.nuevos === 0 && resumen.actualizar === 0)}
			onclick={() => enviar(true)}
		>
			{cargando === 'importar' ? 'Importando...' : 'Importar'}
		</button>
	</div>

	{#if mensaje}
		<p class="mt-4 text-sm text-gray-800">{mensaje}</p>
	{/if}

	{#if resumen}
		<dl class="mt-6 grid max-w-xl grid-cols-2 gap-3 text-sm">
			<div class="rounded border border-gray-200 p-3">
				<dt class="text-gray-500">Filas</dt>
				<dd class="text-lg font-semibold text-gray-900">{resumen.filas}</dd>
			</div>
			<div class="rounded border border-gray-200 p-3">
				<dt class="text-gray-500">Nuevos</dt>
				<dd class="text-lg font-semibold text-gray-900">{resumen.nuevos}</dd>
			</div>
			<div class="rounded border border-gray-200 p-3">
				<dt class="text-gray-500">A actualizar</dt>
				<dd class="text-lg font-semibold text-gray-900">{resumen.actualizar}</dd>
			</div>
			<div class="rounded border border-gray-200 p-3">
				<dt class="text-gray-500">Omitidos</dt>
				<dd class="text-lg font-semibold text-gray-900">{resumen.omitidos}</dd>
			</div>
		</dl>

		{#if resumen.proveedoresNuevos.length}
			<h2 class="mt-6 text-sm font-semibold text-gray-800">
				Proveedores a crear ({resumen.proveedoresNuevos.length})
			</h2>
			<ul class="mt-2 max-h-40 overflow-auto text-sm text-gray-700">
				{#each resumen.proveedoresNuevos as proveedor (proveedor.codigo)}
					<li>{proveedor.codigo} — {proveedor.descripcion}</li>
				{/each}
			</ul>
		{/if}

		{#if resumen.barrasDuplicadasTotal}
			<h2 class="mt-6 text-sm font-semibold text-gray-800">
				Códigos de barras repetidos ({resumen.barrasDuplicadasTotal})
			</h2>
			<p class="mt-1 text-xs text-gray-500">Se graban igual. La base no los exige únicos.</p>
			<ul class="mt-2 max-h-40 overflow-auto text-sm text-gray-700">
				{#each resumen.barrasDuplicadas as grupo (grupo.barra)}
					<li>{grupo.barra}: {grupo.codigos.join(', ')}</li>
				{/each}
			</ul>
		{/if}

		{#if resumen.erroresTotal}
			<h2 class="mt-6 text-sm font-semibold text-gray-800">
				Filas omitidas ({resumen.erroresTotal})
			</h2>
			<ul class="mt-2 max-h-40 overflow-auto text-sm text-red-700">
				{#each resumen.errores as error (`${error.fila}-${error.codigo}`)}
					<li>Fila {error.fila}{error.codigo ? ` (${error.codigo})` : ''}: {error.mensaje}</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
