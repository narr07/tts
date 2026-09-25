import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const { id, questionId } = await params
  await db.question.deleteMany({ where: { id: questionId, puzzleId: id } })
  return NextResponse.json({ ok: true })
}
