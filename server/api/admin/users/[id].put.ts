import { db } from 'hub:db'
import { sql } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'

defineRouteMeta({
	openAPI: {
		tags: ['Admin'],
		operationId: 'updateUser',
		summary: 'Ubah data pengguna',
		security: [
			{
				bearerAuth: []
			},
			{
				cookieAuth: []
			}
		],
		description: 'Khusus admin. Mengubah peran atau sandi membuat pengguna itu harus masuk ulang. Akun admin tidak bisa diturunkan perannya.',
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
							email: {
								type: 'string'
							},
							schoolName: {
								type: 'string'
							},
							grade: {
								type: 'integer'
							},
							nisn: {
								type: 'string'
							},
							totalXp: {
								type: 'integer'
							},
							totalStars: {
								type: 'integer'
							},
							role: {
								$ref: '#/components/schemas/Role'
							},
							password: {
								type: 'string',
								format: 'password'
							}
						}
					}
				}
			}
		},
		responses: {
			200: {
				description: 'Tersimpan',
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
	await requireRole(event, ['admin'])
	const id = getRouterParam(event, 'id')
	const body = await readBody(event)

	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID pengguna tidak valid.'
		})
	}

	const target = await db.all(sql`
		SELECT id, email, role FROM "user" WHERE id = ${id} LIMIT 1
	`)

	if (!target || target.length === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Pengguna tidak ditemukan.'
		})
	}

	const existingUser = target[0] as any

	const name = body.name !== undefined ? String(body.name).trim() : null
	const email = body.email !== undefined ? String(body.email).trim().toLowerCase() : null
	const schoolName = body.schoolName !== undefined ? String(body.schoolName).trim() : null
	const grade = body.grade !== undefined && body.grade !== null ? Number(body.grade) : null
	const nisn = body.nisn !== undefined ? String(body.nisn).trim() : null
	const totalXp = body.totalXp !== undefined ? Number(body.totalXp) : null
	const totalStars = body.totalStars !== undefined ? Number(body.totalStars) : null
	const role = body.role !== undefined ? String(body.role).trim() : null
	const password = body.password ? String(body.password).trim() : null

	if (role && !APP_ROLES.includes(role as AppRole)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Peran tidak dikenal.'
		})
	}

	// Akun admin tidak bisa diturunkan dari sini, supaya admin terakhir tidak terkunci di luar
	const finalRole = existingUser.role === 'admin' ? 'admin' : (role || existingUser.role)

	// Update user data
	await db.run(sql`
		UPDATE "user"
		SET 
			name = COALESCE(${name}, name),
			email = COALESCE(${email}, email),
			"schoolName" = COALESCE(${schoolName}, "schoolName"),
			grade = COALESCE(${grade}, grade),
			nisn = COALESCE(${nisn}, nisn),
			"totalXp" = COALESCE(${totalXp}, "totalXp"),
			"totalStars" = COALESCE(${totalStars}, "totalStars"),
			role = ${finalRole},
			"updatedAt" = ${Date.now()}
		WHERE id = ${id}
	`)

	// Update password jika diberikan
	if (password) {
		await db.run(sql`
			UPDATE "account"
			SET password = ${await hashPassword(password)}, "updatedAt" = ${Date.now()}
			WHERE "userId" = ${id} AND "providerId" = 'credential'
		`)
	}

	// Sesi lama masih membawa peran lama, jadi pengguna ini harus masuk ulang
	if (password || finalRole !== existingUser.role) {
		await db.run(sql`DELETE FROM "session" WHERE "userId" = ${id}`)
	}

	const updated = await db.all(sql`
		SELECT id, name, email, role, grade, "schoolName", nisn, "totalXp", "totalStars"
		FROM "user"
		WHERE id = ${id}
		LIMIT 1
	`)

	return {
		success: true,
		user: updated[0]
	}
})
