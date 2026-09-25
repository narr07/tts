import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	// Ambil semua user selain super admin sendiri untuk manajemen
	const teachers = await db.all(sql`
		SELECT id, name, email, role, schoolName, createdAt
		FROM "user"
		WHERE "role" = 'teacher'
		ORDER BY "createdAt" DESC
	`)

	const students = await db.all(sql`
		SELECT id, name, email, role, nisn, birthDate, grade, schoolName, totalXp, totalStars, createdAt
		FROM "user"
		WHERE "role" = 'student'
		ORDER BY "grade" ASC, "totalXp" DESC
	`)

	return {
		teachers,
		students
	}
})
