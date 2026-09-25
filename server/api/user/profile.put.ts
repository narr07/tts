import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const body = await readBody(event)
	const { userId, name, schoolName, grade, password } = body || {}

	if (!userId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID pengguna wajib disertakan.'
		})
	}

	const cleanName = name ? String(name).trim() : null
	const cleanSchool = schoolName !== undefined ? String(schoolName).trim() : null
	const cleanGrade = grade !== undefined && grade !== null ? Number(grade) : null
	const cleanPassword = password ? String(password).trim() : null

	// Update user data
	await db.run(sql`
		UPDATE "user"
		SET 
			name = COALESCE(${cleanName}, name),
			"schoolName" = COALESCE(${cleanSchool}, "schoolName"),
			grade = COALESCE(${cleanGrade}, grade),
			"updatedAt" = ${Date.now()}
		WHERE id = ${userId}
	`)

	// Update password jika diberikan
	if (cleanPassword) {
		await db.run(sql`
			UPDATE "account"
			SET password = ${cleanPassword}, "updatedAt" = ${Date.now()}
			WHERE "userId" = ${userId}
		`)
	}

	const result = await db.all(sql`
		SELECT id, name, email, role, grade, "schoolName", nisn, "totalXp", "totalStars"
		FROM "user"
		WHERE id = ${userId}
		LIMIT 1
	`)

	if (!result || result.length === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Pengguna tidak ditemukan.'
		})
	}

	return {
		success: true,
		user: result[0]
	}
})
