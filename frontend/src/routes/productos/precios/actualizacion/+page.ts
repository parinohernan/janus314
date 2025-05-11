import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  return {
    // Asegurar que esta página se cargue correctamente
    title: 'Actualización de Precios'
  };
}; 