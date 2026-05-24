import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'$core': path.resolve('../src/core'),
			'$fighters': path.resolve('../src/fighters')
		}
	},
	server: {
		proxy: {
			'/balance': 'http://localhost:3001',
			'/slot': 'http://localhost:3001'
		}
	}
});
