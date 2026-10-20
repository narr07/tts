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
	// SN Pro adalah font variabel; tanpa rentang ini @nuxt/fonts hanya mengambil 400 sampai 700
	fonts: {
		families: [
			{ name: 'SN Pro', provider: 'google', weights: ['400 900'] }
		]
	},
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
	},
	hooks: {
		// Halaman /__better-auth-devtools (hanya ada saat dev) membawa CSS global tanpa scope, misalnya
		// h2 { font-size: 13px; border-bottom }, yang ikut menimpa judul aplikasi. Halaman itu hanya dibuka
		// lewat tab Nuxt DevTools, dan DevTools dimatikan di atas, jadi aman dibuang dari daftar rute.
		'pages:resolved'(pages) {
			const idx = pages.findIndex(p => p.name === 'better-auth-devtools')
			if (idx !== -1) pages.splice(idx, 1)
		}
	}
})
