"use client"

import { useState } from "react"
import { PlayView } from "@/components/tts/play-view"
import { AdminView } from "@/components/tts/admin-view"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Puzzle, Gamepad2, Settings2 } from "lucide-react"

export default function Home() {
  const [tab, setTab] = useState<"play" | "admin">("play")

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/50 via-background to-background dark:from-amber-950/10">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="grid place-items-center rounded-xl bg-amber-500 text-white h-9 w-9 shadow-sm">
              <Puzzle className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight">
                Teka Teki Silang
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Generate otomatis · Isi kata · Periksa jawaban
              </p>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "play" | "admin")}>
            <TabsList>
              <TabsTrigger value="play" className="gap-1.5">
                <Gamepad2 className="h-4 w-4" />
                <span className="hidden sm:inline">Bermain</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-1.5">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        {tab === "play" ? <PlayView /> : <AdminView />}
      </main>

      <footer className="mt-auto border-t bg-background/80">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            Dibuat dengan Next.js · Kotak silang di-generate otomatis dari daftar
            soal.
          </p>
          <p>© {new Date().getFullYear()} Teka Teki Silang</p>
        </div>
      </footer>
    </div>
  )
}
