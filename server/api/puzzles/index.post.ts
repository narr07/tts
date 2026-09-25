import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
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
		teacherId: body.teacherId || null
	})

	if (Array.isArray(body.questions) && body.questions.length > 0) {
		const questionValues = body.questions.map((q: any, idx: number) => ({
			id: `q_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
			puzzleId,
			clue: q.clue.trim(),
			answer: q.answer.trim().toUpperCase(),
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
