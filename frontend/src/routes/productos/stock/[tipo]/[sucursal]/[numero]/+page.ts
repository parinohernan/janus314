import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { PUBLIC_API_URL } from '$env/static/public';

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const { tipo, sucursal, numero } = params;

		const response = await fetch(
			`${PUBLIC_API_URL}/movimientos-stock/${tipo}/${sucursal}/${numero}`
		);

		if (!response.ok) {
			throw error(response.status, 'Error al cargar el movimiento');
		}

		const movimiento = await response.json();

		return {
			movimiento
		};
	} catch (err) {
		console.error('Error en load:', err);
		throw error(500, 'Error al cargar el movimiento');
	}
};
