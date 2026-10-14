// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
	{
		ignores: ['skills/**', 'anti-slop/**', 'graft/**']
	},
	{
		// Banyak data API masih bertipe any; tetap terlihat sebagai peringatan sampai tipenya dirapikan
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	}
)
