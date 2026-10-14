import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

defineRouteMeta({
	openAPI: {
		tags: ['Progres'],
		operationId: 'getLeaderboard',
		summary: 'Papan peringkat (30 teratas)',
		parameters: [
			{
				in: 'query',
				name: 'grade',
				description: 'Kelas 1 sampai 6; kosongkan untuk semua kelas',
				schema: {
					type: 'integer',
					minimum: 1,
					maximum: 6
				}
			}
		],
		responses: {
			200: {
				description: 'Peringkat berdasarkan XP lalu bintang',
				content: {
					'application/json': {
						schema: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/LeaderboardEntry'
							}
						}
					}
				}
			}
		}
	}
})

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
