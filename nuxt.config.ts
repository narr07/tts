export default defineNuxtConfig({
	compatibilityDate: '2025-01-01',
	vite: {
		optimizeDeps: {
			include: ['canvas-confetti']
		}
	},
	future: {
		compatibilityVersion: 4
	},
	css: ['~/assets/css/main.css'],
	modules: [
		'@nuxt/eslint',
		'@nuxt/ui',
		'@nuxthub/core',
		'@nuxtjs/better-auth',
		'@pinia/nuxt',
		'@vueuse/nuxt'
	],
	hub: {
		db: 'sqlite'
	},
	nitro: {
		experimental: {
			openAPI: true
		},
		// Spesifikasi untuk aplikasi Flutter: /_openapi.json, dokumentasi interaktif di /_scalar dan /_swagger
		openAPI: {
			meta: {
				title: 'Petualangan Kata SD API',
				description: 'API teka-teki silang SD untuk web dan aplikasi Flutter. Endpoint yang butuh login menerima header Authorization: Bearer <token> dari respons login.',
				version: '1.0.0'
			}
		}
	},
	devtools: {
		enabled: false
	}
})
