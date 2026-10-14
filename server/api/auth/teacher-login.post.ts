import { db } from 'hub:db'
import { sql } from 'drizzle-orm'
import { verifyPassword } from 'better-auth/crypto'

defineRouteMeta({
	openAPI: {
		tags: ['Akun'],
		operationId: 'loginTeacher',
		summary: 'Masuk sebagai guru atau admin',
		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: {
						type: 'object',
						required: ['email', 'password'],
						properties: {
							email: {
								type: 'string',
								format: 'email'
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
				description: 'Berhasil masuk',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/AuthResponse'
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
	const body = await readBody(event)
	const { email, password } = body || {}

	if (!email || !password) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Email dan kata sandi/PIN wajib diisi.'
		})
	}

	const cleanEmail = String(email).trim().toLowerCase()
	const cleanPassword = String(password).trim()

	// Cari user dengan role admin atau teacher
	const result = await db.all(sql`
		SELECT u.id, u.name, u.email, u.role, u.schoolName, a.password as accountPassword
		FROM "user" u
		LEFT JOIN "account" a ON a.userId = u.id AND a.providerId = 'credential'
		WHERE lower(u.email) = ${cleanEmail} AND (u.role = 'admin' OR u.role = 'teacher')
		LIMIT 1
	`)

	const user = result[0] as any
	const passwordOk = user?.accountPassword
		? await verifyPassword({ hash: user.accountPassword, password: cleanPassword })
		: false

	// Pesan disamakan supaya tidak bisa dipakai menebak email mana yang terdaftar
	if (!passwordOk) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Email atau kata sandi salah.'
		})
	}

	const session = await startSession(event, user.id)

	return {
		success: true,
		token: session.token,
		expiresAt: session.expiresAt,
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			schoolName: user.schoolName || ''
		}
	}
})
