import { db } from 'hub:db'
import { sql } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'

defineRouteMeta({
	openAPI: {
		tags: ['Akun'],
		operationId: 'updateProfile',
		summary: 'Ubah profil sendiri',
		security: [
			{
				bearerAuth: []
			},
			{
				cookieAuth: []
			}
		],
		description: 'Semua field opsional; hanya yang dikirim yang diubah. Akun yang diubah selalu akun pemilik token.',
		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							name: {
								type: 'string'
							},
							schoolName: {
								type: 'string'
							},
							grade: {
								type: 'integer',
								minimum: 1,
								maximum: 6
							},
							password: {
								type: 'string',
								format: 'password',
								description: 'Untuk guru dan admin'
							}
						}
					}
				}
			}
		},
		responses: {
			200: {
				description: 'Profil diperbarui',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								success: {
									type: 'boolean'
								},
								user: {
									$ref: '#/components/schemas/User'
								}
							}
						}
					}
				}
			},
			400: {
				$ref: '#/components/responses/BadRequest'
			},
			401: {
				$ref: '#/components/responses/Unauthorized'
			}
		}
	}
})

export default defineEventHandler(async (event) => {
	// ID diambil dari sesi, bukan dari body, supaya tidak bisa mengubah akun orang lain
	const { user } = await requireUserSession(event)
	const userId = user.id
	const body = await readBody(event)
	const { name, schoolName, grade, password } = body || {}

	const cleanName = name ? String(name).trim() : null
	const cleanSchool = schoolName !== undefined ? String(schoolName).trim() : null
	const cleanGrade = grade !== undefined && grade !== null ? Number(grade) : null
	if (cleanGrade !== null && (!Number.isInteger(cleanGrade) || cleanGrade < 1 || cleanGrade > 6)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Kelas harus antara 1 sampai 6.'
		})
	}
	const cleanPassword = password ? String(password).trim() : null

	// Update user data
	await db.run(sql`
		UPDATE "user"
		SET 
			name = COALESCE(${cleanName}, name),
			"schoolName" = COALESCE(${cleanSchool}, "schoolName"),
			grade = COALESCE(${cleanGrade}, grade),
			"updatedAt" = ${Date.now()}
		WHERE id = ${userId}
	`)

	// Update password jika diberikan
	if (cleanPassword) {
		await db.run(sql`
			UPDATE "account"
			SET password = ${await hashPassword(cleanPassword)}, "updatedAt" = ${Date.now()}
			WHERE "userId" = ${userId} AND "providerId" = 'credential'
		`)
	}

	const result = await db.all(sql`
		SELECT id, name, email, role, grade, "schoolName", nisn, "totalXp", "totalStars"
		FROM "user"
		WHERE id = ${userId}
		LIMIT 1
	`)

	if (!result || result.length === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Pengguna tidak ditemukan.'
		})
	}

	await refreshSessionCookieCache(event)

	return {
		success: true,
		user: result[0]
	}
})
