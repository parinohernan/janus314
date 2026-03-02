import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const publicApiUrl = env.PUBLIC_API_URL || process.env.PUBLIC_API_URL || '';
    // Si PUBLIC_API_URL incluye "/api" (p.ej. https://dominio/api), extraemos solo el origen
    const proxyTarget = (() => {
        try {
            if (publicApiUrl.startsWith('http')) {
                return new URL(publicApiUrl).origin; // https://dominio
            }
        } catch {}
        return 'http://localhost:3330';
    })();

    return {
        root: process.cwd(),
        plugins: [tailwindcss(), sveltekit()],
        optimizeDeps: {
            include: ['svelte-sonner']
        },
        resolve: {
            alias: {
                '@src': resolve(process.cwd(), 'src')
            }
        },
        server: {
            host: '0.0.0.0',
            port: 5173,
            strictPort: false,
            fs: {
                strict: true,
                allow: [
                    process.cwd(),
                    resolve(process.cwd(), 'node_modules'),
                    resolve(process.cwd(), 'src'),
                    resolve(process.cwd(), '.svelte-kit')
                ]
            },
            proxy: {
                '/api': {
                    target: proxyTarget,
                    changeOrigin: true,
                    secure: false
                }
            },
            allowedHosts: [
                'janus314.osvi.lat',
                'jano.janus314.com.ar',
                'erp.janus314.com.ar',
                'api.janus314.osvi.lat',
                'localhost',
                '127.0.0.1'
            ]
        },
        test: {
            include: ['src/**/*.{test,spec}.{js,ts}'],
            environment: 'jsdom',
            setupFiles: ['./vitest-setup-client.ts'],
            globals: true
        }
    };
});
