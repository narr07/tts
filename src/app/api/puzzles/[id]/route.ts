import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { buildLayoutFromSaved } from "@/lib/crossword"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const puzzle = await db.puzzle.findUnique({
    where: { id },
    include: { questions: { orderBy: { number: "asc" } } },
  })
  if (!puzzle) {
    return NextResponse.json({ error: "Puzzle tidak ditemukan" }, { status: 404 })
  }
  const layout = buildLayoutFromSaved(puzzle.questions)
  return NextResponse.json({ puzzle, layout })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const title = (body?.title ?? "").toString().trim()
  const description = (body?.description ?? "").toString().trim()

  const data: { title?: string; description?: string | null } = {}
  if (title) data.title = title
  if (description !== undefined) data.description = description || null

  const puzzle = await db.puzzle.update({ where: { id }, data })
  return NextResponse.json({ puzzle })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.puzzle.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
