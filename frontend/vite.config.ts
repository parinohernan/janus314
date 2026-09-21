import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { loadEnv, type Plugin } from 'vite';
import { resolve } from 'path';

/**
 * SvelteKit's Vite plugin calls decodeURI(pathname) without a try/catch.
 * A request like /% (bots, extensions, a truncated URL after idle) throws
 * URIError, and Vite broadcasts the overlay to every open HMR tab.
 */
function malformedUriGuard(): Plugin {
    return {
        name: 'malformed-uri-guard',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                try {
                    const host = String(req.headers[':authority'] || req.headers.host || 'localhost');
                    const protocol = server.config.server.https ? 'https' : 'http';
                    decodeURI(new URL(`${protocol}://${host}${req.url ?? '/'}`).pathname);
                } catch {
                    res.statusCode = 400;
                    res.end('Bad Request');
                    return;
                }
                next();
            });
        }
    };
}

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
        plugins: [tailwindcss(), malformedUriGuard(), sveltekit()],
        optimizeDeps: {
            include: ['svelte-sonner', 'qz-tray'],
            esbuildOptions: {
                alias: {
                    lna: resolve(process.cwd(), 'src/lib/shims/lna.ts')
                }
            }
        },
        resolve: {
            alias: {
                '@src': resolve(process.cwd(), 'src'),
                lna: resolve(process.cwd(), 'src/lib/shims/lna.ts')
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
