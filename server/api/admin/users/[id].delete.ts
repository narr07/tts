import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')

	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID pengguna tidak valid.'
		})
	}

	// Jangan izinkan menghapus super admin utama
	const target = await db.all(sql`
		SELECT email, role FROM "user" WHERE id = ${id} LIMIT 1
	`)

	if (!target || target.length === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Pengguna tidak ditemukan.'
		})
	}

	const user = target[0] as any
	if (user.email === 'dinarpermadi07@gmail.com' || user.role === 'admin') {
		throw createError({
			statusCode: 403,
			statusMessage: 'Akun Super Admin utama tidak dapat dihapus!'
		})
	}

	// Hapus accounts & sessions terkait
	await db.run(sql`DELETE FROM "account" WHERE "userId" = ${id}`)
	await db.run(sql`DELETE FROM "session" WHERE "userId" = ${id}`)
	await db.run(sql`DELETE FROM "student_progress" WHERE "student_id" = ${id}`)
	await db.run(sql`DELETE FROM "user" WHERE id = ${id}`)

	return {
		success: true,
		message: `Pengguna berhasil dihapus.`
	}
})
