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
		allowedHosts: [
			'078ff12b0f772e359c3c334e37c09b3b.serveo.net',
			'janus314.osvi.lat',
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
