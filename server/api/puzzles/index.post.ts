import { db, schema } from 'hub:db'

defineRouteMeta({
	openAPI: {
		tags: ['Studio Guru'],
		operationId: 'createPuzzle',
		summary: 'Simpan teka-teki baru',
		security: [
			{
				bearerAuth: []
			},
			{
				cookieAuth: []
			}
		],
		description: 'Khusus guru dan admin. Posisi soal (row, col, direction, number) dihitung di sisi pembuat sebelum dikirim.',
		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: {
						type: 'object',
						required: ['title'],
						properties: {
							title: {
								type: 'string'
							},
							description: {
								type: 'string'
							},
							grade: {
								type: 'integer',
								minimum: 1,
								maximum: 6
							},
							subject: {
								type: 'string'
							},
							orderIndex: {
								type: 'integer'
							},
							icon: {
								type: 'string'
							},
							questions: {
								type: 'array',
								items: {
									type: 'object',
									required: ['clue', 'answer'],
									properties: {
										clue: {
											type: 'string'
										},
										answer: {
											type: 'string'
										},
										direction: {
											$ref: '#/components/schemas/Direction'
										},
										row: {
											type: ['integer', 'null']
										},
										col: {
											type: ['integer', 'null']
										},
										number: {
											type: ['integer', 'null']
										}
									}
								}
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
								id: {
									type: 'string'
								},
								message: {
									type: 'string'
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
			}
		}
	}
})

export default defineEventHandler(async (event) => {
	const { user } = await requireRole(event, ['teacher', 'admin'])
	const body = await readBody(event)

	if (!body.title || !body.title.trim()) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Judul teka-teki silang wajib diisi'
		})
	}

	const puzzleId = `puzzle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

	await db.insert(schema.puzzles).values({
		id: puzzleId,
		title: body.title.trim(),
		description: body.description?.trim() || '',
		grade: body.grade ? Number(body.grade) : 1,
		subject: body.subject ? String(body.subject) : 'Bahasa Indonesia',
		orderIndex: body.orderIndex ? Number(body.orderIndex) : 1,
		icon: body.icon ? String(body.icon) : 'i-lucide-book-open',
		teacherId: user.id
	})

	if (Array.isArray(body.questions) && body.questions.length > 0) {
		const invalid = body.questions.some((q: any) => !String(q?.clue ?? '').trim() || !String(q?.answer ?? '').trim())
		if (invalid) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Setiap soal wajib punya petunjuk dan jawaban.'
			})
		}

		const questionValues = body.questions.map((q: any, idx: number) => ({
			id: `q_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
			puzzleId,
			clue: String(q.clue).trim(),
			answer: String(q.answer).trim().toUpperCase(),
			direction: q.direction || null,
			row: q.row !== undefined && q.row !== null ? Number(q.row) : null,
			col: q.col !== undefined && q.col !== null ? Number(q.col) : null,
			number: q.number !== undefined && q.number !== null ? Number(q.number) : null
		}))

		await db.insert(schema.questions).values(questionValues)
	}

	return {
		success: true,
		id: puzzleId,
		message: 'Teka-teki silang berhasil disimpan!'
	}
})
