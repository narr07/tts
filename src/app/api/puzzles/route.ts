import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const puzzles = await db.puzzle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true } },
    },
  })
  return NextResponse.json({ puzzles })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const title = (body?.title ?? "").toString().trim()
  const description = (body?.description ?? "").toString().trim()

  if (!title) {
    return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 })
  }

  const puzzle = await db.puzzle.create({
    data: { title, description: description || null },
  })
  return NextResponse.json({ puzzle }, { status: 201 })
}
