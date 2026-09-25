"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import type { BuiltLayout } from "@/lib/crossword"
import { Check, Eraser, Lightbulb, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cellKey, computeMeta, type GridMeta } from "./grid-meta"

export interface Selection {
  row: number
  col: number
  direction: "across" | "down"
}

interface CrosswordGridProps {
  layout: BuiltLayout
  selected: Selection | null
  onSelectedChange: React.Dispatch<React.SetStateAction<Selection | null>>
  onProgressChange?: (filled: number, total: number, solved: boolean) => void
  metaRef?: (meta: GridMeta) => void
}

export function CrosswordGrid({
  layout,
  selected,
  onSelectedChange,
  onProgressChange,
  metaRef,
}: CrosswordGridProps) {
  const { grid, placed, width, height } = layout
  const [inputs, setInputs] = useState<string[][]>([])
  const [checked, setChecked] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  const meta = useMemo(() => computeMeta(layout), [layout])

  useEffect(() => {
    metaRef?.(meta)
  }, [meta, metaRef])

  // Initialise / reset inputs when the grid changes.
  useEffect(() => {
    setInputs(Array.from({ length: height }, () => Array(width).fill("")))
    setChecked(false)
    setRevealed(false)
    // auto-select the first white cell
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (grid[r]?.[c]) {
          const wi = meta.wordIndex.get(cellKey(r, c))
          const direction: "across" | "down" =
            wi?.across !== undefined ? "across" : "down"
          onSelectedChange({ row: r, col: c, direction })
          setTimeout(() => inputRefs.current.get(cellKey(r, c))?.focus(), 0)
          return
        }
      }
    }
  }, [grid, width, height])

  // Keep the focused input in sync with selection (e.g. clue clicks).
  useEffect(() => {
    if (!selected) return
    const el = inputRefs.current.get(cellKey(selected.row, selected.col))
    if (el && document.activeElement !== el) {
      el.focus()
    }
  }, [selected])

  // Report progress.
  useEffect(() => {
    if (!onProgressChange) return
    let filled = 0
    let correct = 0
    let total = 0
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (grid[r]?.[c]) {
          total++
          const v = inputs[r]?.[c] ?? ""
          if (v) {
            filled++
            if (v === grid[r][c]) correct++
          }
        }
      }
    }
    onProgressChange(filled, total, correct === total && total > 0)
  }, [inputs, grid, width, height, onProgressChange])

  const currentWordCells = useMemo(() => {
    if (!selected) return []
    const wi = meta.wordIndex.get(cellKey(selected.row, selected.col))
    let idx = wi?.[selected.direction]
    if (idx === undefined) idx = wi?.across ?? wi?.down
    if (idx === undefined) return []
    return meta.wordCells[idx]
  }, [selected, meta])

  const isHighlighted = useCallback(
    (r: number, c: number) =>
      currentWordCells.some((cell) => cell.row === r && cell.col === c),
    [currentWordCells]
  )

  const moveWithinWord = useCallback(
    (r: number, c: number, direction: "across" | "down", delta: number) => {
      const wi = meta.wordIndex.get(cellKey(r, c))
      const idx = wi?.[direction]
      if (idx === undefined) return null
      const cells = meta.wordCells[idx]
      const pos = cells.findIndex((cell) => cell.row === r && cell.col === c)
      if (pos === -1) return null
      return cells[pos + delta] ?? null
    },
    [meta]
  )

  const stepDirection = useCallback(
    (r: number, c: number, dr: number, dc: number) => {
      let nr = r + dr
      let nc = c + dc
      while (nr >= 0 && nr < height && nc >= 0 && nc < width) {
        if (grid[nr]?.[nc]) return { row: nr, col: nc }
        nr += dr
        nc += dc
      }
      return null
    },
    [grid, width, height]
  )

  const focusCell = (r: number, c: number) => {
    inputRefs.current.get(cellKey(r, c))?.focus()
  }

  const handleChange = (r: number, c: number, raw: string) => {
    const ch = raw.slice(-1).toUpperCase().replace(/[^A-Z0-9]/g, "")
    setInputs((prev) => {
      const next = prev.map((row) => [...row])
      next[r][c] = ch
      return next
    })
    setChecked(false)
    if (ch && selected) {
      const next = moveWithinWord(r, c, selected.direction, 1)
      if (next) setTimeout(() => focusCell(next.row, next.col), 0)
    }
  }

  const handleKeyDown = (
    r: number,
    c: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const setDir = (direction: "across" | "down") => {
      const wi = meta.wordIndex.get(cellKey(r, c))
      if (direction === "across" && wi?.across === undefined) return
      if (direction === "down" && wi?.down === undefined) return
      onSelectedChange({ row: r, col: c, direction })
    }

    if (e.key === "Backspace") {
      e.preventDefault()
      const current = inputs[r]?.[c] ?? ""
      if (current) {
        setInputs((prev) => {
          const next = prev.map((row) => [...row])
          next[r][c] = ""
          return next
        })
        setChecked(false)
      } else if (selected) {
        const prev = moveWithinWord(r, c, selected.direction, -1)
        if (prev) {
          setInputs((p) => {
            const next = p.map((row) => [...row])
            next[prev.row][prev.col] = ""
            return next
          })
          setChecked(false)
          focusCell(prev.row, prev.col)
        }
      }
      return
    }

    if (e.key === "ArrowRight") {
      e.preventDefault()
      setDir("across")
      const t = stepDirection(r, c, 0, 1)
      if (t) focusCell(t.row, t.col)
      return
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      setDir("across")
      const t = stepDirection(r, c, 0, -1)
      if (t) focusCell(t.row, t.col)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setDir("down")
      const t = stepDirection(r, c, 1, 0)
      if (t) focusCell(t.row, t.col)
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setDir("down")
      const t = stepDirection(r, c, -1, 0)
      if (t) focusCell(t.row, t.col)
      return
    }

    if (e.key === " ") {
      e.preventDefault()
      const wi = meta.wordIndex.get(cellKey(r, c))
      const newDir = selected?.direction === "across" ? "down" : "across"
      if (newDir === "across" && wi?.across === undefined) return
      if (newDir === "down" && wi?.down === undefined) return
      onSelectedChange({ row: r, col: c, direction: newDir })
      return
    }
  }

  const handleCellClick = (r: number, c: number) => {
    const wi = meta.wordIndex.get(cellKey(r, c))
    onSelectedChange((prev) => {
      if (prev && prev.row === r && prev.col === c) {
        const newDir = prev.direction === "across" ? "down" : "across"
        if (newDir === "across" && wi?.across === undefined) return prev
        if (newDir === "down" && wi?.down === undefined) return prev
        return { row: r, col: c, direction: newDir }
      }
      const direction: "across" | "down" =
        wi?.across !== undefined ? "across" : "down"
      return { row: r, col: c, direction }
    })
  }

  const handleCheck = () => {
    setChecked(true)
    setRevealed(false)
  }

  const handleReset = () => {
    setInputs(Array.from({ length: height }, () => Array(width).fill("")))
    setChecked(false)
    setRevealed(false)
  }

  const handleReveal = () => {
    setInputs(
      Array.from({ length: height }, (_, r) =>
        Array.from({ length: width }, (_, c) => grid[r]?.[c] ?? "")
      )
    )
    setChecked(false)
    setRevealed(true)
  }

  const cellStatus = (r: number, c: number): "correct" | "wrong" | null => {
    if (!checked) return null
    const v = inputs[r]?.[c] ?? ""
    if (!v) return null
    return v === grid[r]?.[c] ? "correct" : "wrong"
  }

  const cellSize = "clamp(26px, 7.2vw, 42px)"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleCheck}>
          <Check className="mr-1.5 h-4 w-4" /> Periksa
        </Button>
        <Button size="sm" onClick={handleReveal} variant="outline">
          <Lightbulb className="mr-1.5 h-4 w-4" /> Lihat Jawaban
        </Button>
        <Button size="sm" onClick={handleReset} variant="outline">
          <Eraser className="mr-1.5 h-4 w-4" /> Reset
        </Button>
      </div>

      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div
          className="inline-grid"
          style={{
            gridTemplateColumns: `repeat(${width}, ${cellSize})`,
            gridTemplateRows: `repeat(${height}, ${cellSize})`,
          }}
        >
          {Array.from({ length: height }).map((_, r) =>
            Array.from({ length: width }).map((_, c) => {
              const letter = grid[r]?.[c]
              const isBlock = !letter
              const num = meta.cellNumber.get(cellKey(r, c))
              const isSelected = selected?.row === r && selected?.col === c
              const highlighted = isHighlighted(r, c)
              const status = cellStatus(r, c)

              if (isBlock) {
                return (
                  <div
                    key={cellKey(r, c)}
                    className="bg-neutral-800 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                    style={{ width: cellSize, height: cellSize }}
                  />
                )
              }

              return (
                <div
                  key={cellKey(r, c)}
                  className={cn(
                    "relative border border-neutral-300 dark:border-neutral-700",
                    revealed && "bg-emerald-50 dark:bg-emerald-950/40",
                    !revealed &&
                      status === "correct" &&
                      "bg-emerald-100 dark:bg-emerald-900/50",
                    !revealed &&
                      status === "wrong" &&
                      "bg-rose-100 dark:bg-rose-900/50",
                    !revealed &&
                      !status &&
                      isSelected &&
                      "bg-amber-200 dark:bg-amber-900/60",
                    !revealed &&
                      !status &&
                      highlighted &&
                      !isSelected &&
                      "bg-amber-50 dark:bg-amber-900/30",
                    !revealed &&
                      !status &&
                      !highlighted &&
                      "bg-white dark:bg-neutral-950"
                  )}
                  style={{ width: cellSize, height: cellSize }}
                >
                  {num !== undefined && (
                    <span className="absolute top-0 left-0.5 text-[8px] leading-[10px] font-semibold text-neutral-500 dark:text-neutral-400 select-none pointer-events-none">
                      {num}
                    </span>
                  )}
                  <input
                    ref={(el) => {
                      if (el) inputRefs.current.set(cellKey(r, c), el)
                      else inputRefs.current.delete(cellKey(r, c))
                    }}
                    value={inputs[r]?.[c] ?? ""}
                    onChange={(e) => handleChange(r, c, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(r, c, e)}
                    onFocus={() => {
                      const wi = meta.wordIndex.get(cellKey(r, c))
                      onSelectedChange((prev) => {
                        const keepDir = prev?.direction
                        if (keepDir) {
                          const has =
                            keepDir === "across"
                              ? wi?.across !== undefined
                              : wi?.down !== undefined
                          if (has) return { row: r, col: c, direction: keepDir }
                        }
                        const direction: "across" | "down" =
                          wi?.across !== undefined ? "across" : "down"
                        return { row: r, col: c, direction }
                      })
                    }}
                    onClick={() => handleCellClick(r, c)}
                    inputMode="text"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={1}
                    aria-label={`Baris ${r + 1} kolom ${c + 1}`}
                    className={cn(
                      "w-full h-full bg-transparent text-center font-bold uppercase text-neutral-900 dark:text-neutral-100",
                      "focus:outline-none text-sm sm:text-base pt-1.5"
                    )}
                  />
                </div>
              )
            })
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <RefreshCw className="h-3 w-3" />
        Klik kotak untuk berganti arah (mendatar / menurun). Gunakan tombol panah untuk berpindah.
      </p>
    </div>
  )
}
