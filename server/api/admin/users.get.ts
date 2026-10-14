import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

defineRouteMeta({
	openAPI: {
		tags: ['Admin'],
		operationId: 'listUsers',
		summary: 'Daftar guru dan siswa',
		security: [
			{
				bearerAuth: []
			},
			{
				cookieAuth: []
			}
		],
		responses: {
			200: {
				description: 'Semua guru dan siswa',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								teachers: {
									type: 'array',
									items: {
										$ref: '#/components/schemas/User'
									}
								},
								students: {
									type: 'array',
									items: {
										$ref: '#/components/schemas/User'
									}
								}
							}
						}
					}
				}
			},
			401: {
				$ref: '#/components/responses/Unauthorized'
			},
			403: {
				$ref: '#/components/responses/Forbidden'
			}
		}
	}
})

export default defineEventHandler(async (event) => {
	await requireRole(event, ['admin'])

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
