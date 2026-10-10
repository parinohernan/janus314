import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface CertificadoEstado {
	archivo?: string;
	cuit?: string;
	validoDesde?: string;
	validoHasta?: string;
	diasRestantes?: number;
	vencido?: boolean;
}

export interface ConfigEmpresaArca {
	cuit: string;
	razonSocial: string;
	dbType: string;
	dbHost: string;
	dbPort: string;
	dbUser: string;
	dbName: string;
	afipMode: string;
}

export interface EstadoConfigArca {
	instancia: string | null;
	empresa: ConfigEmpresaArca;
	certificado: CertificadoEstado | null;
	arcaendpoint: string | null;
	adminKeyConfigurado?: boolean;
}

export interface ResultadoLectura {
	estado: EstadoConfigArca | null;
	error: string | null;
	arcaendpoint: string | null;
	adminKeyConfigurado: boolean;
}

export interface ResultadoVerificacion {
	instancia?: string;
	cuit?: string;
	certificado?: { diasRestantes?: number; vencido?: boolean };
	baseDatos?: { ok: boolean };
	afip?: { ok: boolean; error?: string };
	success?: boolean;
}

export interface DatosConfiguracion {
	cuit: string;
	razonSocial: string;
	dbType: string;
	dbHost: string;
	dbPort: string;
	dbUser: string;
	dbPassword?: string;
	dbName: string;
	afipMode: string;
	arcaAdminKey?: string;
	certificado?: File | null;
	key?: File | null;
}

async function cuerpoDe(res: Response): Promise<Record<string, unknown>> {
	try {
		const data = await res.json();
		return data && typeof data === 'object' ? data : {};
	} catch {
		return {};
	}
}

function mensajeDe(data: Record<string, unknown>, fallback: string): string {
	const error = data.error ?? data.message;
	return typeof error === 'string' && error ? error : fallback;
}

/**
 * Proxy del backend hacia la instancia atrarca de esta empresa.
 * La clave x-admin-key vive solo en el backend: nunca viaja al navegador.
 */
export class ArcaConfigService {
	/** Configuración vigente + estado del certificado. */
	static async obtener(): Promise<ResultadoLectura> {
		let res: Response;
		try {
			res = await fetchWithAuth('/afip/admin-empresa');
		} catch (e) {
			return {
				estado: null,
				error: e instanceof Error ? e.message : 'Error de conexión con el servidor',
				arcaendpoint: null,
				adminKeyConfigurado: false
			};
		}
		const data = await cuerpoDe(res);
		if (!res.ok) {
			return {
				estado: null,
				error: mensajeDe(data, 'No se pudo leer la configuración de atrarca'),
				arcaendpoint: typeof data.arcaendpoint === 'string' ? data.arcaendpoint : null,
				adminKeyConfigurado: data.adminKeyConfigurado === true
			};
		}
		const estado = data as unknown as EstadoConfigArca;
		return {
			estado: {
				instancia: estado.instancia ?? null,
				empresa: estado.empresa ?? ({} as ConfigEmpresaArca),
				certificado: estado.certificado ?? null,
				arcaendpoint: estado.arcaendpoint ?? null,
				adminKeyConfigurado: estado.adminKeyConfigurado
			},
			error: null,
			arcaendpoint: estado.arcaendpoint ?? null,
			adminKeyConfigurado: estado.adminKeyConfigurado === true
		};
	}

	/** PUT: guarda datos de la empresa, base, modo AFIP, clave de atrarca y (opcional) certificado + key. */
	static async guardar(datos: DatosConfiguracion): Promise<void> {
		const form = new FormData();
		const campos: Array<keyof DatosConfiguracion> = [
			'cuit',
			'razonSocial',
			'dbType',
			'dbHost',
			'dbPort',
			'dbUser',
			'dbPassword',
			'dbName',
			'afipMode',
			'arcaAdminKey'
		];
		for (const campo of campos) {
			const valor = datos[campo];
			if (typeof valor === 'string' && valor.trim()) {
				form.append(campo, valor.trim());
			}
		}
		if (datos.certificado) form.append('certificado', datos.certificado);
		if (datos.key) form.append('key', datos.key);

		const res = await fetchWithAuth('/afip/admin-empresa', { method: 'PUT', body: form });
		const data = await cuerpoDe(res);
		if (!res.ok) throw new Error(mensajeDe(data, 'No se pudo guardar la configuración'));
	}

	/** POST: renueva certificado y clave privada en la instancia (solo archivos). */
	static async renovarCertificado(certificado: File, key: File): Promise<void> {
		const form = new FormData();
		form.append('certificado', certificado);
		form.append('key', key);

		const res = await fetchWithAuth('/afip/admin-empresa/certificado', {
			method: 'POST',
			body: form
		});
		const data = await cuerpoDe(res);
		if (!res.ok) throw new Error(mensajeDe(data, 'No se pudo renovar el certificado'));
	}

	/** POST: prueba base de datos + WSAA. La instancia responde siempre HTTP 200. */
	static async verificar(): Promise<ResultadoVerificacion> {
		const res = await fetchWithAuth('/afip/admin-empresa/verificar', { method: 'POST' });
		const data = await cuerpoDe(res);
		if (!res.ok) throw new Error(mensajeDe(data, 'No se pudo verificar la conexión'));
		return data as unknown as ResultadoVerificacion;
	}
}
