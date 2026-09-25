"use client"

import { useCallback, useEffect, useState } from "react"
import type { BuiltLayout } from "@/lib/crossword"
import { CrosswordGrid, type Selection } from "./crossword-grid"
import { CluesPanel } from "./clues-panel"
import { computeMeta, findActiveWordIndex, type GridMeta } from "./grid-meta"
import type { PuzzleDetail, PuzzleSummary } from "./types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, BookOpen, CheckCircle2, Puzzle as PuzzleIcon, RefreshCw } from "lucide-react"

export function PlayView() {
  const [puzzles, setPuzzles] = useState<PuzzleSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingList(true)
    fetch("/api/puzzles")
      .then((r) => r.json())
      .then((d) => {
        if (active) {
          setPuzzles(d.puzzles ?? [])
          setLoadingList(false)
        }
      })
      .catch(() => active && setLoadingList(false))
    return () => {
      active = false
    }
  }, [])

  if (selectedId) {
    return (
      <PlayBoard
        puzzleId={selectedId}
        onBack={() => setSelectedId(null)}
        onReloadList={() => {
          fetch("/api/puzzles")
            .then((r) => r.json())
            .then((d) => setPuzzles(d.puzzles ?? []))
        }}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Pilih Teka-Teki Silang</h2>
          <p className="text-sm text-muted-foreground">
            Pilih satu set puzzle untuk mulai bermain.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setLoadingList(true)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loadingList ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : puzzles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <div className="rounded-full bg-muted p-3">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Belum ada puzzle</p>
              <p className="text-sm text-muted-foreground">
                Admin belum membuat puzzle. Buka tab <b>Admin</b> untuk menambahkan.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {puzzles.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="text-left"
            >
              <Card className="h-full hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 p-2">
                      <PuzzleIcon className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                    </div>
                    <Badge variant="secondary">{p._count?.questions ?? 0} soal</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base line-clamp-1">{p.title}</CardTitle>
                  {p.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {p.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">Tidak ada deskripsi</p>
                  )}
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PlayBoard({
  puzzleId,
  onBack,
  onReloadList,
}: {
  puzzleId: string
  onBack: () => void
  onReloadList: () => void
}) {
  const [puzzle, setPuzzle] = useState<PuzzleDetail | null>(null)
  const [layout, setLayout] = useState<BuiltLayout | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Selection | null>(null)
  const [meta, setMeta] = useState<GridMeta | null>(null)
  const [progress, setProgress] = useState({ filled: 0, total: 0, solved: false })

  const handleProgress = useCallback(
    (filled: number, total: number, solved: boolean) => {
      setProgress((prev) =>
        prev.filled === filled && prev.total === total && prev.solved === solved
          ? prev
          : { filled, total, solved }
      )
    },
    []
  )

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/puzzles/${puzzleId}`)
      .then((r) => r.json())
      .then((d) => {
        setPuzzle(d.puzzle ?? null)
        setLayout(d.layout ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [puzzleId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    onReloadList()
  }, [puzzleId])

  const activeWordIndex = meta && selected ? findActiveWordIndex(meta, selected) : null

  const handleSelectWord = (index: number) => {
    if (!layout) return
    const w = layout.placed[index]
    if (!w) return
    setSelected({ row: w.row, col: w.col, direction: w.direction })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!puzzle) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Puzzle tidak ditemukan.</p>
          <Button className="mt-3" onClick={onBack}>
            Kembali
          </Button>
        </CardContent>
      </Card>
    )
  }

  const hasLayout = layout && layout.placed.length > 0

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
        </Button>
        <div className="min-w-0">
          <h2 className="text-xl font-bold truncate">{puzzle.title}</h2>
          {puzzle.description && (
            <p className="text-sm text-muted-foreground truncate">{puzzle.description}</p>
          )}
        </div>
      </div>

      {hasLayout && layout ? (
        <>
          <div className="flex items-center gap-3">
            <Progress
              value={progress.total ? (progress.filled / progress.total) * 100 : 0}
              className="flex-1 h-2"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {progress.filled}/{progress.total} terisi
            </span>
            {progress.solved && (
              <Badge className="bg-emerald-600 hover:bg-emerald-600">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Selesai
              </Badge>
            )}
          </div>

          <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
            <div className="bg-card rounded-xl border p-3 sm:p-4 inline-block">
              <CrosswordGrid
                layout={layout}
                selected={selected}
                onSelectedChange={setSelected}
                onProgressChange={handleProgress}
                metaRef={setMeta}
              />
            </div>
            <div className="min-w-0">
              <CluesPanel
                placed={layout.placed}
                activeWordIndex={activeWordIndex}
                onSelectWord={handleSelectWord}
              />
            </div>
          </div>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-10 flex flex-col items-center text-center gap-3">
            <div className="rounded-full bg-muted p-3">
              <PuzzleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Puzzle belum dibuat</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Admin perlu menambah soal lalu menekan tombol{" "}
                <b>Generate Kotak Silang</b> di tab Admin agar kotak silang muncul.
              </p>
            </div>
            <Button variant="outline" onClick={onBack}>
              Pilih puzzle lain
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
