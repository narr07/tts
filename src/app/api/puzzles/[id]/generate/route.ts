import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateCrossword } from "@/lib/crossword"

// Generate the crossword layout from the puzzle's questions and persist
// the computed positions / numbers / directions back to the questions.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const puzzle = await db.puzzle.findUnique({
    where: { id },
    include: { questions: true },
  })
  if (!puzzle) {
    return NextResponse.json({ error: "Puzzle tidak ditemukan" }, { status: 404 })
  }

  if (puzzle.questions.length === 0) {
    return NextResponse.json(
      { error: "Belum ada soal. Tambahkan soal terlebih dahulu." },
      { status: 400 }
    )
  }

  const result = generateCrossword(
    puzzle.questions.map((q) => ({ clue: q.clue, answer: q.answer }))
  )

  // Persist placements. Questions that could be placed get their
  // row/col/direction/number; unplaced ones are reset to null.
  await db.$transaction(async (tx) => {
    // Reset everything first.
    await tx.question.updateMany({
      where: { puzzleId: id },
      data: { direction: null, row: null, col: null, number: null },
    })

    // Map answer -> placed word (first match). We update by id using the
    // original question ordering so duplicate answers don't collide.
    const usedIds = new Set<string>()
    for (const p of result.placed) {
      const question = puzzle.questions.find(
        (q) =>
          !usedIds.has(q.id) &&
          q.answer.toUpperCase().replace(/[^A-Z0-9]/g, "") === p.answer
      )
      if (!question) continue
      usedIds.add(question.id)
      await tx.question.update({
        where: { id: question.id },
        data: {
          direction: p.direction,
          row: p.row,
          col: p.col,
          number: p.number,
        },
      })
    }
  })

  const refreshed = await db.puzzle.findUnique({
    where: { id },
    include: { questions: { orderBy: { number: "asc" } } },
  })

  return NextResponse.json({
    puzzle: refreshed,
    grid: result.grid,
    width: result.width,
    height: result.height,
    unplaced: result.unplaced,
    placedCount: result.placed.length,
    totalCount: puzzle.questions.length,
  })
}
