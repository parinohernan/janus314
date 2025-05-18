import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';

export const load: LayoutLoad = async () => {
    return {
        session: {
            user: browser ? true : false // Durante SSR, asumimos que no hay usuario
        }
    };
}; 