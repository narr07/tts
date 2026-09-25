// Crossword auto-generation algorithm
// Takes a list of {clue, answer} entries and produces a grid layout
// by finding letter intersections between words.

export type Direction = "across" | "down"

export interface WordEntry {
  clue: string
  answer: string
}

export interface PlacedWord {
  clue: string
  answer: string
  direction: Direction
  row: number
  col: number
  number: number
}

export interface CrosswordResult {
  grid: (string | null)[][]
  placed: PlacedWord[]
  unplaced: WordEntry[]
  width: number
  height: number
}

interface Placement {
  row: number
  col: number
  direction: Direction
}

const key = (r: number, c: number) => `${r},${c}`

function placeLetter(
  grid: Map<string, string>,
  letter: string,
  r: number,
  c: number
) {
  grid.set(key(r, c), letter)
}

function canPlace(
  grid: Map<string, string>,
  word: string,
  row: number,
  col: number,
  direction: Direction
): { ok: boolean; intersections: number } {
  const dr = direction === "down" ? 1 : 0
  const dc = direction === "across" ? 1 : 0
  let intersections = 0

  for (let k = 0; k < word.length; k++) {
    const r = row + dr * k
    const c = col + dc * k
    const existing = grid.get(key(r, c))

    if (existing) {
      if (existing !== word[k]) return { ok: false, intersections: 0 }
      intersections++
    } else {
      // Empty cell: ensure perpendicular neighbours are empty so we don't
      // accidentally create side-by-side adjacencies.
      if (direction === "across") {
        if (grid.has(key(r - 1, c)) || grid.has(key(r + 1, c)))
          return { ok: false, intersections: 0 }
      } else {
        if (grid.has(key(r, c - 1)) || grid.has(key(r, c + 1)))
          return { ok: false, intersections: 0 }
      }
    }
  }

  // The cell immediately before the start must be empty (no extension).
  if (grid.has(key(row - dr, col - dc)))
    return { ok: false, intersections: 0 }
  // The cell immediately after the end must be empty.
  if (grid.has(key(row + dr * word.length, col + dc * word.length)))
    return { ok: false, intersections: 0 }

  // Must intersect at least one existing word.
  return { ok: intersections >= 1, intersections }
}

function findBestPlacement(
  word: string,
  placed: { answer: string; direction: Direction; row: number; col: number }[],
  grid: Map<string, string>
): Placement | null {
  let best: Placement | null = null
  let bestScore = -1

  for (let i = 0; i < word.length; i++) {
    const letter = word[i]
    for (const p of placed) {
      for (let j = 0; j < p.answer.length; j++) {
        if (p.answer[j] !== letter) continue

        let row: number, col: number, direction: Direction
        if (p.direction === "across") {
          direction = "down"
          row = p.row - i
          col = p.col + j
        } else {
          direction = "across"
          row = p.row + j
          col = p.col - i
        }

        const { ok, intersections } = canPlace(grid, word, row, col, direction)
        if (ok && intersections > bestScore) {
          bestScore = intersections
          best = { row, col, direction }
        }
      }
    }
  }

  return best
}

function assignNumbers(
  grid: (string | null)[][],
  placed: PlacedWord[]
) {
  const height = grid.length
  const width = height > 0 ? grid[0].length : 0
  const numberMap = new Map<string, number>()
  let num = 0

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!grid[r][c]) continue
      const startsAcross =
        (c === 0 || !grid[r][c - 1]) && c + 1 < width && !!grid[r][c + 1]
      const startsDown =
        (r === 0 || !grid[r - 1][c]) && r + 1 < height && !!grid[r + 1][c]
      if (startsAcross || startsDown) {
        num++
        numberMap.set(key(r, c), num)
      }
    }
  }

  for (const p of placed) {
    p.number = numberMap.get(key(p.row, p.col)) ?? 0
  }
}

export interface SavedQuestion {
  id: string
  clue: string
  answer: string
  direction: string | null
  row: number | null
  col: number | null
  number: number | null
}

export interface BuiltLayout {
  grid: (string | null)[][]
  placed: (PlacedWord & { id: string })[]
  width: number
  height: number
}

// Reconstruct a playable grid from previously-saved question placements.
export function buildLayoutFromSaved(
  questions: SavedQuestion[]
): BuiltLayout {
  const placed = questions
    .filter(
      (q) =>
        q.direction &&
        q.row !== null &&
        q.col !== null &&
        q.number !== null
    )
    .map((q) => ({
      id: q.id,
      clue: q.clue,
      answer: q.answer,
      direction: q.direction as Direction,
      row: q.row as number,
      col: q.col as number,
      number: q.number as number,
    }))
    .sort((a, b) => a.number - b.number)

  if (placed.length === 0) {
    return { grid: [], placed: [], width: 0, height: 0 }
  }

  let maxR = 0
  let maxC = 0
  for (const p of placed) {
    maxR = Math.max(maxR, p.row)
    maxC = Math.max(maxC, p.col)
    if (p.direction === "across") maxC = Math.max(maxC, p.col + p.answer.length - 1)
    else maxR = Math.max(maxR, p.row + p.answer.length - 1)
  }

  const height = maxR + 1
  const width = maxC + 1
  const grid: (string | null)[][] = Array.from({ length: height }, () =>
    Array(width).fill(null)
  )
  for (const p of placed) {
    for (let k = 0; k < p.answer.length; k++) {
      const r = p.direction === "down" ? p.row + k : p.row
      const c = p.direction === "across" ? p.col + k : p.col
      grid[r][c] = p.answer[k]
    }
  }

  return { grid, placed, width, height }
}

export function generateCrossword(entries: WordEntry[]): CrosswordResult {
  const words = entries
    .map((e) => ({
      clue: e.clue.trim(),
      answer: e.answer.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""),
    }))
    .filter((e) => e.answer.length >= 2 && e.clue.length > 0)

  if (words.length === 0) {
    return { grid: [], placed: [], unplaced: [], width: 0, height: 0 }
  }

  // Sort longest first for a better-connected grid.
  const sorted = [...words].sort((a, b) => b.answer.length - a.answer.length)

  const grid = new Map<string, string>()
  const placed: PlacedWord[] = []

  // Place the first (longest) word horizontally at origin.
  const first = sorted[0]
  for (let k = 0; k < first.answer.length; k++) {
    placeLetter(grid, first.answer[k], 0, k)
  }
  placed.push({
    clue: first.clue,
    answer: first.answer,
    direction: "across",
    row: 0,
    col: 0,
    number: 0,
  })

  // Try to place the rest, doing multiple passes so that a word which
  // couldn't be placed early may fit once later words open up new anchors.
  const queue = sorted.slice(1)
  const unplaced: WordEntry[] = []

  while (queue.length > 0) {
    let progress = false
    const nextQueue: WordEntry[] = []

    for (const w of queue) {
      const placement = findBestPlacement(w.answer, placed, grid)
      if (placement) {
        const dr = placement.direction === "down" ? 1 : 0
        const dc = placement.direction === "across" ? 1 : 0
        for (let k = 0; k < w.answer.length; k++) {
          placeLetter(grid, w.answer[k], placement.row + dr * k, placement.col + dc * k)
        }
        placed.push({
          clue: w.clue,
          answer: w.answer,
          direction: placement.direction,
          row: placement.row,
          col: placement.col,
          number: 0,
        })
        progress = true
      } else {
        nextQueue.push(w)
      }
    }

    if (!progress) {
      unplaced.push(...nextQueue)
      break
    }
    if (nextQueue.length === 0) break
    queue.length = 0
    queue.push(...nextQueue)
  }

  // Normalize coordinates so the grid starts at (0, 0).
  let minR = Infinity
  let minC = Infinity
  let maxR = -Infinity
  let maxC = -Infinity
  for (const k of grid.keys()) {
    const [r, c] = k.split(",").map(Number)
    if (r < minR) minR = r
    if (c < minC) minC = c
    if (r > maxR) maxR = r
    if (c > maxC) maxC = c
  }

  for (const p of placed) {
    p.row -= minR
    p.col -= minC
  }

  const height = maxR - minR + 1
  const width = maxC - minC + 1
  const grid2d: (string | null)[][] = Array.from({ length: height }, () =>
    Array(width).fill(null)
  )
  for (const [k, letter] of grid.entries()) {
    const [r, c] = k.split(",").map(Number)
    grid2d[r - minR][c - minC] = letter
  }

  assignNumbers(grid2d, placed)

  return { grid: grid2d, placed, unplaced, width, height }
}
