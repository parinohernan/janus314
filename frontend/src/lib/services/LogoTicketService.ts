import { get } from 'svelte/store';
import { auth } from '$lib/stores/authStore';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

const cache = new Map<string, Promise<string | null>>();

function leerBlob(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ''));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

async function descargar(): Promise<string | null> {
	const response = await fetchWithAuth('/pos/logo-ticket');
	if (!response.ok) return null;
	const dataUrl = await leerBlob(await response.blob());
	return dataUrl.startsWith('data:image/') ? dataUrl : null;
}

/**
 * Logo del ticket (`logoTicket_<empresa>.png` en el servidor) como data URL, una vez por sesión y empresa.
 * Si la empresa no tiene archivo, devuelve null y se vuelve a consultar en el próximo ticket.
 */
export function obtenerLogoTicket(): Promise<string | null> {
	if (typeof window === 'undefined') return Promise.resolve(null);
	const empresaId = String(get(auth).empresa?.id ?? 'sin-empresa');
	let pendiente = cache.get(empresaId);
	if (!pendiente) {
		pendiente = descargar()
			.catch(() => null)
			.then((logo) => {
				if (!logo) cache.delete(empresaId);
				return logo;
			});
		cache.set(empresaId, pendiente);
	}
	return pendiente;
}
