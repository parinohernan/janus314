import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
    const data = await parent();
    
    // La autenticación se maneja en el layout principal
    // No necesitamos verificación adicional aquí

    return {
        title: 'Mi Empresa'
    };
}; 