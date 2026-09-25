import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) {
		throw createError({ statusCode: 400, statusMessage: 'ID puzzle diperlukan' })
	}

	await db.delete(schema.questions).where(eq(schema.questions.puzzleId, id))
	await db.delete(schema.puzzles).where(eq(schema.puzzles.id, id))

	return { success: true, message: 'Puzzle berhasil dihapus' }
})
