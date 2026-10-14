// Nitro ikut memasukkan route internal (Nuxt, ikon, devtools Better Auth) ke /_openapi.json.
// Generator client Flutter akan membuat method dari semua route itu, jadi spesifikasinya
// disaring: hanya operasi milik aplikasi ini, yang ditandai dengan operationId.
export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook('beforeResponse', (event, response) => {
		if (event.path !== '/_openapi.json') return

		const spec = response.body as { paths?: Record<string, Record<string, { operationId?: string }>> } | undefined
		if (!spec?.paths) return

		const paths: typeof spec.paths = {}
		for (const [path, operations] of Object.entries(spec.paths)) {
			const kept = Object.fromEntries(Object.entries(operations).filter(([, op]) => op?.operationId))
			if (Object.keys(kept).length > 0) paths[path] = kept
		}
		spec.paths = paths
	})
})
