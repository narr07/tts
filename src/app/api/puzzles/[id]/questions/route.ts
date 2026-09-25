import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Add a question to a puzzle
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const clue = (body?.clue ?? "").toString().trim()
  const answer = (body?.answer ?? "").toString().trim()

  if (!clue || !answer) {
    return NextResponse.json(
      { error: "Petunjuk dan jawaban wajib diisi" },
      { status: 400 }
    )
  }

  const puzzle = await db.puzzle.findUnique({ where: { id } })
  if (!puzzle) {
    return NextResponse.json({ error: "Puzzle tidak ditemukan" }, { status: 404 })
  }

  const question = await db.question.create({
    data: {
      puzzleId: id,
      clue,
      answer: answer.toUpperCase().replace(/\s+/g, ""),
    },
  })
  return NextResponse.json({ question }, { status: 201 })
}
