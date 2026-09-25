"use client"

import type { BuiltLayout } from "@/lib/crossword"
import { cn } from "@/lib/utils"
import { ArrowRight, ArrowDown } from "lucide-react"

interface CluesPanelProps {
  placed: BuiltLayout["placed"]
  activeWordIndex: number | null
  onSelectWord: (index: number) => void
}

export function CluesPanel({
  placed,
  activeWordIndex,
  onSelectWord,
}: CluesPanelProps) {
  const across = placed
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p.direction === "across")
    .sort((a, b) => a.p.number - b.p.number)
  const down = placed
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p.direction === "down")
    .sort((a, b) => a.p.number - b.p.number)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ClueList
        title="Mendatar"
        icon={<ArrowRight className="h-4 w-4" />}
        items={across}
        activeWordIndex={activeWordIndex}
        onSelectWord={onSelectWord}
      />
      <ClueList
        title="Menurun"
        icon={<ArrowDown className="h-4 w-4" />}
        items={down}
        activeWordIndex={activeWordIndex}
        onSelectWord={onSelectWord}
      />
    </div>
  )
}

function ClueList({
  title,
  icon,
  items,
  activeWordIndex,
  onSelectWord,
}: {
  title: string
  icon: React.ReactNode
  items: { p: BuiltLayout["placed"][number]; i: number }[]
  activeWordIndex: number | null
  onSelectWord: (index: number) => void
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/40">
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {items.length} soal
        </span>
      </div>
      <ul className="max-h-72 overflow-y-auto p-2 space-y-1 tts-scroll">
        {items.length === 0 && (
          <li className="text-sm text-muted-foreground px-2 py-3 text-center">
            Belum ada soal
          </li>
        )}
        {items.map(({ p, i }) => {
          const active = i === activeWordIndex
          return (
            <li key={`${p.direction}-${p.number}-${i}`}>
              <button
                type="button"
                onClick={() => onSelectWord(i)}
                className={cn(
                  "w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors flex gap-2",
                  active
                    ? "bg-amber-100 dark:bg-amber-900/40 text-foreground"
                    : "hover:bg-muted"
                )}
              >
                <span className="font-semibold text-amber-700 dark:text-amber-400 min-w-[1.5rem]">
                  {p.number}.
                </span>
                <span className="flex-1">{p.clue}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
