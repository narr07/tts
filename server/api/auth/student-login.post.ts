import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const body = await readBody(event)
	const { nisn, birthDate } = body || {}

	if (!nisn || !birthDate) {
		throw createError({
			statusCode: 400,
			statusMessage: 'NISN dan Tanggal Lahir wajib diisi.'
		})
	}

	const cleanNisn = String(nisn).trim()
	const cleanBirthDate = String(birthDate).trim()

	// Query user table where role = 'student' and nisn = cleanNisn and birthDate = cleanBirthDate
	const result = await db.all(sql`
		SELECT id, name, email, role, nisn, birthDate, grade, schoolName, totalXp, totalStars 
		FROM "user" 
		WHERE "role" = 'student' AND "nisn" = ${cleanNisn} AND "birthDate" = ${cleanBirthDate}
		LIMIT 1
	`)

	if (!result || result.length === 0) {
		throw createError({
			statusCode: 401,
			statusMessage: 'NISN atau Tanggal Lahir tidak cocok. Pastikan data sudah benar atau silakan daftar terlebih dahulu.'
		})
	}

	const student = result[0]

	return {
		success: true,
		user: student
	}
})
