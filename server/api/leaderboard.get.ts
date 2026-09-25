import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const grade = query.grade ? Number(query.grade) : undefined

	let rows: any[]

	if (grade && !isNaN(grade)) {
		rows = await db.all(sql`
			SELECT id, name, grade, schoolName, totalXp, totalStars
			FROM "user"
			WHERE "role" = 'student' AND "grade" = ${grade}
			ORDER BY "totalXp" DESC, "totalStars" DESC
			LIMIT 30
		`)
	} else {
		rows = await db.all(sql`
			SELECT id, name, grade, schoolName, totalXp, totalStars
			FROM "user"
			WHERE "role" = 'student'
			ORDER BY "totalXp" DESC, "totalStars" DESC
			LIMIT 30
		`)
	}

	return rows
})
