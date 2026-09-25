import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const studentId = query.studentId ? String(query.studentId) : null

	if (!studentId) {
		return []
	}

	const rows = await db.all(sql`
		SELECT puzzle_id as puzzleId, score, stars, time_seconds as timeSeconds, is_completed as isCompleted, completed_at as completedAt
		FROM "student_progress"
		WHERE "student_id" = ${studentId}
	`)

	return rows
})
