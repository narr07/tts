export default defineNuxtConfig({
	compatibilityDate: '2025-01-01',
	future: {
		compatibilityVersion: 4
	},
	css: ['~/assets/css/main.css'],
	modules: [
		'@nuxt/ui',
		'@nuxthub/core',
		'@nuxtjs/better-auth',
		'@pinia/nuxt',
		'@vueuse/nuxt'
	],
	hub: {
		db: 'sqlite'
	},
	devtools: {
		enabled: false
	}
})
