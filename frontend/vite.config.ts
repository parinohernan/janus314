import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			'@src': resolve(process.cwd(), 'src')
		}
	},
	server: {
		host: true,
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				secure: false,
			}
		},
		allowedHosts: [
			'janus314.osvi.lat',
			'jano.janus314.com.ar',
			'api.janus314.osvi.lat',
			'localhost'
		]
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['./vitest-setup-client.ts'],
		globals: true
	}
});
