import { db, schema } from 'hub:db'
import { eq, and, asc, inArray } from 'drizzle-orm'

// $global di bawah adalah satu-satunya tempat skema bersama didefinisikan;
// endpoint lain cukup merujuknya lewat $ref (defineRouteMeta dibaca statis saat build)
defineRouteMeta({
	openAPI: {
		tags: ['Teka-teki'],
		operationId: 'listPuzzles',
		summary: 'Daftar teka-teki',
		description: 'Tanpa filter, diurutkan per kelas lalu urutan level. Setiap teka-teki membawa soal beserta posisinya di grid.',
		parameters: [
			{ in: 'query', name: 'grade', description: 'Kelas 1 sampai 6', schema: { type: 'integer', minimum: 1, maximum: 6 } },
			{ in: 'query', name: 'subject', description: 'Nama mata pelajaran. "Semua" sama dengan tanpa filter.', schema: { type: 'string', example: 'IPAS' } }
		],
		responses: {
			200: {
				description: 'Daftar teka-teki',
				content: {
					'application/json': {
						schema: { type: 'array', items: { $ref: '#/components/schemas/Puzzle' } }
					}
				}
			}
		},
		$global: {
			components: {
				securitySchemes: {
					bearerAuth: {
						type: 'http',
						scheme: 'bearer',
						description: 'Token dari field `token` di respons login atau daftar. Kirim sebagai `Authorization: Bearer <token>`.'
					},
					cookieAuth: {
						type: 'apiKey',
						in: 'cookie',
						name: 'better-auth.session_token',
						description: 'Dipakai versi web; dibuat otomatis saat login.'
					}
				},
				responses: {
					BadRequest: {
						description: 'Input tidak lengkap atau tidak valid',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
					},
					Unauthorized: {
						description: 'Belum masuk, atau token tidak berlaku lagi',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
					},
					Forbidden: {
						description: 'Peran akun tidak diizinkan memakai endpoint ini',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
					},
					NotFound: {
						description: 'Data tidak ditemukan',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
					}
				},
				schemas: {
					Error: {
						type: 'object',
						properties: {
							statusCode: { type: 'integer', example: 401 },
							statusMessage: { type: 'string', description: 'Pesan dalam Bahasa Indonesia, aman ditampilkan ke pengguna', example: 'Email atau kata sandi salah.' }
						}
					},
					Role: { type: 'string', enum: ['student', 'teacher', 'admin'] },
					User: {
						type: 'object',
						required: ['id', 'name', 'email', 'role'],
						properties: {
							id: { type: 'string' },
							name: { type: 'string' },
							email: { type: 'string', description: 'Untuk siswa berbentuk <NISN>@siswa.tts.id' },
							role: { $ref: '#/components/schemas/Role' },
							nisn: { type: ['string', 'null'] },
							birthDate: { type: ['string', 'null'], format: 'date' },
							grade: { type: ['integer', 'null'], minimum: 1, maximum: 6 },
							schoolName: { type: ['string', 'null'] },
							totalXp: { type: ['integer', 'null'] },
							totalStars: { type: ['integer', 'null'] }
						}
					},
					AuthResponse: {
						type: 'object',
						required: ['success', 'token', 'expiresAt', 'user'],
						properties: {
							success: { type: 'boolean' },
							token: { type: 'string', description: 'Simpan di penyimpanan aman perangkat, lalu kirim sebagai Bearer' },
							expiresAt: { type: 'string', format: 'date-time' },
							message: { type: 'string' },
							user: { $ref: '#/components/schemas/User' }
						}
					},
					Direction: { type: ['string', 'null'], enum: ['across', 'down', null], description: 'across = mendatar, down = menurun. null kalau soal belum diletakkan di grid.' },
					Question: {
						type: 'object',
						required: ['id', 'puzzleId', 'clue', 'answer'],
						properties: {
							id: { type: 'string' },
							puzzleId: { type: 'string' },
							clue: { type: 'string' },
							answer: { type: 'string', description: 'Huruf kapital tanpa spasi' },
							direction: { $ref: '#/components/schemas/Direction' },
							row: { type: ['integer', 'null'], description: 'Baris huruf pertama, mulai dari 0' },
							col: { type: ['integer', 'null'], description: 'Kolom huruf pertama, mulai dari 0' },
							number: { type: ['integer', 'null'], description: 'Nomor soal di grid' }
						}
					},
					Puzzle: {
						type: 'object',
						required: ['id', 'title', 'grade', 'subject', 'questions'],
						properties: {
							id: { type: 'string' },
							title: { type: 'string' },
							description: { type: ['string', 'null'] },
							grade: { type: 'integer', minimum: 1, maximum: 6 },
							subject: { type: 'string', example: 'Bahasa Indonesia' },
							orderIndex: { type: 'integer' },
							icon: { type: 'string', description: 'Nama ikon Iconify, contoh i-lucide-cat' },
							teacherId: { type: ['string', 'null'] },
							createdAt: { type: ['string', 'null'], format: 'date-time' },
							updatedAt: { type: ['string', 'null'], format: 'date-time' },
							questionCount: { type: 'integer' },
							questions: { type: 'array', items: { $ref: '#/components/schemas/Question' } }
						}
					},
					Progress: {
						type: 'object',
						properties: {
							puzzleId: { type: 'string' },
							score: { type: 'integer' },
							stars: { type: 'integer', minimum: 1, maximum: 3 },
							timeSeconds: { type: 'integer' },
							isCompleted: { type: 'integer', enum: [0, 1] },
							completedAt: { type: 'integer', description: 'Unix epoch dalam milidetik' }
						}
					},
					LeaderboardEntry: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							name: { type: 'string' },
							grade: { type: 'integer' },
							schoolName: { type: ['string', 'null'] },
							totalXp: { type: 'integer' },
							totalStars: { type: 'integer' }
						}
					},
					Success: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' }
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
	const subject = query.subject ? String(query.subject) : undefined

	const conditions = []
	if (grade !== undefined && !isNaN(grade)) {
		conditions.push(eq(schema.puzzles.grade, grade))
	}
	if (subject && subject !== 'Semua') {
		conditions.push(eq(schema.puzzles.subject, subject))
	}

	const puzzleList = conditions.length > 0
		? await db.select().from(schema.puzzles).where(and(...conditions)).orderBy(asc(schema.puzzles.orderIndex))
		: await db.select().from(schema.puzzles).orderBy(asc(schema.puzzles.grade), asc(schema.puzzles.orderIndex))

	if (puzzleList.length === 0) return []

	// Satu query untuk semua soal, bukan satu query per teka-teki
	const allQuestions = await db
		.select()
		.from(schema.questions)
		.where(inArray(schema.questions.puzzleId, puzzleList.map(p => p.id)))

	const byPuzzle = new Map<string, typeof allQuestions>()
	for (const q of allQuestions) {
		const list = byPuzzle.get(q.puzzleId) ?? []
		list.push(q)
		byPuzzle.set(q.puzzleId, list)
	}

	return puzzleList.map((p) => {
		const questions = byPuzzle.get(p.id) ?? []
		return { ...p, questionCount: questions.length, questions }
	})
})
