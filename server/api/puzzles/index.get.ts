import { db, schema } from 'hub:db'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const grade = query.grade ? Number(query.grade) : undefined
	const subject = query.subject ? String(query.subject) : undefined

	const conditions = []
	if (grade !== undefined && !isNaN(grade)) {
		conditions.push(eq(schema.puzzles.grade, grade))
	}
	if (subject && subject !== 'Semua') {
		conditions.push(eq(schema.puzzles.subject, subject))
	}

	const puzzleList = conditions.length > 0
		? await db.select().from(schema.puzzles).where(and(...conditions)).orderBy(asc(schema.puzzles.orderIndex))
		: await db.select().from(schema.puzzles).orderBy(asc(schema.puzzles.grade), asc(schema.puzzles.orderIndex))

	const results = await Promise.all(
		puzzleList.map(async (p) => {
			const qList = await db
				.select()
				.from(schema.questions)
				.where(eq(schema.questions.puzzleId, p.id))

			return {
				...p,
				questionCount: qList.length,
				questions: qList
			}
		})
	)

	return results
})
