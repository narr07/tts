import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const body = await readBody(event)
	const { email, password } = body || {}

	if (!email || !password) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Email dan kata sandi/PIN wajib diisi.'
		})
	}

	const cleanEmail = String(email).trim().toLowerCase()
	const cleanPassword = String(password).trim()

	// Cari user dengan role admin atau teacher
	const result = await db.all(sql`
		SELECT u.id, u.name, u.email, u.role, u.schoolName, a.password as accountPassword
		FROM "user" u
		LEFT JOIN "account" a ON a.userId = u.id
		WHERE lower(u.email) = ${cleanEmail} AND (u.role = 'admin' OR u.role = 'teacher')
		LIMIT 1
	`)

	if (!result || result.length === 0) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Akun guru/admin tidak ditemukan.'
		})
	}

	const user = result[0] as any

	if (user.accountPassword !== cleanPassword) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Kata sandi atau PIN salah.'
		})
	}

	return {
		success: true,
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			schoolName: user.schoolName || ''
		}
	}
})
