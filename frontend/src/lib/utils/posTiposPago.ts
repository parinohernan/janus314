import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export type TipoPagoPos = {
	Codigo: string;
	Descripcion: string;
	aplicaSaldo: boolean;
};

let cache: TipoPagoPos[] | null = null;
let pendiente: Promise<TipoPagoPos[]> | null = null;

export function precargarTiposPagoPos(): Promise<TipoPagoPos[]> {
	if (cache) return Promise.resolve(cache);
	if (pendiente) return pendiente;
	pendiente = fetchWithAuth('/tipos-pago?limit=100')
		.then(async (response) => {
			if (!response.ok) throw new Error('No se pudieron cargar los tipos de pago');
			const data = await response.json();
			const tipos = ((data.items || []) as TipoPagoPos[]).filter((tipo) => !tipo.aplicaSaldo);
			cache = tipos;
			return tipos;
		})
		.finally(() => {
			pendiente = null;
		});
	return pendiente;
}
