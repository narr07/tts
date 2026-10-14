import { db, schema } from 'hub:db'
import { generateCrossword } from '~~/app/utils/crossword'

defineRouteMeta({
	openAPI: {
		tags: ['Admin'],
		operationId: 'seedPuzzles',
		summary: 'Isi teka-teki contoh',
		security: [
			{
				bearerAuth: []
			},
			{
				cookieAuth: []
			}
		],
		description: 'Khusus admin. Tidak melakukan apa-apa kalau database sudah berisi teka-teki.',
		responses: {
			200: {
				description: 'Hasil seed',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								success: {
									type: 'boolean'
								},
								message: {
									type: 'string'
								},
								puzzleId: {
									type: 'string'
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

	const existing = await db.select().from(schema.puzzles).limit(1)

	if (existing.length > 0) {
		return { message: 'Database sudah terisi' }
	}

	const sampleEntries = [
		{ clue: 'Ibu kota negara Indonesia', answer: 'NUSANTARA' },
		{ clue: 'Gunung tertinggi di pulau Jawa', answer: 'SEMERU' },
		{ clue: 'Kain tradisional khas Nusantara dengan teknik malam', answer: 'BATIK' },
		{ clue: 'Danau vulkanik terbesar di Asia Tenggara', answer: 'TOBA' },
		{ clue: 'Alat musik tradisional bambu dari Jawa Barat', answer: 'ANGKLUNG' },
		{ clue: 'Candi Buddha terbesar di dunia yang terletak di Magelang', answer: 'BOROBUDUR' },
		{ clue: 'Senjata tradisional khas suku Jawa dengan bilah berlekuk', answer: 'KERIS' },
		{ clue: 'Rumah adat khas Minangkabau dengan atap gonjong', answer: 'GADANG' }
	]

	const generated = generateCrossword(sampleEntries)
	const puzzleId = 'puzzle_indonesia_nusantara'

	await db.insert(schema.puzzles).values({
		id: puzzleId,
		title: 'Pesona Budaya & Geografi Indonesia',
		description: 'Uji wawasan Anda seputar kekayaan alam, budaya, dan sejarah Nusantara!'
	})

	const questionValues = generated.placed.map((p, idx) => ({
		id: `q_seed_${idx}`,
		puzzleId,
		clue: p.clue,
		answer: p.answer,
		direction: p.direction,
		row: p.row,
		col: p.col,
		number: p.number
	}))

	if (questionValues.length > 0) {
		await db.insert(schema.questions).values(questionValues)
	}

	return {
		success: true,
		message: 'Data awal berhasil di-seed!',
		puzzleId
	}
})
