import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) {
		throw createError({ statusCode: 400, statusMessage: 'ID puzzle diperlukan' })
	}

	const puzzle = await db
		.select()
		.from(schema.puzzles)
		.where(eq(schema.puzzles.id, id))
		.get()

	if (!puzzle) {
		throw createError({ statusCode: 404, statusMessage: 'Puzzle tidak ditemukan' })
	}

	const qList = await db
		.select()
		.from(schema.questions)
		.where(eq(schema.questions.puzzleId, id))

	return {
		...puzzle,
		questions: qList
	}
})
