<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import confetti from 'canvas-confetti'
import { useCrosswordStore } from '~/stores/crosswordStore'
import { useAuthStore } from '~/stores/authStore'
import { cellKey, type PlacedWord } from '~/utils/crossword'
import LetterTile from './LetterTile.vue'

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
			// sky, amber, lime: sama dengan warna primary, secondary, dan success di app.config.ts
			colors: ['#0ea5e9', '#f59e0b', '#84cc16']
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

// Kotak papan selalu putih (seperti kertas TTS) di mode terang maupun gelap, jadi warnanya pakai shade terang yang tetap.
// Mendatar = secondary (amber), Menurun = primary (sky), sama dengan daftar soal.
function cellClass(r: number, c: number) {
	const across = selected.value?.direction === 'across'
	const isSelected = selected.value?.row === r && selected.value?.col === c
	const inWord = activeWordCellSet.value.has(cellKey(r, c))

	let bg = 'bg-white hover:bg-neutral-100'
	if (isSelected) bg = across ? 'bg-secondary-200 ring-3 sm:ring-4 ring-secondary-500 z-20' : 'bg-primary-200 ring-3 sm:ring-4 ring-primary-500 z-20'
	else if (inWord) bg = across ? 'bg-secondary-100' : 'bg-primary-100'

	const input = userInputs.value[r]?.[c]
	let text = 'text-neutral-900'
	if (store.isChecked && input) {
		text = input.toUpperCase() === layout.value.grid[r]?.[c]?.toUpperCase()
			? 'text-success-700'
			: 'text-error-700 bg-error-100'
	}
	return [bg, text]
}

function modalBoxClass(cell: { row: number; col: number }) {
	if (cell.row === selected.value?.row && cell.col === selected.value?.col) {
		return selected.value?.direction === 'across'
			? 'border-secondary bg-secondary/10 ring-4 ring-secondary/30'
			: 'border-primary bg-primary/10 ring-4 ring-primary/30'
	}
	return userInputs.value[cell.row]?.[cell.col] ? 'border-accented bg-elevated' : 'border-accented bg-default'
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
	<div class="w-full flex flex-col items-center">
		<!-- Papan TTS: kotak putih di atas papan gelap, kotak hitam dibiarkan kosong supaya papan terasa lebih ringan.
			Lebar kotak mengikuti layar (maksimal 52px), jadi papan tidak perlu digeser ke samping di ponsel.
			Ukuran huruf memakai satuan cqw terhadap lebar papan dibagi jumlah kolom. -->
		<div class="w-full flex justify-center py-1">
			<div
				v-if="layout.width > 0 && layout.height > 0"
				class="@container w-full grid gap-0.75 sm:gap-1 bg-neutral-800 p-1.5 sm:p-3 rounded-lg shadow-md select-none"
				:style="{
					gridTemplateColumns: `repeat(${layout.width}, minmax(0, 1fr))`,
					maxWidth: `${layout.width * 3.25 + 1.5}rem`,
					'--tts-cols': layout.width
				}"
			>
				<template v-for="r in layout.height" :key="`row-${r-1}`">
					<template v-for="c in layout.width" :key="`cell-${r-1}-${c-1}`">
						<div
							v-if="layout.grid[r-1]?.[c-1]"
							class="relative aspect-square w-full rounded-[3px] sm:rounded flex items-center justify-center cursor-pointer transition duration-150"
							:class="cellClass(r-1, c-1)"
							@click="handleCellClick(r-1, c-1)"
						>
							<span
								v-if="meta.cellNumber.get(cellKey(r-1, c-1))"
								class="absolute top-[6%] left-[8%] text-[max(8px,calc(22cqw/var(--tts-cols)))] font-bold text-neutral-700 leading-none pointer-events-none z-30"
								aria-hidden="true"
							>
								{{ meta.cellNumber.get(cellKey(r-1, c-1)) }}
							</span>

							<!-- Tanpa outline bawaan: cincin seleksi pada kotak ikut pindah saat fokus (lihat handleCellFocus) -->
							<input
								:ref="(el) => setInputRef(el, r-1, c-1)"
								type="text"
								maxlength="1"
								autocomplete="off"
								autocorrect="off"
								autocapitalize="characters"
								spellcheck="false"
								class="w-full h-full text-center bg-transparent border-0 outline-none p-0 cursor-pointer uppercase font-extrabold text-inherit text-[calc(55cqw/var(--tts-cols))] z-20"
								:aria-label="`Kotak baris ${r}, kolom ${c}`"
								:value="userInputs[r-1]?.[c-1] || ''"
								@focus="handleCellFocus(r-1, c-1)"
								@input="(e) => handleInput(e, r-1, c-1)"
								@keydown="(e) => handleKeyDown(e, r-1, c-1)"
								@click.stop="handleCellClick(r-1, c-1)"
							>
						</div>

						<div
							v-else
							class="aspect-square w-full"
							aria-hidden="true"
						/>
					</template>
				</template>
			</div>

			<p v-else class="p-8 text-center text-muted">
				Kotak teka-teki silang belum tersedia.
			</p>
		</div>

		<!-- MODAL SOAL: muncul setiap kali kotak di papan diketuk -->
		<UModal
			v-model:open="isModalOpen"
			:title="activePlacedWord ? `${activePlacedWord.number} ${selected?.direction === 'across' ? 'Mendatar' : 'Menurun'}, ${activePlacedWord.answer.length} huruf` : 'Soal'"
			:ui="{ title: selected?.direction === 'across' ? 'text-secondary font-extrabold' : 'text-primary font-extrabold' }"
		>
			<template #body>
				<div class="space-y-5">
					<!-- Kotak persimpangan: pilih mau isi yang mendatar atau menurun -->
					<div
						v-if="cellClues.across && cellClues.down"
						class="grid grid-cols-2 gap-2"
						role="group"
						aria-label="Pilih arah soal"
					>
						<UButton
							block
							color="secondary"
							:variant="selected?.direction === 'across' ? 'solid' : 'soft'"
							icon="i-lucide-arrow-right"
							:aria-pressed="selected?.direction === 'across'"
							class="font-bold"
							@click="switchModalDirection('across')"
						>
							{{ cellClues.across.number }} Mendatar
						</UButton>
						<UButton
							block
							color="primary"
							:variant="selected?.direction === 'down' ? 'solid' : 'soft'"
							icon="i-lucide-arrow-down"
							:aria-pressed="selected?.direction === 'down'"
							class="font-bold"
							@click="switchModalDirection('down')"
						>
							{{ cellClues.down.number }} Menurun
						</UButton>
					</div>

					<div v-if="activePlacedWord" class="flex items-start gap-3">
						<LetterTile
							:label="activePlacedWord.number"
							:color="selected?.direction === 'across' ? 'secondary' : 'primary'"
						/>
						<p class="min-w-0 pt-2 text-xl font-bold text-highlighted leading-snug">
							{{ activePlacedWord.clue }}
						</p>
					</div>

					<div v-if="currentWordCells.length > 0">
						<p class="text-sm text-muted mb-2">
							Ketik jawabanmu di sini:
						</p>
						<div class="flex flex-wrap gap-1.5">
							<div
								v-for="(cell, idx) in currentWordCells"
								:key="`modal-cell-${cell.row}-${cell.col}`"
								class="size-11 sm:size-12 rounded-md border-2 flex items-center justify-center transition-colors cursor-text"
								:class="modalBoxClass(cell)"
								@click="modalInputRefs[idx]?.focus()"
							>
								<!-- Tanpa outline bawaan: kotak aktif diberi cincin tebal oleh modalBoxClass -->
								<input
									:ref="(el) => setModalInputRef(el, idx)"
									type="text"
									maxlength="1"
									autocomplete="off"
									autocorrect="off"
									autocapitalize="characters"
									spellcheck="false"
									class="w-full h-full text-center bg-transparent border-0 outline-none uppercase font-extrabold text-2xl text-highlighted p-0"
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
						size="xl"
						block
						icon="i-lucide-check"
						class="font-bold"
						@click="isModalOpen = false"
					>
						Selesai
					</UButton>
				</div>
			</template>
		</UModal>

		<!-- MODAL KEMENANGAN -->
		<UModal
			v-model:open="isVictoryModalOpen"
			title="Kamu berhasil!"
			:ui="{ title: 'sr-only', header: 'justify-end' }"
		>
			<template #body>
				<div class="py-2 text-center space-y-5">
					<LetterTile icon="i-lucide-trophy" color="secondary" size="lg" class="star-pop" />

					<div class="space-y-1">
						<p class="font-extrabold text-3xl text-highlighted">
							Hebat, kamu berhasil!
						</p>
						<p class="text-base text-muted">
							Semua kotak sudah terisi dengan benar.
						</p>
					</div>

					<div
						class="flex items-center justify-center gap-3 text-6xl leading-none"
						role="img"
						:aria-label="`${earnedStars} dari 3 bintang`"
					>
						<span
							v-for="s in 3"
							:key="`win-star-${s}`"
							aria-hidden="true"
							class="star-pop"
							:class="s <= earnedStars ? 'text-secondary-500' : 'text-accented'"
							:style="{ animationDelay: `${0.15 + s * 0.15}s` }"
						>★</span>
					</div>

					<p v-if="isSavingResult" class="text-base text-muted">
						Menyimpan hasilmu…
					</p>
					<UBadge
						v-else-if="xpAdded"
						color="secondary"
						variant="soft"
						size="xl"
						icon="i-lucide-zap"
						class="font-extrabold"
					>
						+{{ xpAdded }} XP
					</UBadge>
					<p v-else-if="xpAdded === 0" class="text-base text-muted">
						Teka-teki ini sudah pernah kamu selesaikan. XP hanya bertambah kalau bintangmu lebih banyak dari sebelumnya.
					</p>
					<p v-else-if="!auth.isStudent" class="text-base text-muted">
						Masuk sebagai siswa supaya bintang dan XP-mu tersimpan.
					</p>
					<p v-else class="text-base text-error">
						Hasilmu belum tersimpan. Periksa internet, lalu coba selesaikan lagi.
					</p>

					<UButton
						color="primary"
						size="xl"
						block
						:icon="props.hasNext ? 'i-lucide-play' : 'i-lucide-map'"
						class="font-bold"
						@click="handleContinue"
					>
						{{ props.hasNext ? 'Lanjut ke teka-teki berikutnya' : 'Kembali ke Peta Belajar' }}
					</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>
