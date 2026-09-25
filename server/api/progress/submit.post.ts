import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const body = await readBody(event)
	const { studentId, puzzleId, score = 100, stars = 3, timeSeconds = 0 } = body || {}

	if (!studentId || !puzzleId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'studentId dan puzzleId wajib disertakan.'
		})
	}

	const earnedXp = 100 + (stars === 3 ? 50 : stars === 2 ? 25 : 0)
	const now = Date.now()

	// Check if already completed before
	const existing = await db.all(sql`
		SELECT id, stars FROM "student_progress" 
		WHERE "student_id" = ${studentId} AND "puzzle_id" = ${puzzleId}
		LIMIT 1
	`)

	const isFirstTime = !existing || existing.length === 0

	if (isFirstTime) {
		const progId = `prog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
		await db.run(sql`
			INSERT INTO "student_progress" (id, student_id, puzzle_id, score, stars, time_seconds, is_completed, completed_at)
			VALUES (${progId}, ${studentId}, ${puzzleId}, ${score}, ${stars}, ${timeSeconds}, 1, ${now})
		`)

		// Update student totalXp and totalStars
		await db.run(sql`
			UPDATE "user"
			SET "totalXp" = "totalXp" + ${earnedXp},
			    "totalStars" = "totalStars" + ${stars},
			    "updatedAt" = ${now}
			WHERE "id" = ${studentId}
		`)
	} else {
		// Update stars if better
		const oldStars = Number(existing[0]?.stars || 0)
		const extraStars = Math.max(0, stars - oldStars)

		await db.run(sql`
			UPDATE "student_progress"
			SET "score" = MAX("score", ${score}),
			    "stars" = MAX("stars", ${stars}),
			    "time_seconds" = MIN("time_seconds", ${timeSeconds})
			WHERE "student_id" = ${studentId} AND "puzzle_id" = ${puzzleId}
		`)

		if (extraStars > 0) {
			await db.run(sql`
				UPDATE "user"
				SET "totalStars" = "totalStars" + ${extraStars},
				    "totalXp" = "totalXp" + ${extraStars * 20},
				    "updatedAt" = ${now}
				WHERE "id" = ${studentId}
			`)
		}
	}

	// Fetch updated student profile
	const updated = await db.all(sql`
		SELECT id, name, email, role, nisn, birthDate, grade, schoolName, totalXp, totalStars
		FROM "user"
		WHERE id = ${studentId}
		LIMIT 1
	`)

	return {
		success: true,
		earnedXp,
		stars,
		student: updated[0] || null
	}
})
