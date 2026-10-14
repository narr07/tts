<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import confetti from 'canvas-confetti'
import { useCrosswordStore } from '~/stores/crosswordStore'
import { useAuthStore } from '~/stores/authStore'
import { cellKey, type PlacedWord } from '~/utils/crossword'

const props = defineProps<{
	hasNext?: boolean
}>()

const emit = defineEmits<{
	(e: 'next' | 'backToPath'): void
}>()

const store = useCrosswordStore()
const auth = useAuthStore()

const inputRefs = ref<Record<string, HTMLInputElement | null>>({})
const modalInputRefs = ref<Record<number, HTMLInputElement | null>>({})

const isModalOpen = ref(false)
const isVictoryModalOpen = ref(false)
const earnedXp = ref(100)
// null = belum ada jawaban dari server (tamu, atau gagal tersimpan)
const xpAdded = ref<number | null>(null)
const isSavingResult = ref(false)
const earnedStars = ref(3)

const layout = computed(() => store.layout)

const getCell = (r: number, c: number) => store.userInputs[r]?.[c] ?? ''
function setCell(r: number, c: number, val: string) {
	const row = store.userInputs[r]
	if (row) row[c] = val
}
const meta = computed(() => store.meta)
const selected = computed(() => store.selected)
const userInputs = computed(() => store.userInputs)

// Soal aktif saat ini
const activePlacedWord = computed<PlacedWord | null>(() => {
	if (!selected.value) return null
	const wi = meta.value.wordIndex.get(cellKey(selected.value.row, selected.value.col))
	let idx = wi?.[selected.value.direction]
	if (idx === undefined) idx = wi?.across ?? wi?.down
	if (idx === undefined) return null
	return layout.value.placed[idx] || null
})

// Info kedua arah jika sel adalah persimpangan (Across & Down)
const cellClues = computed(() => {
	if (!selected.value) return { across: null, down: null }
	const wi = meta.value.wordIndex.get(cellKey(selected.value.row, selected.value.col))
	return {
		across: wi?.across !== undefined ? layout.value.placed[wi.across] : null,
		down: wi?.down !== undefined ? layout.value.placed[wi.down] : null
	}
})

const currentWordCells = computed(() => {
	if (!selected.value) return []
	const wi = meta.value.wordIndex.get(cellKey(selected.value.row, selected.value.col))
	let idx = wi?.[selected.value.direction]
	if (idx === undefined) idx = wi?.across ?? wi?.down
	if (idx === undefined) return []
	return meta.value.wordCells[idx] || []
})

const activeWordCellSet = computed(() => {
	const set = new Set<string>()
	for (const cell of currentWordCells.value) {
		set.add(cellKey(cell.row, cell.col))
	}
	return set
})

function setInputRef(el: any, r: number, c: number) {
	if (el) {
		inputRefs.value[cellKey(r, c)] = el as HTMLInputElement
	}
}

function setModalInputRef(el: any, idx: number) {
	if (el) {
		modalInputRefs.value[idx] = el as HTMLInputElement
	}
}

// Cincin seleksi adalah indikator fokus grid, jadi seleksi ikut pindah saat kotak difokus dengan Tab
function handleCellFocus(r: number, c: number) {
	if (selected.value?.row === r && selected.value?.col === c) return
	const wi = meta.value.wordIndex.get(cellKey(r, c))
	if (!wi) return
	const keep = selected.value?.direction ?? 'across'
	const direction = wi[keep] !== undefined ? keep : (keep === 'across' ? 'down' : 'across')
	store.selected = { row: r, col: c, direction }
}

function handleCellClick(r: number, c: number) {
	if (!layout.value.grid[r]?.[c]) return

	const wi = meta.value.wordIndex.get(cellKey(r, c))
	if (!wi) return

	if (selected.value?.row === r && selected.value?.col === c) {
		// Klik di kotak yang sama: toggle arah jika ada persimpangan
		if (wi.across !== undefined && wi.down !== undefined) {
			store.selected = {
				row: r,
				col: c,
				direction: selected.value.direction === 'across' ? 'down' : 'across'
			}
		}
	} else {
		// Klik di kotak baru: sesuaikan arah
		let dir = selected.value?.direction || 'across'
		if (dir === 'across' && wi.across === undefined && wi.down !== undefined) {
			dir = 'down'
		} else if (dir === 'down' && wi.down === undefined && wi.across !== undefined) {
			dir = 'across'
		}
		store.selected = { row: r, col: c, direction: dir }
	}

	// Selalu buka modal pertanyaan ketika kotak ditekan
	isModalOpen.value = true

	nextTick(() => {
		// Auto focus kotak huruf aktif di modal
		setTimeout(() => {
			const activeIdx = currentWordCells.value.findIndex(
				cell => cell.row === r && cell.col === c
			)
			if (activeIdx !== -1) {
				modalInputRefs.value[activeIdx]?.focus()
			} else {
				modalInputRefs.value[0]?.focus()
			}
		}, 100)
	})
}

function switchModalDirection(direction: 'across' | 'down') {
	if (!selected.value) return
	store.selected = {
		row: selected.value.row,
		col: selected.value.col,
		direction
	}
	nextTick(() => {
		modalInputRefs.value[0]?.focus()
	})
}

function moveToNextCell(r: number, c: number) {
	if (!selected.value) return
	const dr = selected.value.direction === 'down' ? 1 : 0
	const dc = selected.value.direction === 'across' ? 1 : 0

	const nextR = r + dr
	const nextC = c + dc

	if (layout.value.grid[nextR]?.[nextC]) {
		store.selected = { row: nextR, col: nextC, direction: selected.value.direction }
		nextTick(() => {
			inputRefs.value[cellKey(nextR, nextC)]?.focus()
		})
	}
}

function moveToPrevCell(r: number, c: number) {
	if (!selected.value) return
	const dr = selected.value.direction === 'down' ? 1 : 0
	const dc = selected.value.direction === 'across' ? 1 : 0

	const prevR = r - dr
	const prevC = c - dc

	if (layout.value.grid[prevR]?.[prevC]) {
		store.selected = { row: prevR, col: prevC, direction: selected.value.direction }
		nextTick(() => {
			inputRefs.value[cellKey(prevR, prevC)]?.focus()
		})
	}
}

function handleKeyDown(e: KeyboardEvent, r: number, c: number) {
	if (e.key === 'ArrowRight') {
		e.preventDefault()
		if (layout.value.grid[r]?.[c + 1]) {
			store.selected = { row: r, col: c + 1, direction: 'across' }
			nextTick(() => inputRefs.value[cellKey(r, c + 1)]?.focus())
		}
	} else if (e.key === 'ArrowLeft') {
		e.preventDefault()
		if (layout.value.grid[r]?.[c - 1]) {
			store.selected = { row: r, col: c - 1, direction: 'across' }
			nextTick(() => inputRefs.value[cellKey(r, c - 1)]?.focus())
		}
	} else if (e.key === 'ArrowDown') {
		e.preventDefault()
		if (layout.value.grid[r + 1]?.[c]) {
			store.selected = { row: r + 1, col: c, direction: 'down' }
			nextTick(() => inputRefs.value[cellKey(r + 1, c)]?.focus())
		}
	} else if (e.key === 'ArrowUp') {
		e.preventDefault()
		if (layout.value.grid[r - 1]?.[c]) {
			store.selected = { row: r - 1, col: c, direction: 'down' }
			nextTick(() => inputRefs.value[cellKey(r - 1, c)]?.focus())
		}
	} else if (e.key === 'Backspace') {
		e.preventDefault()
		if (getCell(r, c)) {
			setCell(r, c, '')
		} else {
			moveToPrevCell(r, c)
		}
	} else if (e.key === ' ' || e.key === 'Spacebar') {
		e.preventDefault()
		handleCellClick(r, c)
	}
}

function handleInput(e: Event, r: number, c: number) {
	const target = e.target as HTMLInputElement
	const val = target.value.slice(-1).toUpperCase()
	if (/^[A-Z0-9]$/.test(val)) {
		setCell(r, c, val)
		moveToNextCell(r, c)
	} else {
		setCell(r, c, '')
	}
}

// Input handling langsung di dalam Modal Soal
function handleModalCellInput(e: Event, r: number, c: number, idx: number) {
	const target = e.target as HTMLInputElement
	const val = target.value.slice(-1).toUpperCase()
	if (/^[A-Z0-9]$/.test(val)) {
		setCell(r, c, val)
		// Pindah otomatis ke kotak huruf berikutnya di modal
		if (idx + 1 < currentWordCells.value.length) {
			nextTick(() => {
				modalInputRefs.value[idx + 1]?.focus()
			})
		}
	} else {
		setCell(r, c, '')
	}
}

function handleModalKeyDown(e: KeyboardEvent, r: number, c: number, idx: number) {
	if (e.key === 'Backspace') {
		if (!getCell(r, c) && idx > 0) {
			e.preventDefault()
			nextTick(() => {
				modalInputRefs.value[idx - 1]?.focus()
			})
		}
	}
}

// Menang hanya kalau semua kotak diisi sendiri; setelah tombol "Kunci" dipakai, tidak dihitung
watch(
	() => store.isComplete,
	(done) => {
		if (done && !store.isSolved && !store.isRevealed) celebrate()
	}
)

function handleContinue() {
	isVictoryModalOpen.value = false
	emit(props.hasNext ? 'next' : 'backToPath')
}

async function celebrate() {
	store.markSolved()
	isModalOpen.value = false
	isVictoryModalOpen.value = true

	// Selebrasi kembang api konfeti untuk anak SD!
	try {
		confetti({
			particleCount: 120,
			spread: 80,
			origin: { y: 0.55 },
			colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6']
		})
	} catch {
		// Konfeti hanya hiasan; kalau gagal, modal kemenangan tetap tampil
	}

	// Hitung bintang berdasarkan waktu
	const secs = store.secondsElapsed
	const stars = secs < 60 ? 3 : secs < 180 ? 2 : 1
	earnedStars.value = stars
	earnedXp.value = 100 + (stars === 3 ? 50 : stars === 2 ? 25 : 0)
	xpAdded.value = null

	// Simpan progres kalau yang bermain siswa yang sudah masuk
	if (auth.isStudent && store.activePuzzle?.id) {
		const answers: Record<string, string> = {}
		for (const w of store.layout.placed) {
			if (!w.id) continue
			const dr = w.direction === 'down' ? 1 : 0
			const dc = w.direction === 'across' ? 1 : 0
			answers[w.id] = Array.from(w.answer, (_, k) => store.userInputs[w.row + dr * k]?.[w.col + dc * k] ?? '').join('')
		}

		isSavingResult.value = true
		try {
			const res = await $fetch('/api/progress/submit', {
				method: 'POST',
				body: {
					puzzleId: store.activePuzzle.id,
					answers,
					timeSeconds: secs
				}
			})
			earnedStars.value = res.stars
			earnedXp.value = res.earnedXp
			xpAdded.value = res.xpAdded
			await auth.refreshStats()
		} catch (err) {
			console.error('Failed to submit progress:', err)
		} finally {
			isSavingResult.value = false
		}
	}
}

watch(
	() => store.selected,
	(newSel) => {
		if (newSel && !isModalOpen.value) {
			nextTick(() => {
				inputRefs.value[cellKey(newSel.row, newSel.col)]?.focus()
			})
		}
	}
)
</script>

<template>
	<div class="w-full flex flex-col items-center p-1 sm:p-4">
		<!-- Container Grid Canvas (Tetap Persegi di Mobile dan Desktop) -->
		<div class="w-full flex justify-center overflow-x-auto py-1">
			<div
				v-if="layout.width > 0 && layout.height > 0"
				class="inline-grid gap-0.5 sm:gap-1 bg-neutral-950 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-2xl border-2 sm:border-4 border-neutral-900 select-none"
				:style="{
					gridTemplateColumns: `repeat(${layout.width}, minmax(0, 1fr))`
				}"
			>
				<template v-for="r in layout.height" :key="`row-${r-1}`">
					<template v-for="c in layout.width" :key="`cell-${r-1}-${c-1}`">
						<!-- Kotak BISA DIISI: SELALU PERSEGI (w-8 h-8 / w-11 h-11 aspect-square shrink-0) DAN PUTIH BERSIH -->
						<div
							v-if="layout.grid[r-1]?.[c-1]"
							class="relative aspect-square w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 shrink-0 transition-all duration-100 rounded-sm sm:rounded-md flex items-center justify-center font-bold select-none cursor-pointer border"
							:class="[
								selected?.row === r-1 && selected?.col === c-1
									? selected.direction === 'across'
										? 'bg-amber-200 ring-2 sm:ring-4 ring-amber-500 z-20 scale-105 shadow-xl border-amber-600'
										: 'bg-sky-200 ring-2 sm:ring-4 ring-sky-500 z-20 scale-105 shadow-xl border-sky-600'
									: activeWordCellSet.has(cellKey(r-1, c-1))
										? selected?.direction === 'across'
											? 'bg-amber-100 border-y-2 border-amber-400 border-x-neutral-200 z-10'
											: 'bg-sky-100 border-x-2 border-sky-400 border-y-neutral-200 z-10'
										: 'bg-white hover:bg-neutral-100 border-neutral-300',
								store.isChecked && userInputs[r-1]?.[c-1]
									? userInputs[r-1]?.[c-1]?.toUpperCase() === layout.grid[r-1]?.[c-1]?.toUpperCase()
										? 'text-emerald-700 font-black'
										: 'text-rose-600 bg-rose-50 font-black'
									: 'text-black'
							]"
							@click="handleCellClick(r-1, c-1)"
						>
							<!-- Nomor clue di pojok kiri atas kotak putih -->
							<span
								v-if="meta.cellNumber.get(cellKey(r-1, c-1))"
								class="absolute top-0.5 left-0.5 sm:left-1 text-[8px] sm:text-[10px] font-black text-neutral-800 leading-none pointer-events-none select-none z-10"
							>
								{{ meta.cellNumber.get(cellKey(r-1, c-1)) }}
							</span>

							<!-- Input field di grid -->
							<input
								:ref="(el) => setInputRef(el, r-1, c-1)"
								type="text"
								maxlength="1"
								autocomplete="off"
								autocorrect="off"
								spellcheck="false"
								class="w-full h-full text-center bg-transparent border-0 outline-none p-0 cursor-pointer uppercase font-mono font-black text-black text-sm sm:text-xl z-20"
								:aria-label="`Kotak baris ${r}, kolom ${c}`"
								:value="userInputs[r-1]?.[c-1] || ''"
								@focus="handleCellFocus(r-1, c-1)"
								@input="(e) => handleInput(e, r-1, c-1)"
								@keydown="(e) => handleKeyDown(e, r-1, c-1)"
								@click.stop="handleCellClick(r-1, c-1)"
							>
						</div>

						<!-- Kotak TIDAK BISA DIISI: SELALU PERSEGI (w-8 h-8 / w-11 h-11 aspect-square shrink-0) DAN HITAM PEKAT -->
						<div
							v-else
							class="aspect-square w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 shrink-0 bg-black border border-neutral-900 rounded-sm sm:rounded-md pointer-events-none shadow-inner"
						/>
					</template>
				</template>
			</div>

			<div
				v-else
				class="p-8 text-center text-muted"
			>
				Belum ada kotak teka-teki silang yang dimuat.
			</div>
		</div>

		<!-- MODAL PERTANYAAN (Muncul otomatis saat kotak mana pun ditekan) -->
		<UModal v-model:open="isModalOpen" :ui="{ content: 'bg-white dark:bg-neutral-900', overlay: 'bg-black/60' }">
			<template #body>
				<div class="p-4 sm:p-6 space-y-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl">
					<!-- Pilihan Arah jika Kotak Persimpangan (Tanpa Icon Panah, Cukup Warna) -->
					<div
						v-if="cellClues.across && cellClues.down"
						class="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl justify-center"
					>
						<button
							type="button"
							class="flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all"
							:class="selected?.direction === 'across' ? 'bg-amber-700 text-white shadow-sm' : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'"
							@click="switchModalDirection('across')"
						>
							<span class="w-2.5 h-2.5 rounded-full bg-amber-200" />
							<span>{{ cellClues.across.number }} Mendatar</span>
						</button>
						<button
							type="button"
							class="flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all"
							:class="selected?.direction === 'down' ? 'bg-sky-700 text-white shadow-sm' : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'"
							@click="switchModalDirection('down')"
						>
							<span class="w-2.5 h-2.5 rounded-full bg-sky-200" />
							<span>{{ cellClues.down.number }} Menurun</span>
						</button>
					</div>

					<!-- Header Info Soal (Tanpa Icon Panah, Cukup Warna) -->
					<div v-if="activePlacedWord" class="space-y-2 text-center">
						<div
							class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black text-white shadow-sm"
							:class="selected?.direction === 'across' ? 'bg-amber-700' : 'bg-sky-700'"
						>
							<span class="w-2 h-2 rounded-full bg-white animate-pulse" />
							<span>{{ activePlacedWord.number }} {{ selected?.direction === 'across' ? 'Mendatar' : 'Menurun' }}</span>
							<span>• {{ activePlacedWord.answer.length }} Huruf</span>
						</div>

						<p class="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 leading-snug">
							{{ activePlacedWord.clue }}
						</p>
					</div>

					<!-- Input Kotak Huruf Langsung di dalam Modal (Besar & Touch-Friendly 44px) -->
					<div v-if="currentWordCells.length > 0" class="py-2">
						<p class="text-xs text-muted text-center mb-2 font-medium">
							Ketik huruf jawaban langsung di bawah:
						</p>
						<div class="flex justify-center gap-1.5 flex-wrap">
							<div
								v-for="(cell, idx) in currentWordCells"
								:key="`modal-cell-${cell.row}-${cell.col}`"
								class="w-11 h-11 rounded-xl border-2 flex items-center justify-center font-bold text-lg aspect-square shadow-sm transition-all cursor-pointer"
								:class="[
									cell.row === selected?.row && cell.col === selected?.col
										? 'border-amber-500 bg-amber-100 ring-2 ring-amber-400 text-black scale-105'
										: userInputs[cell.row]?.[cell.col]
											? 'border-neutral-400 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
											: 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-muted'
								]"
								@click="modalInputRefs[idx]?.focus()"
							>
								<input
									:ref="(el) => setModalInputRef(el, idx)"
									type="text"
									maxlength="1"
									autocomplete="off"
									autocorrect="off"
									spellcheck="false"
									class="w-full h-full text-center bg-transparent border-0 outline-none uppercase font-mono font-black text-lg p-0"
									:aria-label="`Huruf ke-${idx + 1}`"
									:value="userInputs[cell.row]?.[cell.col] || ''"
									@input="(e) => handleModalCellInput(e, cell.row, cell.col, idx)"
									@keydown="(e) => handleModalKeyDown(e, cell.row, cell.col, idx)"
									@focus="store.selected = { row: cell.row, col: cell.col, direction: selected!.direction }"
								>
							</div>
						</div>
					</div>

					<UButton
						color="primary"
						size="md"
						class="w-full font-bold justify-center mt-2"
						@click="isModalOpen = false"
					>
						Selesai Mengisi Soal Ini
					</UButton>
				</div>
			</template>
		</UModal>

		<!-- MODAL KEMENANGAN (VICTORY MODAL WITH STARS & XP) -->
		<UModal v-model:open="isVictoryModalOpen">
			<template #body>
				<div class="p-6 text-center space-y-4">
					<div class="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center text-4xl animate-bounce">
						🎉
					</div>

					<div class="space-y-1">
						<h3 class="font-black text-2xl text-neutral-900 dark:text-neutral-100">
							Hebat Sekali! Kamu Berhasil!
						</h3>
						<p class="text-xs sm:text-sm text-muted">
							Semua jawaban teka-teki silang telah terisi dengan benar.
						</p>
					</div>

					<!-- Stars Display -->
					<div
						class="flex items-center justify-center gap-2 py-1"
						role="img"
						:aria-label="`${earnedStars} dari 3 bintang`"
					>
						<span
							v-for="s in 3"
							:key="`win-star-${s}`"
							aria-hidden="true"
							class="text-3xl transition-transform hover:scale-125"
							:class="s <= earnedStars ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-700'"
						>
							⭐
						</span>
					</div>

					<!-- XP Badge -->
					<p v-if="isSavingResult" class="text-sm text-muted">
						Menyimpan hasilmu…
					</p>
					<UBadge v-else-if="xpAdded" color="warning" variant="soft" size="lg" class="font-black">
						⚡ +{{ xpAdded }} XP
					</UBadge>
					<p v-else-if="xpAdded === 0" class="text-sm text-muted">
						Teka-teki ini sudah pernah kamu selesaikan. XP hanya bertambah kalau bintangmu lebih banyak dari sebelumnya.
					</p>
					<p v-else-if="!auth.isStudent" class="text-sm text-muted">
						Masuk sebagai siswa supaya bintang dan XP-mu tersimpan.
					</p>
					<p v-else class="text-sm text-error">
						Hasilmu belum tersimpan. Periksa internet, lalu coba selesaikan lagi.
					</p>

					<div class="pt-2">
						<UButton
							color="primary"
							size="lg"
							class="w-full font-black justify-center"
							@click="handleContinue"
						>
							{{ props.hasNext ? 'Lanjut ke Teka-Teki Berikutnya' : 'Kembali ke Peta Belajar' }}
						</UButton>
					</div>
				</div>
			</template>
		</UModal>
	</div>
</template>
