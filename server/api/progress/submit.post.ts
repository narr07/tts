import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

// Bintang dan XP dihitung di server dari jawaban yang dikirim, bukan dipercaya dari klien
function starsForTime(seconds: number) {
	return seconds < 60 ? 3 : seconds < 180 ? 2 : 1
}

defineRouteMeta({
	openAPI: {
		tags: ['Progres'],
		operationId: 'submitProgress',
		summary: 'Kirim jawaban teka-teki yang sudah selesai',
		security: [
			{
				bearerAuth: []
			},
			{
				cookieAuth: []
			}
		],
		description: 'Khusus siswa. Server memeriksa semua jawaban, lalu menghitung bintang dari waktu (di bawah 60 detik = 3, di bawah 180 detik = 2, selebihnya 1). Mengulang teka-teki yang sama hanya menambah selisih bintang yang lebih baik.',
		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: {
						type: 'object',
						required: ['puzzleId', 'answers'],
						properties: {
							puzzleId: {
								type: 'string'
							},
							answers: {
								type: 'object',
								description: 'Kunci: id soal, nilai: jawaban yang diketik siswa',
								additionalProperties: {
									type: 'string'
								},
								example: {
									q_puz_k1_1_0: 'KUCING'
								}
							},
							timeSeconds: {
								type: 'integer',
								minimum: 0
							}
						}
					}
				}
			}
		},
		responses: {
			200: {
				description: 'Progres tersimpan',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								success: {
									type: 'boolean'
								},
								earnedXp: {
									type: 'integer',
									description: 'XP untuk hasil ini'
								},
								stars: {
									type: 'integer',
									minimum: 1,
									maximum: 3
								},
								xpAdded: {
									type: 'integer',
									description: 'XP yang benar-benar ditambahkan ke akun'
								},
								starsAdded: {
									type: 'integer'
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
			},
			422: {
				description: 'Masih ada jawaban yang kosong atau salah',
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
	const { user } = await requireRole(event, ['student'])
	const studentId = user.id
	const body = await readBody(event)
	const { puzzleId, answers, timeSeconds } = body || {}

	if (!puzzleId || typeof answers !== 'object' || answers === null) {
		throw createError({
			statusCode: 400,
			statusMessage: 'puzzleId dan jawaban wajib disertakan.'
		})
	}

	const questions = await db.all(sql`
		SELECT id, answer FROM "questions"
		WHERE "puzzle_id" = ${String(puzzleId)} AND "direction" IS NOT NULL
	`) as { id: string; answer: string }[]

	if (questions.length === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Teka-teki tidak ditemukan.'
		})
	}

	const allCorrect = questions.every(q =>
		String(answers[q.id] ?? '').trim().toUpperCase() === q.answer.trim().toUpperCase()
	)

	if (!allCorrect) {
		throw createError({
			statusCode: 422,
			statusMessage: 'Jawaban belum lengkap atau masih ada yang salah.'
		})
	}

	const seconds = Math.max(0, Math.floor(Number(timeSeconds) || 0))
	const stars = starsForTime(seconds)
	const score = 100
	const earnedXp = 100 + (stars === 3 ? 50 : stars === 2 ? 25 : 0)
	const now = Date.now()

	const existing = await db.all(sql`
		SELECT id, stars FROM "student_progress"
		WHERE "student_id" = ${studentId} AND "puzzle_id" = ${puzzleId}
		LIMIT 1
	`)

	const isFirstTime = !existing || existing.length === 0
	let xpAdded: number
	let starsAdded: number

	if (isFirstTime) {
		const progId = `prog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
		await db.run(sql`
			INSERT INTO "student_progress" (id, student_id, puzzle_id, score, stars, time_seconds, is_completed, completed_at)
			VALUES (${progId}, ${studentId}, ${puzzleId}, ${score}, ${stars}, ${seconds}, 1, ${now})
		`)
		xpAdded = earnedXp
		starsAdded = stars
	} else {
		// Mengulang teka-teki yang sama hanya menambah selisih bintang yang lebih baik
		const oldStars = Number((existing[0] as any)?.stars || 0)
		starsAdded = Math.max(0, stars - oldStars)
		xpAdded = starsAdded * 20

		await db.run(sql`
			UPDATE "student_progress"
			SET "score" = MAX("score", ${score}),
			    "stars" = MAX("stars", ${stars}),
			    "time_seconds" = MIN("time_seconds", ${seconds})
			WHERE "student_id" = ${studentId} AND "puzzle_id" = ${puzzleId}
		`)
	}

	if (xpAdded > 0 || starsAdded > 0) {
		await db.run(sql`
			UPDATE "user"
			SET "totalXp" = "totalXp" + ${xpAdded},
			    "totalStars" = "totalStars" + ${starsAdded},
			    "updatedAt" = ${now}
			WHERE "id" = ${studentId}
		`)
		await refreshSessionCookieCache(event)
	}

	return {
		success: true,
		earnedXp,
		stars,
		xpAdded,
		starsAdded
	}
})
