import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

defineRouteMeta({
	openAPI: {
		tags: ['Progres'],
		operationId: 'listMyProgress',
		summary: 'Progres siswa yang sedang masuk',
		security: [
			{
				bearerAuth: []
			},
			{
				cookieAuth: []
			}
		],
		description: 'Mengembalikan daftar kosong untuk tamu, guru, dan admin.',
		responses: {
			200: {
				description: 'Daftar progres',
				content: {
					'application/json': {
						schema: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/Progress'
							}
						}
					}
				}
			}
		}
	}
})

export default defineEventHandler(async (event) => {
	// Progres hanya untuk siswa yang sedang masuk; tamu mendapat daftar kosong
	const session = await getUserSession(event)
	if (session?.user?.role !== 'student') {
		return []
	}
	const studentId = session.user.id

	const rows = await db.all(sql`
		SELECT puzzle_id as puzzleId, score, stars, time_seconds as timeSeconds, is_completed as isCompleted, completed_at as completedAt
		FROM "student_progress"
		WHERE "student_id" = ${studentId}
	`)

	return rows
})
