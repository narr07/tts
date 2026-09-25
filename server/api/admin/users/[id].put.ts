import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody(event)

	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID pengguna tidak valid.'
		})
	}

	const target = await db.all(sql`
		SELECT id, email, role FROM "user" WHERE id = ${id} LIMIT 1
	`)

	if (!target || target.length === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Pengguna tidak ditemukan.'
		})
	}

	const existingUser = target[0] as any

	const name = body.name !== undefined ? String(body.name).trim() : null
	const email = body.email !== undefined ? String(body.email).trim().toLowerCase() : null
	const schoolName = body.schoolName !== undefined ? String(body.schoolName).trim() : null
	const grade = body.grade !== undefined && body.grade !== null ? Number(body.grade) : null
	const nisn = body.nisn !== undefined ? String(body.nisn).trim() : null
	const totalXp = body.totalXp !== undefined ? Number(body.totalXp) : null
	const totalStars = body.totalStars !== undefined ? Number(body.totalStars) : null
	const role = body.role !== undefined ? String(body.role).trim() : null
	const password = body.password ? String(body.password).trim() : null

	// Lindungi role super admin utama agar tidak bisa diturunkan
	const finalRole = existingUser.email === 'dinarpermadi07@gmail.com' ? 'admin' : (role || existingUser.role)

	// Update user data
	await db.run(sql`
		UPDATE "user"
		SET 
			name = COALESCE(${name}, name),
			email = COALESCE(${email}, email),
			"schoolName" = COALESCE(${schoolName}, "schoolName"),
			grade = COALESCE(${grade}, grade),
			nisn = COALESCE(${nisn}, nisn),
			"totalXp" = COALESCE(${totalXp}, "totalXp"),
			"totalStars" = COALESCE(${totalStars}, "totalStars"),
			role = ${finalRole},
			"updatedAt" = ${Date.now()}
		WHERE id = ${id}
	`)

	// Update password jika diberikan
	if (password) {
		await db.run(sql`
			UPDATE "account"
			SET password = ${password}, "updatedAt" = ${Date.now()}
			WHERE "userId" = ${id}
		`)
	}

	const updated = await db.all(sql`
		SELECT id, name, email, role, grade, "schoolName", nisn, "totalXp", "totalStars"
		FROM "user"
		WHERE id = ${id}
		LIMIT 1
	`)

	return {
		success: true,
		user: updated[0]
	}
})
