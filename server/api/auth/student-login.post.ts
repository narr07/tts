import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

defineRouteMeta({
	openAPI: {
		tags: ['Akun'],
		operationId: 'loginStudent',
		summary: 'Masuk sebagai siswa',
		description: 'Siswa masuk dengan NISN dan tanggal lahir. Simpan `token` dari respons untuk dipakai sebagai Bearer.',
		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: {
						type: 'object',
						required: ['nisn', 'birthDate'],
						properties: {
							nisn: {
								type: 'string',
								example: '0012345674'
							},
							birthDate: {
								type: 'string',
								format: 'date',
								example: '2014-11-25'
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
	const { nisn, birthDate } = body || {}

	if (!nisn || !birthDate) {
		throw createError({
			statusCode: 400,
			statusMessage: 'NISN dan Tanggal Lahir wajib diisi.'
		})
	}

	const cleanNisn = String(nisn).trim()
	const cleanBirthDate = String(birthDate).trim()

	// Query user table where role = 'student' and nisn = cleanNisn and birthDate = cleanBirthDate
	const result = await db.all(sql`
		SELECT id, name, email, role, nisn, birthDate, grade, schoolName, totalXp, totalStars 
		FROM "user" 
		WHERE "role" = 'student' AND "nisn" = ${cleanNisn} AND "birthDate" = ${cleanBirthDate}
		LIMIT 1
	`)

	if (!result || result.length === 0) {
		throw createError({
			statusCode: 401,
			statusMessage: 'NISN atau Tanggal Lahir tidak cocok. Pastikan data sudah benar atau silakan daftar terlebih dahulu.'
		})
	}

	const student = result[0] as { id: string }
	const session = await startSession(event, student.id)

	return {
		success: true,
		token: session.token,
		expiresAt: session.expiresAt,
		user: student
	}
})
