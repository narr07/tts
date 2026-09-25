import type { BuiltLayout } from "@/lib/crossword"

export const cellKey = (r: number, c: number) => `${r},${c}`

export interface GridMeta {
  cellNumber: Map<string, number>
  wordIndex: Map<string, { across?: number; down?: number }>
  wordCells: { row: number; col: number }[][]
}

export function computeMeta(layout: BuiltLayout): GridMeta {
  const cellNumber = new Map<string, number>()
  const wordIndex = new Map<string, { across?: number; down?: number }>()
  const wordCells: { row: number; col: number }[][] = []

  layout.placed.forEach((p, idx) => {
    const cells: { row: number; col: number }[] = []
    for (let k = 0; k < p.answer.length; k++) {
      const r = p.direction === "down" ? p.row + k : p.row
      const c = p.direction === "across" ? p.col + k : p.col
      cells.push({ row: r, col: c })
      const entry = wordIndex.get(cellKey(r, c)) ?? {}
      if (p.direction === "across") entry.across = idx
      else entry.down = idx
      wordIndex.set(cellKey(r, c), entry)
    }
    wordCells.push(cells)
    cellNumber.set(cellKey(p.row, p.col), p.number)
  })

  return { cellNumber, wordIndex, wordCells }
}

export function findActiveWordIndex(
  meta: GridMeta,
  selected: { row: number; col: number; direction: "across" | "down" } | null
): number | null {
  if (!selected) return null
  const wi = meta.wordIndex.get(cellKey(selected.row, selected.col))
  if (!wi) return null
  const idx = wi[selected.direction]
  if (idx !== undefined) return idx
  return wi.across !== undefined ? wi.across : wi.down ?? null
}
