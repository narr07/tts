export interface PuzzleSummary {
  id: string
  title: string
  description: string | null
  createdAt: string
  _count?: { questions: number }
}

export interface QuestionRow {
  id: string
  clue: string
  answer: string
  direction: string | null
  row: number | null
  col: number | null
  number: number | null
}

export interface PuzzleDetail {
  id: string
  title: string
  description: string | null
  createdAt: string
  questions: QuestionRow[]
}

export interface CellCoord {
  row: number
  col: number
}

export type CheckStatus = "correct" | "wrong" | undefined
