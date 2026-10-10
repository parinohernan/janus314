<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/authStore';
	import { esAdminOSuperadm } from '$lib/utils/permisos';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		ArcaConfigService,
		type CertificadoEstado,
		type ResultadoVerificacion
	} from '$lib/services/ArcaConfigService';

	const MAX_ARCHIVO_BYTES = 100 * 1024;

	const puede = $derived(esAdminOSuperadm($auth?.user));

	let cargando = $state(true);
	let guardando = $state(false);
	let renovando = $state(false);
	let verificando = $state(false);
	let error = $state('');
	let mensaje = $state('');

	let instancia = $state<string | null>(null);
	let arcaendpoint = $state<string | null>(null);
	let certificado = $state<CertificadoEstado | null>(null);
	let claveGuardada = $state(false);
	let verificacion = $state<ResultadoVerificacion | null>(null);

	let cuit = $state('');
	let razonSocial = $state('');
	let dbType = $state('mysql');
	let dbHost = $state('');
	let dbPort = $state('');
	let dbUser = $state('');
	let dbPassword = $state('');
	let dbName = $state('');
	let afipMode = $state('production');
	let arcaAdminKey = $state('');
	let archivosCert = $state<FileList | null>(null);
	let archivosKey = $state<FileList | null>(null);

	let reiniciando = $state(false);
	let segundosRestantes = $state(0);

	$effect(() => {
		if (!reiniciando) return;
		const timer = setInterval(() => {
			segundosRestantes -= 1;
			if (segundosRestantes <= 0) reiniciando = false;
		}, 1000);
		return () => clearInterval(timer);
	});

	onMount(() => {
		if (!esAdminOSuperadm($auth?.user)) {
			goto('/arca');
			return;
		}
		cargar();
	});

	function textoDeError(e: unknown): string {
		return e instanceof Error ? e.message : 'Error desconocido';
	}

	async function cargar() {
		cargando = true;
		error = '';
		try {
			const lectura = await ArcaConfigService.obtener();
			if (lectura.arcaendpoint) arcaendpoint = lectura.arcaendpoint;
			claveGuardada = lectura.adminKeyConfigurado;
			if (lectura.error) error = lectura.error;
			const estado = lectura.estado;
			if (!estado) return;
			instancia = estado.instancia;
			certificado = estado.certificado;
			const empresa = estado.empresa;
			cuit = empresa.cuit ?? '';
			razonSocial = empresa.razonSocial ?? '';
			dbType = empresa.dbType || 'mysql';
			dbHost = empresa.dbHost ?? '';
			dbPort = empresa.dbPort ? String(empresa.dbPort) : '';
			dbUser = empresa.dbUser ?? '';
			dbName = empresa.dbName ?? '';
			afipMode = empresa.afipMode === 'testing' ? 'testing' : 'production';
		} catch (e) {
			error = textoDeError(e);
		} finally {
			cargando = false;
		}
	}

	function validarArchivos(): string | null {
		const cert = archivosCert?.[0] || null;
		const key = archivosKey?.[0] || null;
		if ((cert && !key) || (!cert && key)) {
			return 'El certificado y la clave privada se deben enviar juntos.';
		}
		for (const archivo of [cert, key].filter(Boolean) as File[]) {
			const nombre = archivo.name.toLowerCase();
			if (nombre.endsWith('.pfx') || nombre.endsWith('.p12')) {
				return `Los archivos .pfx no se aceptan (${archivo.name}).`;
			}
			if (archivo.size > MAX_ARCHIVO_BYTES) {
				return `El archivo ${archivo.name} supera los 100 KB.`;
			}
		}
		if (cert && !/\.(crt|pem)$/.test(cert.name.toLowerCase())) {
			return 'El certificado debe tener extensión .crt o .pem.';
		}
		if (key && !/\.(key|pem)$/.test(key.name.toLowerCase())) {
			return 'La clave privada debe tener extensión .key o .pem.';
		}
		return null;
	}

	function avisarReinicio() {
		mensaje = 'La instancia se reinicia (20-30 s). Espere antes de verificar.';
		segundosRestantes = 30;
		reiniciando = true;
	}

	async function guardar() {
		error = '';
		mensaje = '';
		verificacion = null;
		const problema = validarArchivos();
		if (problema) {
			error = problema;
			return;
		}
		guardando = true;
		try {
			await ArcaConfigService.guardar({
				cuit,
				razonSocial,
				dbType,
				dbHost,
				dbPort,
				dbUser,
				dbPassword,
				dbName,
				afipMode,
				arcaAdminKey,
				certificado: archivosCert?.[0] || null,
				key: archivosKey?.[0] || null
			});
			mensaje = '';
			avisarReinicio();
			if (arcaAdminKey) {
				arcaAdminKey = '';
				claveGuardada = true;
			}
			archivosCert = null;
			archivosKey = null;
		} catch (e) {
			error = textoDeError(e);
		} finally {
			guardando = false;
		}
	}

	async function renovarCertificado() {
		error = '';
		mensaje = '';
		verificacion = null;
		const cert = archivosCert?.[0] || null;
		const key = archivosKey?.[0] || null;
		if (!cert || !key) {
			error = 'Para renovar el certificado seleccione el archivo .crt y su clave .key.';
			return;
		}
		const problema = validarArchivos();
		if (problema) {
			error = problema;
			return;
		}
		renovando = true;
		try {
			await ArcaConfigService.renovarCertificado(cert, key);
			avisarReinicio();
			archivosCert = null;
			archivosKey = null;
		} catch (e) {
			error = textoDeError(e);
		} finally {
			renovando = false;
		}
	}

	async function verificar() {
		error = '';
		mensaje = '';
		verificando = true;
		try {
			verificacion = await ArcaConfigService.verificar();
		} catch (e) {
			error = textoDeError(e);
			verificacion = null;
		} finally {
			verificando = false;
		}
	}

	function etiquetaCertificado(c: CertificadoEstado | null): {
		texto: string;
		clases: string;
	} {
		if (!c) {
			return { texto: 'Sin certificado cargado', clases: 'bg-gray-100 text-gray-700' };
		}
		if (c.vencido) {
			return { texto: 'Certificado vencido', clases: 'bg-red-100 text-red-800' };
		}
		const dias = typeof c.diasRestantes === 'number' ? c.diasRestantes : null;
		return {
			texto: dias === null ? 'Certificado vigente' : `${dias} días restantes`,
			clases: 'bg-green-100 text-green-800'
		};
	}

	function ayudaAfip(errorAfip: string | undefined): string | null {
		const texto = String(errorAfip || '');
		if (texto.includes('cms.cert.untrusted')) {
			return 'El certificado no fue emitido por ARCA.';
		}
		if (texto.includes('coe.notAuthorized')) {
			return 'El certificado no está asociado al servicio de facturación electrónica (wsfe) en ARCA, o el CUIT no corresponde.';
		}
		return null;
	}
</script>

<svelte:head>
	<title>Configuración ARCA | Atrarca</title>
</svelte:head>

{#if !puede}
	<div class="container mx-auto px-4 py-8">
		<p class="text-gray-600">Redirigiendo...</p>
	</div>
{:else}
	<div class="container mx-auto px-4 py-8">
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-gray-800">Configuración de atrarca</h1>
			<p class="mt-2 text-gray-600">
				Datos de la empresa, base de datos y certificado AFIP que usa la instancia atrarca de esta
				empresa.
			</p>
		</div>

		{#if error}
			<div class="mb-4 rounded-lg bg-red-100 p-4 text-red-700" role="alert">{error}</div>
		{/if}
		{#if mensaje}
			<div class="mb-4 rounded-lg bg-blue-50 p-4 text-blue-800">{mensaje}</div>
		{/if}

		<div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
			<h2 class="mb-4 text-lg font-semibold text-gray-800">Estado actual</h2>
			<div class="grid gap-3 text-sm sm:grid-cols-2">
				<div>
					<span class="block text-gray-500">Instancia</span>
					<span class="font-medium">{instancia || '—'}</span>
				</div>
				<div>
					<span class="block text-gray-500">Endpoint ARCA de la empresa</span>
					<span class="font-medium break-all">{arcaendpoint || '—'}</span>
				</div>
				<div>
					<span class="block text-gray-500">Certificado</span>
					<span
						class="inline-block rounded px-2 py-1 text-xs font-semibold {etiquetaCertificado(
							certificado
						).clases}"
					>
						{etiquetaCertificado(certificado).texto}
					</span>
				</div>
				<div>
					<span class="block text-gray-500">Clave de atrarca</span>
					<span class="font-medium">{claveGuardada ? 'Guardada' : 'Sin guardar'}</span>
				</div>
			</div>
			{#if certificado?.archivo}
				<p class="mt-3 text-sm text-gray-600">
					Archivo: <span class="font-mono">{certificado.archivo}</span>
				</p>
			{/if}
		</div>

		<form
			class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md"
			on:submit|preventDefault={guardar}
		>
			<h2 class="mb-4 text-lg font-semibold text-gray-800">Datos de la empresa</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-cuit">CUIT</label>
					<input
						id="cfg-cuit"
						type="text"
						class="w-full rounded border border-gray-300 px-3 py-2"
						bind:value={cuit}
						disabled={guardando || renovando}
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-razon">
						Razón social
					</label>
					<input
						id="cfg-razon"
						type="text"
						class="w-full rounded border border-gray-300 px-3 py-2"
						bind:value={razonSocial}
						disabled={guardando || renovando}
					/>
				</div>
			</div>

			<h2 class="mt-6 mb-4 text-lg font-semibold text-gray-800">Base de datos</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-dbtype">
						Tipo de base
					</label>
					<input
						id="cfg-dbtype"
						type="text"
						class="w-full rounded border border-gray-300 px-3 py-2"
						bind:value={dbType}
						disabled={guardando || renovando}
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-dbhost">Host</label>
					<input
						id="cfg-dbhost"
						type="text"
						class="w-full rounded border border-gray-300 px-3 py-2"
						bind:value={dbHost}
						disabled={guardando || renovando}
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-dbport">Puerto</label
					>
					<input
						id="cfg-dbport"
						type="text"
						class="w-full rounded border border-gray-300 px-3 py-2"
						bind:value={dbPort}
						disabled={guardando || renovando}
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-dbuser"
						>Usuario</label
					>
					<input
						id="cfg-dbuser"
						type="text"
						class="w-full rounded border border-gray-300 px-3 py-2"
						bind:value={dbUser}
						disabled={guardando || renovando}
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-dbpass">
						Contraseña
					</label>
					<input
						id="cfg-dbpass"
						type="password"
						class="w-full rounded border border-gray-300 px-3 py-2"
						bind:value={dbPassword}
						placeholder="Vacío para mantener la contraseña actual"
						disabled={guardando || renovando}
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-dbname">
						Nombre de la base
					</label>
					<input
						id="cfg-dbname"
						type="text"
						class="w-full rounded border border-gray-300 px-3 py-2"
						bind:value={dbName}
						disabled={guardando || renovando}
					/>
				</div>
			</div>

			<h2 class="mt-6 mb-4 text-lg font-semibold text-gray-800">AFIP / certificado</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-modo"
						>Modo AFIP</label
					>
					<select
						id="cfg-modo"
						class="w-full rounded border border-gray-300 px-3 py-2"
						bind:value={afipMode}
						disabled={guardando || renovando}
					>
						<option value="production">production (producción)</option>
						<option value="testing">testing (pruebas)</option>
					</select>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-clave">
						Clave de administración de atrarca
					</label>
					<input
						id="cfg-clave"
						type="password"
						class="w-full rounded border border-gray-300 px-3 py-2"
						bind:value={arcaAdminKey}
						placeholder={claveGuardada
							? 'Guardada (ingrese solo para reemplazarla)'
							: 'Clave x-admin-key'}
						autocomplete="off"
						disabled={guardando || renovando}
					/>
					<p class="mt-1 text-xs text-gray-500">
						Se guarda solo en el servidor y no se vuelve a mostrar.
					</p>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-cert">
						Certificado (.crt o .pem)
					</label>
					<input
						id="cfg-cert"
						type="file"
						accept=".crt,.pem"
						class="block w-full text-sm"
						bind:files={archivosCert}
						disabled={guardando || renovando}
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700" for="cfg-key">
						Clave privada (.key)
					</label>
					<input
						id="cfg-key"
						type="file"
						accept=".key,.pem"
						class="block w-full text-sm"
						bind:files={archivosKey}
						disabled={guardando || renovando}
					/>
				</div>
			</div>
			<p class="mt-2 text-xs text-gray-500">
				Certificado y clave se envían juntos, hasta 100 KB cada uno. No se aceptan archivos .pfx.
			</p>

			<div class="mt-6 flex flex-wrap gap-2">
				<Button type="submit" variant="primary" disabled={guardando || renovando}>
					{guardando ? 'Guardando…' : 'Guardar configuración'}
				</Button>
				<Button variant="secondary" on:click={renovarCertificado} disabled={guardando || renovando}>
					{renovando ? 'Renovando…' : 'Renovar certificado'}
				</Button>
				<Button
					variant="secondary"
					on:click={verificar}
					disabled={verificando || reiniciando || guardando || renovando}
				>
					{verificando ? 'Verificando…' : 'Verificar conexión'}
				</Button>
			</div>
			{#if reiniciando}
				<p
					class="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700"
				>
					La instancia se está reiniciando. Verificar disponible en {segundosRestantes} s.
				</p>
			{/if}
		</form>

		{#if verificacion}
			<div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
				<h2 class="mb-4 text-lg font-semibold text-gray-800">Resultado de la verificación</h2>
				<div class="mb-4 flex flex-wrap gap-2">
					<span
						class="rounded px-2 py-1 text-xs font-semibold {verificacion.success
							? 'bg-green-100 text-green-800'
							: 'bg-red-100 text-red-800'}"
					>
						{verificacion.success ? 'Verificación OK' : 'Verificación con errores'}
					</span>
					{#if verificacion.certificado}
						<span
							class="rounded px-2 py-1 text-xs font-semibold {verificacion.certificado.vencido
								? 'bg-red-100 text-red-800'
								: 'bg-green-100 text-green-800'}"
						>
							{verificacion.certificado.vencido
								? 'Certificado vencido'
								: `${verificacion.certificado.diasRestantes ?? '—'} días restantes`}
						</span>
					{/if}
				</div>
				<ul class="space-y-2 text-sm">
					<li>
						<span class="font-medium">Base de datos:</span>
						{#if verificacion.baseDatos?.ok}
							<span class="text-green-700">conexión correcta</span>
						{:else}
							<span class="text-red-700">no se pudo conectar</span>
						{/if}
					</li>
					<li>
						<span class="font-medium">AFIP / ARCA (WSAA):</span>
						{#if verificacion.afip?.ok}
							<span class="text-green-700">autorizado</span>
						{:else}
							<span class="text-red-700">no autorizado</span>
							{#if verificacion.afip?.error}
								<span class="mt-1 block font-mono text-xs text-gray-600">
									{verificacion.afip.error}
								</span>
								{#if ayudaAfip(verificacion.afip.error)}
									<span class="mt-1 block text-gray-700">{ayudaAfip(verificacion.afip.error)}</span>
								{/if}
							{/if}
						{/if}
					</li>
					{#if verificacion.cuit}
						<li><span class="font-medium">CUIT informado:</span> {verificacion.cuit}</li>
					{/if}
				</ul>
			</div>
		{/if}

		<div class="mt-6 flex flex-wrap gap-4">
			<button type="button" class="text-blue-600 hover:underline" on:click={() => goto('/arca')}>
				← Volver a ARCA
			</button>
			<button type="button" class="text-blue-600 hover:underline" on:click={cargar}>
				Actualizar estado
			</button>
		</div>
		{#if cargando}
			<p class="mt-2 text-sm text-gray-500">Cargando estado…</p>
		{/if}
	</div>
{/if}
