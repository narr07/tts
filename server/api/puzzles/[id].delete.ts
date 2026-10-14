import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

defineRouteMeta({
	openAPI: {
		tags: ['Studio Guru'],
		operationId: 'deletePuzzle',
		summary: 'Hapus teka-teki',
		security: [
			{
				bearerAuth: []
			},
			{
				cookieAuth: []
			}
		],
		description: 'Guru hanya bisa menghapus teka-teki buatannya sendiri; admin bisa menghapus semua.',
		responses: {
			200: {
				description: 'Terhapus',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/Success'
						}
					}
				}
			},
			401: {
				$ref: '#/components/responses/Unauthorized'
			},
			403: {
				$ref: '#/components/responses/Forbidden'
			},
			404: {
				$ref: '#/components/responses/NotFound'
			}
		}
	}
})

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) {
		throw createError({ statusCode: 400, statusMessage: 'ID puzzle diperlukan' })
	}

	const { user } = await requireRole(event, ['teacher', 'admin'])
	const [puzzle] = await db.select({ teacherId: schema.puzzles.teacherId })
		.from(schema.puzzles)
		.where(eq(schema.puzzles.id, id))
		.limit(1)

	if (!puzzle) {
		throw createError({ statusCode: 404, statusMessage: 'Puzzle tidak ditemukan' })
	}
	if (user.role !== 'admin' && puzzle.teacherId !== user.id) {
		throw createError({ statusCode: 403, statusMessage: 'Kamu hanya bisa menghapus teka-teki buatanmu sendiri' })
	}

	await db.delete(schema.questions).where(eq(schema.questions.puzzleId, id))
	await db.delete(schema.puzzles).where(eq(schema.puzzles.id, id))

	return { success: true, message: 'Puzzle berhasil dihapus' }
})
