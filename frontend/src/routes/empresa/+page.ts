import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { auth } from '$lib/stores/authStore';
import { browser } from '$app/environment';

export const load: PageLoad = async () => {
    // Solo verificar autenticación en el navegador
    if (browser) {
        const authState = get(auth);
        if (!authState.isAuthenticated) {
            const isAuthenticated = await auth.verifySession();
            if (!isAuthenticated) {
                throw redirect(302, '/login');
            }
        }
    }

    return {
        title: 'Mi Empresa'
    };
}; 