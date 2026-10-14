import { db } from 'hub:db'
import { sql } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'

defineRouteMeta({
	openAPI: {
		tags: ['Akun'],
		operationId: 'registerStudent',
		summary: 'Daftar akun siswa baru',
		description: 'Membuat akun siswa dan langsung masuk. Respons membawa `token` seperti login.',
		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: {
						type: 'object',
						required: ['nisn', 'name', 'birthDate', 'grade', 'schoolName'],
						properties: {
							nisn: {
								type: 'string'
							},
							name: {
								type: 'string'
							},
							birthDate: {
								type: 'string',
								format: 'date'
							},
							grade: {
								type: 'integer',
								minimum: 1,
								maximum: 6
							},
							schoolName: {
								type: 'string'
							}
						}
					}
				}
			}
		},
		responses: {
			200: {
				description: 'Akun dibuat dan sudah masuk',
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
			409: {
				description: 'NISN sudah terdaftar',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/Error'
						}
					}
				}
			}
		}
	}
})

export default defineEventHandler(async (event) => {
	const body = await readBody(event)
	const { nisn, name, birthDate, grade, schoolName } = body || {}

	if (!nisn || !name || !birthDate || !grade || !schoolName) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Semua kolom (NISN, Nama Lengkap, Tanggal Lahir, Kelas, Nama Sekolah) wajib diisi!'
		})
	}

	const cleanNisn = String(nisn).trim()
	const cleanName = String(name).trim()
	const cleanBirthDate = String(birthDate).trim()
	const numGrade = Number(grade)
	const cleanSchool = String(schoolName).trim()

	if (!Number.isInteger(numGrade) || numGrade < 1 || numGrade > 6) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Tingkat kelas harus antara 1 sampai 6 (Sekolah Dasar).'
		})
	}

	// Cek apakah NISN sudah terdaftar
	const existing = await db.all(sql`
		SELECT id FROM "user" WHERE "nisn" = ${cleanNisn} LIMIT 1
	`)

	if (existing && existing.length > 0) {
		throw createError({
			statusCode: 409,
			statusMessage: 'NISN ini sudah terdaftar! Silakan langsung login menggunakan NISN dan Tanggal Lahir.'
		})
	}

	const newId = `std_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
	const email = `${cleanNisn}@siswa.tts.id`
	const now = Date.now()

	await db.run(sql`
		INSERT INTO "user" (id, name, email, role, nisn, birthDate, grade, schoolName, totalXp, totalStars, createdAt, updatedAt)
		VALUES (${newId}, ${cleanName}, ${email}, 'student', ${cleanNisn}, ${cleanBirthDate}, ${numGrade}, ${cleanSchool}, 0, 0, ${now}, ${now})
	`)

	await db.run(sql`
		INSERT INTO "account" (id, accountId, providerId, userId, password, createdAt, updatedAt)
		VALUES (${`acc_${newId}`}, ${email}, 'credential', ${newId}, ${await hashPassword(cleanBirthDate)}, ${now}, ${now})
	`)

	const session = await startSession(event, newId)

	return {
		success: true,
		token: session.token,
		expiresAt: session.expiresAt,
		message: 'Pendaftaran siswa berhasil! Selamat datang!',
		user: {
			id: newId,
			name: cleanName,
			email,
			role: 'student',
			nisn: cleanNisn,
			birthDate: cleanBirthDate,
			grade: numGrade,
			schoolName: cleanSchool,
			totalXp: 0,
			totalStars: 0
		}
	}
})
