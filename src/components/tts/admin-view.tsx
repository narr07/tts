"use client"

import { useCallback, useEffect, useState } from "react"
import type { BuiltLayout } from "@/lib/crossword"
import type { PuzzleDetail, PuzzleSummary, QuestionRow } from "./types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  Wand2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"

export function AdminView() {
  const [puzzles, setPuzzles] = useState<PuzzleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadPuzzles = useCallback(() => {
    setLoading(true)
    fetch("/api/puzzles")
      .then((r) => r.json())
      .then((d) => {
        setPuzzles(d.puzzles ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPuzzles()
  }, [loadPuzzles])

  if (selectedId) {
    return (
      <PuzzleManager
        puzzleId={selectedId}
        onBack={() => {
          setSelectedId(null)
          loadPuzzles()
        }}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Kelola Puzzle</h2>
          <p className="text-sm text-muted-foreground">
            Buat puzzle, masukkan soal, lalu generate kotak silang otomatis.
          </p>
        </div>
        <CreatePuzzleDialog onCreated={() => loadPuzzles()} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : puzzles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <div className="rounded-full bg-muted p-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Belum ada puzzle</p>
              <p className="text-sm text-muted-foreground">
                Buat puzzle pertama Anda untuk mulai menambahkan soal.
              </p>
            </div>
            <SampleDataButton onDone={() => loadPuzzles()} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {puzzles.map((p) => (
            <button key={p.id} onClick={() => setSelectedId(p.id)} className="text-left">
              <Card className="h-full hover:border-amber-400 hover:shadow-md transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1">{p.title}</CardTitle>
                    <Badge variant="secondary">{p._count?.questions ?? 0} soal</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {p.description || "Tidak ada deskripsi"}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CreatePuzzleDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const submit = async () => {
    if (!title.trim()) {
      toast({ title: "Judul wajib diisi", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/puzzles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat puzzle")
      toast({ title: "Puzzle dibuat", description: title })
      setTitle("")
      setDescription("")
      setOpen(false)
      onCreated()
    } catch (e) {
      toast({
        title: "Gagal",
        description: e instanceof Error ? e.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Puzzle Baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Puzzle Baru</DialogTitle>
          <DialogDescription>
            Beri nama puzzle, lalu tambahkan soal setelah dibuat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="p-title">Judul</Label>
            <Input
              id="p-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="contoh: TTS Indonesia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desc">Deskripsi (opsional)</Label>
            <Textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat tentang puzzle ini"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Buat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PuzzleManager({
  puzzleId,
  onBack,
}: {
  puzzleId: string
  onBack: () => void
}) {
  const [puzzle, setPuzzle] = useState<PuzzleDetail | null>(null)
  const [layout, setLayout] = useState<BuiltLayout | null>(null)
  const [loading, setLoading] = useState(true)
  const [clue, setClue] = useState("")
  const [answer, setAnswer] = useState("")
  const [adding, setAdding] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<{
    placed: number
    total: number
    unplaced: string[]
  } | null>(null)
  const { toast } = useToast()

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
    load()
  }, [load])

  const addQuestion = async () => {
    if (!clue.trim() || !answer.trim()) {
      toast({ title: "Petunjuk dan jawaban wajib diisi", variant: "destructive" })
      return
    }
    setAdding(true)
    try {
      const res = await fetch(`/api/puzzles/${puzzleId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clue, answer }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menambah soal")
      setClue("")
      setAnswer("")
      toast({ title: "Soal ditambahkan" })
      load()
    } catch (e) {
      toast({
        title: "Gagal",
        description: e instanceof Error ? e.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setAdding(false)
    }
  }

  const deleteQuestion = async (qid: string) => {
    try {
      await fetch(`/api/puzzles/${puzzleId}/questions/${qid}`, { method: "DELETE" })
      toast({ title: "Soal dihapus" })
      load()
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" })
    }
  }

  const generate = async () => {
    setGenerating(true)
    setGenResult(null)
    try {
      const res = await fetch(`/api/puzzles/${puzzleId}/generate`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal generate")
      setGenResult({
        placed: data.placedCount,
        total: data.totalCount,
        unplaced: (data.unplaced ?? []).map((u: { answer: string }) => u.answer),
      })
      toast({
        title: "Kotak silang dibuat",
        description: `${data.placedCount}/${data.totalCount} soal berhasil ditempatkan`,
      })
      load()
    } catch (e) {
      toast({
        title: "Gagal generate",
        description: e instanceof Error ? e.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const deletePuzzle = async () => {
    if (!confirm("Hapus puzzle ini beserta semua soalnya?")) return
    try {
      await fetch(`/api/puzzles/${puzzleId}`, { method: "DELETE" })
      toast({ title: "Puzzle dihapus" })
      onBack()
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" })
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat...</p>
  if (!puzzle)
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

  const placedCount = puzzle.questions.filter(
    (q) => q.direction && q.row !== null
  ).length
  const hasLayout = layout && layout.placed.length > 0

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold truncate">{puzzle.title}</h2>
          {puzzle.description && (
            <p className="text-sm text-muted-foreground truncate">{puzzle.description}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={deletePuzzle} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Generate bar */}
      <Card className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="py-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium text-sm">Generate Kotak Silang</p>
              <p className="text-xs text-muted-foreground">
                {puzzle.questions.length} soal · {placedCount} sudah ditempatkan
              </p>
            </div>
          </div>
          <Button onClick={generate} disabled={generating || puzzle.questions.length === 0} className="ml-auto">
            {generating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-1" />
            )}
            Generate
          </Button>
        </CardContent>
      </Card>

      {genResult && (
        <div
          className={
            genResult.unplaced.length > 0
              ? "flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 text-sm"
              : "flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 p-3 text-sm"
          }
        >
          {genResult.unplaced.length > 0 ? (
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          )}
          <div className="space-y-1">
            <p>
              <b>{genResult.placed}</b> dari <b>{genResult.total}</b> soal
              berhasil ditempatkan di kotak silang.
            </p>
            {genResult.unplaced.length > 0 && (
              <p className="text-muted-foreground">
                Tidak bisa ditempatkan (tidak ada huruf yang cocok / bentrok):{" "}
                <span className="font-mono">{genResult.unplaced.join(", ")}</span>.{" "}
                Tambah soal yang berhubungan agar bisa menyambung.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* Questions list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Daftar Soal</CardTitle>
              <Badge variant="secondary">{puzzle.questions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {puzzle.questions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10 px-4">
                Belum ada soal. Tambahkan soal di panel kanan.
              </p>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto tts-scroll">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                    <tr className="text-left text-muted-foreground">
                      <th className="font-medium px-4 py-2 w-16">No.</th>
                      <th className="font-medium px-4 py-2">Petunjuk</th>
                      <th className="font-medium px-4 py-2 w-28">Jawaban</th>
                      <th className="font-medium px-4 py-2 w-28">Arah</th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {puzzle.questions.map((q) => (
                      <QuestionRowItem
                        key={q.id}
                        q={q}
                        onDelete={() => deleteQuestion(q.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add question form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tambah Soal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="q-clue">Petunjuk / Pertanyaan</Label>
              <Textarea
                id="q-clue"
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                placeholder="contoh: Ibukota Indonesia"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-answer">Jawaban</Label>
              <Input
                id="q-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="contoh: JAKARTA"
                className="uppercase font-mono"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addQuestion()
                }}
              />
              <p className="text-xs text-muted-foreground">
                Hanya huruf & angka. Spasi akan dihapus otomatis.
              </p>
            </div>
            <Button onClick={addQuestion} disabled={adding} className="w-full">
              {adding ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Tambah Soal
            </Button>

            {hasLayout && layout && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Preview Kotak Silang
                </p>
                <div className="overflow-x-auto rounded-md border p-2 bg-muted/30">
                  <MiniGrid layout={layout} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuestionRowItem({
  q,
  onDelete,
}: {
  q: QuestionRow
  onDelete: () => void
}) {
  return (
    <tr className="border-t hover:bg-muted/40">
      <td className="px-4 py-2 text-muted-foreground">
        {q.number ?? "-"}
      </td>
      <td className="px-4 py-2">{q.clue}</td>
      <td className="px-4 py-2 font-mono font-medium">{q.answer}</td>
      <td className="px-4 py-2">
        {q.direction ? (
          <Badge variant="outline" className="text-xs">
            {q.direction === "across" ? "Mendatar" : "Menurun"}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">belum</span>
        )}
      </td>
      <td className="px-4 py-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  )
}

function MiniGrid({ layout }: { layout: BuiltLayout }) {
  const { grid, width, height } = layout
  const size = "14px"
  return (
    <div
      className="inline-grid"
      style={{
        gridTemplateColumns: `repeat(${width}, ${size})`,
        gridTemplateRows: `repeat(${height}, ${size})`,
      }}
    >
      {Array.from({ length: height }).map((_, r) =>
        Array.from({ length: width }).map((_, c) => {
          const letter = grid[r]?.[c]
          return (
            <div
              key={`${r}-${c}`}
              className={
                letter
                  ? "border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  : "bg-neutral-800 dark:bg-neutral-950"
              }
              style={{ width: size, height: size }}
            />
          )
        })
      )}
    </div>
  )
}

const SAMPLE_QUESTIONS: { clue: string; answer: string }[] = [
  { clue: "Ibukota negara Indonesia", answer: "JAKARTA" },
  { clue: "Burung simbol negara Indonesia", answer: "GARUDA" },
  { clue: "Warna atas pada bendera Indonesia", answer: "MERAH" },
  { clue: "Pulau terbesar di Indonesia bagian barat", answer: "SUMATERA" },
  { clue: "Kain tradisional Indonesia", answer: "BATIK" },
  { clue: "Makanan pokok orang Indonesia", answer: "NASI" },
  { clue: "Makanan khas Padang dari daging", answer: "RENDANG" },
  { clue: "Buah berwarna oranye dan asam", answer: "JERUK" },
  { clue: "Sebutan untuk kepulauan Indonesia", answer: "NUSANTARA" },
  { clue: "Penutup kepala", answer: "TOPI" },
]

function SampleDataButton({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const createRes = await fetch("/api/puzzles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "TTS Indonesia (Contoh)",
          description: "Puzzle contoh tentang Indonesia",
        }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error)
      const pid = createData.puzzle.id

      for (const q of SAMPLE_QUESTIONS) {
        await fetch(`/api/puzzles/${pid}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(q),
        })
      }
      await fetch(`/api/puzzles/${pid}/generate`, { method: "POST" })
      toast({ title: "Contoh berhasil dimuat", description: "Cek tab Bermain" })
      onDone()
    } catch (e) {
      toast({
        title: "Gagal memuat contoh",
        description: e instanceof Error ? e.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={load} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-1" />
      )}
      Muat Contoh Soal
    </Button>
  )
}
