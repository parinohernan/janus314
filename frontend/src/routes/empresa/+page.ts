import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
    const data = await parent();
    
    if (!data.session.user) {
        throw redirect(302, '/login');
    }

    return {
        title: 'Mi Empresa'
    };
}; 