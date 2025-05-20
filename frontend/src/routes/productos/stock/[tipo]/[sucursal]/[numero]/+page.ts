import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { browser } from '$app/environment';

// Deshabilitar SSR para esta ruta
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	// No hacer fetch de datos en el servidor - se manejará en el componente
	return {
		tipo: params.tipo,
		sucursal: params.sucursal,
		numero: params.numero
	};
};
