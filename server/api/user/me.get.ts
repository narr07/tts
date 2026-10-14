import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

defineRouteMeta({
	openAPI: {
		tags: ['Akun'],
		operationId: 'getMe',
		summary: 'Profil pengguna yang sedang masuk',
		description: 'Dipakai aplikasi Flutter saat dibuka untuk mengecek apakah token masih berlaku, sekaligus mengambil XP dan bintang terbaru.',
		security: [{ bearerAuth: [] }, { cookieAuth: [] }],
		responses: {
			200: {
				description: 'Profil pengguna',
				content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
			},
			401: { $ref: '#/components/responses/Unauthorized' }
		}
	}
})

export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)

	// Dibaca langsung dari tabel supaya XP dan bintang selalu terbaru, bukan dari cache sesi
	const rows = await db.all(sql`
		SELECT id, name, email, role, nisn, grade, schoolName, totalXp, totalStars
		FROM "user"
		WHERE id = ${user.id}
		LIMIT 1
	`)

	if (!rows[0]) {
		throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan.' })
	}

	return rows[0]
})
