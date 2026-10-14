<script setup lang="ts">
import { ref, computed } from 'vue'
import {
	type Direction,
	type PlacedWord,
	type WordEntry,
	generateCrossword,
	cellKey
} from '~/utils/crossword'

interface StudioQuestion {
	id: string
	clue: string
	answer: string
	direction: Direction
	row: number | null
	col: number | null
}

const emit = defineEmits<{
	(e: 'saved', puzzleId: string): void
}>()

const toast = useToast()

// Form Data
const puzzleTitle = ref('Teka-Teki Silang Baru')
const puzzleDescription = ref('Teka-teki silang buatan admin dengan susunan interaktif.')
const puzzleGrade = ref(1)
const puzzleSubject = ref('Bahasa Indonesia')

// Daftar mata pelajaran resmi Kurikulum Merdeka SD sesuai instruksi user
const officialSubjects = computed(() => {
	const base = [
		'Pendidikan Agama Islam dan Budi Pekerti (PAI)',
		'Pendidikan Pancasila',
		'Bahasa Indonesia',
		'Matematika',
		'PJOK',
		'Seni Budaya',
		'Bahasa Sunda',
		'Bahasa Inggris'
	]
	if (puzzleGrade.value >= 3) {
		return [
			'Pendidikan Agama Islam dan Budi Pekerti (PAI)',
			'Pendidikan Pancasila',
			'Bahasa Indonesia',
			'Matematika',
			'IPAS',
			'PJOK',
			'Seni Budaya',
			'Bahasa Sunda',
			'Bahasa Inggris'
		]
	}
	return base
})

watch(puzzleGrade, () => {
	if (!officialSubjects.value.includes(puzzleSubject.value)) {
		puzzleSubject.value = 'Bahasa Indonesia'
	}
})

const newClue = ref('')
const newAnswer = ref('')
const activeDirection = ref<Direction>('across')

// Grid Size
const gridSize = ref(15)

// Questions List
const questions = ref<StudioQuestion[]>([
	{
		id: 'q_demo_1',
		clue: 'Ibu kota negara Indonesia',
		answer: 'NUSANTARA',
		direction: 'across',
		row: 4,
		col: 2
	},
	{
		id: 'q_demo_2',
		clue: 'Gunung tertinggi di Jawa',
		answer: 'SEMERU',
		direction: 'down',
		row: 4,
		col: 4
	},
	{
		id: 'q_demo_3',
		clue: 'Kain tradisional malam khas Jawa',
		answer: 'BATIK',
		direction: 'down',
		row: 2,
		col: 7
	}
])

// Placement state
const placingQuestionId = ref<string | null>(null)
const hoveredCell = ref<{ row: number; col: number } | null>(null)
const isSaving = ref(false)

const activePlacingQuestion = computed(() =>
	questions.value.find((q) => q.id === placingQuestionId.value) || null
)

// Placed words layout
const placedWords = computed<PlacedWord[]>(() => {
	return questions.value
		.filter((q) => q.row !== null && q.col !== null && q.answer.trim().length > 0)
		.map((q) => ({
			id: q.id,
			clue: q.clue,
			answer: q.answer.toUpperCase(),
			direction: q.direction,
			row: q.row as number,
			col: q.col as number,
			number: 0
		}))
})

// Fast lookup for current placed letters
const occupiedLetters = computed(() => {
	const map = new Map<string, { letter: string; questionIds: string[] }>()
	for (const q of questions.value) {
		if (q.row === null || q.col === null) continue
		const len = q.answer.length
		const dr = q.direction === 'down' ? 1 : 0
		const dc = q.direction === 'across' ? 1 : 0

		for (let k = 0; k < len; k++) {
			const r = q.row + dr * k
			const c = q.col + dc * k
			const key = cellKey(r, c)
			const char = (q.answer[k] ?? '').toUpperCase()

			const existing = map.get(key)
			if (existing) {
				existing.questionIds.push(q.id)
			} else {
				map.set(key, { letter: char, questionIds: [q.id] })
			}
		}
	}
	return map
})

// Hover preview validity check
const hoverPlacementStatus = computed(() => {
	if (!activePlacingQuestion.value || !hoveredCell.value) return null
	const q = activePlacingQuestion.value
	const startR = hoveredCell.value.row
	const startC = hoveredCell.value.col
	const dir = activeDirection.value
	const len = q.answer.length

	const dr = dir === 'down' ? 1 : 0
	const dc = dir === 'across' ? 1 : 0

	// Check boundary
	if (startR + dr * (len - 1) >= gridSize.value || startC + dc * (len - 1) >= gridSize.value) {
		return { valid: false, reason: 'Melebihi batas ukuran grid' }
	}

	// Check letter conflicts
	for (let k = 0; k < len; k++) {
		const r = startR + dr * k
		const c = startC + dc * k
		const key = cellKey(r, c)
		const occupied = occupiedLetters.value.get(key)

		// Ignore collision with the word itself being re-placed
		if (occupied && !occupied.questionIds.includes(q.id)) {
			if (occupied.letter !== (q.answer[k] ?? '').toUpperCase()) {
				return {
					valid: false,
					reason: `Tabrakan huruf di (${r}, ${c}): '${occupied.letter}' vs '${q.answer[k]}'`
				}
			}
		}
	}

	return { valid: true, reason: 'Posisi valid!' }
})

// Set of cells in hover preview
const hoverCellMap = computed(() => {
	const map = new Map<string, string>()
	if (!activePlacingQuestion.value || !hoveredCell.value) return map

	const q = activePlacingQuestion.value
	const len = q.answer.length
	const dr = activeDirection.value === 'down' ? 1 : 0
	const dc = activeDirection.value === 'across' ? 1 : 0

	for (let k = 0; k < len; k++) {
		const r = hoveredCell.value.row + dr * k
		const c = hoveredCell.value.col + dc * k
		map.set(cellKey(r, c), q.answer[k]?.toUpperCase() || '')
	}
	return map
})

function addQuestion() {
	if (!newAnswer.value.trim()) {
		toast.add({
			title: 'Kata / Jawaban Kosong',
			description: 'Masukkan jawaban kata teka-teki silang.',
			color: 'error'
		})
		return
	}

	const cleaned = newAnswer.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
	const newQ: StudioQuestion = {
		id: `q_${Date.now()}`,
		clue: newClue.value.trim() || `Petunjuk untuk kata ${cleaned}`,
		answer: cleaned,
		direction: activeDirection.value,
		row: null,
		col: null
	}

	questions.value.push(newQ)
	newAnswer.value = ''
	newClue.value = ''

	// Langsung aktifkan mode penempatan untuk kata ini
	placingQuestionId.value = newQ.id

	toast.add({
		title: 'Kata Ditambahkan',
		description: `Silakan klik salah satu kotak di grid untuk menempatkan kata "${cleaned}".`,
		color: 'info'
	})
}

function removeQuestion(id: string) {
	questions.value = questions.value.filter((q) => q.id !== id)
	if (placingQuestionId.value === id) {
		placingQuestionId.value = null
	}
}

function startPlacing(q: StudioQuestion) {
	placingQuestionId.value = q.id
	activeDirection.value = q.direction || 'across'
}

function toggleDirection() {
	activeDirection.value = activeDirection.value === 'across' ? 'down' : 'across'
	if (activePlacingQuestion.value) {
		activePlacingQuestion.value.direction = activeDirection.value
	}
}

function handleGridCellClick(r: number, c: number) {
	if (!activePlacingQuestion.value) return

	if (!hoverPlacementStatus.value?.valid) {
		toast.add({
			title: 'Penempatan Gagal',
			description: hoverPlacementStatus.value?.reason || 'Posisi tidak valid',
			color: 'error'
		})
		return
	}

	const q = activePlacingQuestion.value
	q.row = r
	q.col = c
	q.direction = activeDirection.value

	toast.add({
		title: 'Kata Ditempatkan',
		description: `Kata "${q.answer}" berhasil diletakkan pada posisi (${r}, ${c}) ${q.direction === 'across' ? 'Mendatar' : 'Menurun'}.`,
		color: 'success'
	})

	placingQuestionId.value = null
	hoveredCell.value = null
}

function unplaceWord(q: StudioQuestion) {
	q.row = null
	q.col = null
}

// Auto Generate Layout
function autoArrangeAll() {
	if (questions.value.length === 0) {
		toast.add({
			title: 'Daftar Kosong',
			description: 'Tambahkan minimal 1-2 kata terlebih dahulu.',
			color: 'warning'
		})
		return
	}

	const entries: WordEntry[] = questions.value.map((q) => ({
		clue: q.clue,
		answer: q.answer
	}))

	const result = generateCrossword(entries)

	if (result.placed.length === 0) {
		toast.add({
			title: 'Gagal Menyusun',
			description: 'Kata-kata tidak memiliki huruf irisan yang cocok. Coba atur letak secara manual.',
			color: 'error'
		})
		return
	}

	// Update positions
	const placedMap = new Map<string, PlacedWord>()
	for (const p of result.placed) {
		placedMap.set(p.answer.toUpperCase(), p)
	}

	for (const q of questions.value) {
		const matched = placedMap.get(q.answer.toUpperCase())
		if (matched) {
			q.row = matched.row
			q.col = matched.col
			q.direction = matched.direction
		} else {
			q.row = null
			q.col = null
		}
	}

	// Expand grid size if needed
	const maxDim = Math.max(result.width, result.height) + 2
	if (maxDim > gridSize.value) {
		gridSize.value = maxDim
	}

	toast.add({
		title: 'Otomatis Ditata!',
		description: `${result.placed.length} dari ${questions.value.length} kata berhasil disusun rapi. Anda masih bisa menggeser posisinya secara manual.`,
		color: 'success'
	})
}

// Save puzzle to D1 database
async function savePuzzle() {
	if (!puzzleTitle.value.trim()) {
		toast.add({
			title: 'Judul Wajib Diisi',
			color: 'error'
		})
		return
	}

	const placedList = questions.value.filter((q) => q.row !== null && q.col !== null)
	if (placedList.length === 0) {
		toast.add({
			title: 'Belum Ada Kata Ditempatkan',
			description: 'Silakan tempatkan minimal 1 kata di grid sebelum menyimpan.',
			color: 'warning'
		})
		return
	}

	isSaving.value = true
	try {
		const res: any = await $fetch('/api/puzzles', {
			method: 'POST',
			body: {
				title: puzzleTitle.value.trim(),
				description: puzzleDescription.value.trim(),
				grade: Number(puzzleGrade.value),
				subject: puzzleSubject.value,
				questions: questions.value.map((q) => ({
					clue: q.clue,
					answer: q.answer,
					direction: q.direction,
					row: q.row,
					col: q.col
				}))
			}
		})

		toast.add({
			title: 'Berhasil Disimpan!',
			description: 'Teka-teki silang telah tersimpan ke database Cloudflare D1.',
			color: 'success'
		})

		emit('saved', res.id)
	} catch (err: any) {
		toast.add({
			title: 'Gagal Menyimpan',
			description: err?.message || 'Terjadi kesalahan sistem',
			color: 'error'
		})
	} finally {
		isSaving.value = false
	}
}
</script>

<template>
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		<!-- Kolom Kiri: Form Input & Daftar Soal (5 cols di desktop) -->
		<div class="lg:col-span-5 space-y-4">
			<!-- Header Info Puzzle -->
			<UCard :ui="{ body: 'space-y-3' }">
				<template #header>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<UIcon name="i-lucide-file-signature" class="w-5 h-5 text-amber-500" />
							<h2 class="font-bold text-base sm:text-lg">Detail Teka-Teki</h2>
						</div>
						<UButton
							color="primary"
							icon="i-lucide-save"
							size="sm"
							:loading="isSaving"
							@click="savePuzzle"
						>
							Simpan ke DB
						</UButton>
					</div>
				</template>

				<UFormField label="Judul Teka-Teki" required>
					<UInput
						v-model="puzzleTitle"
						placeholder="Misal: Flora & Fauna Indonesia"
						class="w-full font-semibold"
					/>
				</UFormField>

				<UFormField label="Deskripsi / Tema">
					<UInput
						v-model="puzzleDescription"
						placeholder="Keterangan singkat mengenai tema..."
						class="w-full"
					/>
				</UFormField>

				<div class="grid grid-cols-2 gap-3">
					<UFormField label="Tingkat Kelas SD">
						<USelect
							v-model="puzzleGrade"
							:items="GRADE_OPTIONS"
							class="w-full"
						/>
					</UFormField>

					<UFormField label="Mata Pelajaran">
						<USelect
							v-model="puzzleSubject"
							:items="officialSubjects"
							class="w-full"
						/>
					</UFormField>
				</div>
			</UCard>

			<!-- Form Input Soal Baru -->
			<UCard :ui="{ body: 'space-y-3' }">
				<template #header>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<UIcon name="i-lucide-plus-circle" class="w-5 h-5 text-emerald-500" />
							<h3 class="font-bold text-sm sm:text-base">Input Kata & Petunjuk</h3>
						</div>
						<div class="flex items-center gap-1.5">
							<UButton
								size="xs"
								:variant="activeDirection === 'across' ? 'solid' : 'outline'"
								:color="activeDirection === 'across' ? 'primary' : 'neutral'"
								icon="i-lucide-arrow-right"
								@click="activeDirection = 'across'"
							>
								Mendatar
							</UButton>
							<UButton
								size="xs"
								:variant="activeDirection === 'down' ? 'solid' : 'outline'"
								:color="activeDirection === 'down' ? 'primary' : 'neutral'"
								icon="i-lucide-arrow-down"
								@click="activeDirection = 'down'"
							>
								Menurun
							</UButton>
						</div>
					</div>
				</template>

				<UFormField label="Kata / Jawaban" required>
					<UInput
						v-model="newAnswer"
						placeholder="Contoh: KOMODO"
						class="uppercase font-mono font-bold tracking-wider w-full"
						@keyup.enter="addQuestion"
					/>
				</UFormField>

				<UFormField label="Petunjuk Soal (Clue)" required>
					<UInput
						v-model="newClue"
						placeholder="Contoh: Kadal purba terbesar yang hidup di NTT"
						class="w-full"
						@keyup.enter="addQuestion"
					/>
				</UFormField>

				<UButton
					block
					color="success"
					icon="i-lucide-plus"
					@click="addQuestion"
				>
					Tambahkan Kata
				</UButton>
			</UCard>

			<!-- Daftar Soal Tersimpan -->
			<UCard :ui="{ body: 'p-3 sm:p-4 space-y-2' }">
				<template #header>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<UIcon name="i-lucide-list-todo" class="w-4 h-4 text-sky-500" />
							<h3 class="font-bold text-sm">Daftar Kata ({{ questions.length }})</h3>
						</div>
						<UButton
							size="xs"
							color="neutral"
							variant="outline"
							icon="i-lucide-sparkles"
							@click="autoArrangeAll"
						>
							Auto-Arrange
						</UButton>
					</div>
				</template>

				<div class="space-y-2 max-h-[360px] overflow-y-auto pr-1">
					<div
						v-for="(q, idx) in questions"
						:key="q.id"
						class="p-2.5 rounded-xl border transition-all text-xs sm:text-sm flex flex-col gap-2"
						:class="[
							placingQuestionId === q.id
								? 'border-primary-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-primary-500/50'
								: q.row !== null
									? 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
									: 'border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20'
						]"
					>
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<span class="font-bold font-mono text-muted">{{ idx + 1 }}.</span>
								<span class="font-bold font-mono tracking-wider text-neutral-900 dark:text-neutral-100">
									{{ q.answer }}
								</span>
								<UBadge
									:color="q.row !== null ? 'success' : 'error'"
									variant="subtle"
									size="xs"
								>
									{{ q.row !== null ? `(${q.row}, ${q.col}) ${q.direction === 'across' ? '→' : '↓'}` : 'Belum Diletakkan' }}
								</UBadge>
							</div>

							<div class="flex items-center gap-1">
								<UButton
									size="xs"
									:color="placingQuestionId === q.id ? 'primary' : 'neutral'"
									:variant="placingQuestionId === q.id ? 'solid' : 'outline'"
									icon="i-lucide-locate"
									@click="startPlacing(q)"
								>
									{{ placingQuestionId === q.id ? 'Memilih...' : 'Pilih Kotak' }}
								</UButton>
								<UTooltip v-if="q.row !== null" text="Lepas dari grid">
									<UButton
										size="xs"
										color="neutral"
										variant="ghost"
										icon="i-lucide-rotate-ccw"
										:aria-label="`Lepas ${q.answer} dari grid`"
										@click="unplaceWord(q)"
									/>
								</UTooltip>
								<UTooltip text="Hapus soal">
									<UButton
										size="xs"
										color="error"
										variant="ghost"
										icon="i-lucide-trash-2"
										:aria-label="`Hapus soal ${q.answer}`"
										@click="removeQuestion(q.id)"
									/>
								</UTooltip>
							</div>
						</div>

						<p class="text-xs text-neutral-600 dark:text-neutral-400 pl-4 border-l-2 border-neutral-200 dark:border-neutral-800">
							{{ q.clue }}
						</p>
					</div>
				</div>
			</UCard>
		</div>

		<!-- Kolom Kanan: Live Interactive Grid Canvas (7 cols di desktop) -->
		<div class="lg:col-span-7 space-y-4">
			<UCard :ui="{ body: 'p-3 sm:p-5' }">
				<template #header>
					<div class="flex items-center justify-between flex-wrap gap-2">
						<div class="flex items-center gap-2">
							<UIcon name="i-lucide-grid" class="w-5 h-5 text-amber-500" />
							<div>
								<h2 class="font-bold text-base sm:text-lg leading-tight">Live Interactive Grid Canvas</h2>
								<p class="text-xs text-muted">
									Klik kotak mana saja untuk meletakkan kata secara visual
								</p>
							</div>
						</div>

						<!-- Grid Controls -->
						<div class="flex items-center gap-2">
							<div class="flex items-center gap-1 text-xs">
								<span>Ukuran:</span>
								<UButton
									size="xs"
									variant="outline"
									color="neutral"
									@click="gridSize = Math.max(10, gridSize - 1)"
								>
									-
								</UButton>
								<span class="font-mono font-bold px-1.5">{{ gridSize }}x{{ gridSize }}</span>
								<UButton
									size="xs"
									variant="outline"
									color="neutral"
									@click="gridSize = Math.min(25, gridSize + 1)"
								>
									+
								</UButton>
							</div>

							<UButton
								size="xs"
								color="neutral"
								variant="outline"
								icon="i-lucide-refresh-cw"
								@click="toggleDirection"
							>
								Arah: {{ activeDirection === 'across' ? 'Mendatar (→)' : 'Menurun (↓)' }}
							</UButton>
						</div>
					</div>
				</template>

				<!-- Banner Status saat Mode Penempatan Aktif -->
				<div
					v-if="activePlacingQuestion"
					class="mb-3 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-pulse"
					:class="[
						hoverPlacementStatus?.valid
							? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200'
							: hoveredCell
								? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200'
								: 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-200'
					]"
				>
					<div class="flex items-center gap-2">
						<UIcon
							:name="hoverPlacementStatus?.valid ? 'i-lucide-check-circle' : 'i-lucide-info'"
							class="w-5 h-5 shrink-0"
						/>
						<div>
							<p class="font-bold">
								Sedang Meletakkan: "{{ activePlacingQuestion.answer }}" ({{ activeDirection === 'across' ? 'Mendatar →' : 'Menurun ↓' }})
							</p>
							<p class="text-xs opacity-80">
								{{ hoverPlacementStatus?.reason || 'Arahkan kursor & klik sel awal di bawah ini' }}
							</p>
						</div>
					</div>

					<UButton
						size="xs"
						color="neutral"
						variant="ghost"
						@click="placingQuestionId = null"
					>
						Batal
					</UButton>
				</div>

				<!-- Interactive Canvas Grid Container -->
				<div class="w-full overflow-x-auto flex justify-center py-2">
					<div
						class="inline-grid gap-1 bg-neutral-950 p-2.5 rounded-2xl shadow-2xl border-4 border-neutral-900"
						:style="{
							gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
						}"
						@mouseleave="hoveredCell = null"
					>
						<template v-for="r in gridSize" :key="`r-${r-1}`">
							<template v-for="c in gridSize" :key="`c-${r-1}-${c-1}`">
								<!-- Cell Item -->
								<div
									class="relative aspect-square w-7 sm:w-8 md:w-9 rounded-md flex items-center justify-center font-bold text-xs sm:text-sm select-none cursor-pointer transition-all duration-100"
									:class="[
										// Hover preview cell
										hoverCellMap.has(cellKey(r-1, c-1))
											? hoverPlacementStatus?.valid
												? 'bg-emerald-400 text-black font-black ring-4 ring-emerald-300 z-20 scale-105 shadow-xl'
												: 'bg-rose-600 text-white font-black ring-4 ring-rose-400 z-20 scale-105 shadow-xl'
											: occupiedLetters.has(cellKey(r-1, c-1))
												? 'bg-white text-black font-black shadow-md border border-neutral-300 hover:ring-2 hover:ring-amber-400'
												: 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800/80'
									]"
									@mouseenter="hoveredCell = { row: r-1, col: c-1 }"
									@click="handleGridCellClick(r-1, c-1)"
								>
									<!-- Huruf bayangan saat hover preview -->
									<span v-if="hoverCellMap.has(cellKey(r-1, c-1))" class="font-mono font-black">
										{{ hoverCellMap.get(cellKey(r-1, c-1)) }}
									</span>

									<!-- Huruf kata yang sudah ditempatkan -->
									<span v-else-if="occupiedLetters.has(cellKey(r-1, c-1))" class="font-mono font-black text-black">
										{{ occupiedLetters.get(cellKey(r-1, c-1))?.letter }}
									</span>

									<!-- Titik koordinat samar di sel kosong -->
									<span v-else class="text-[8px] text-neutral-400 font-mono">
										{{ r-1 }},{{ c-1 }}
									</span>
								</div>
							</template>
						</template>
					</div>
				</div>

				<div class="mt-4 flex items-center justify-between text-xs text-muted px-2">
					<div class="flex items-center gap-4">
						<span class="flex items-center gap-1.5">
							<span class="w-3 h-3 rounded bg-white dark:bg-neutral-900 border border-neutral-400 inline-block" />
							Kotak Terisi ({{ placedWords.length }} kata)
						</span>
						<span class="flex items-center gap-1.5">
							<span class="w-3 h-3 rounded bg-emerald-500 inline-block" />
							Preview Valid
						</span>
						<span class="flex items-center gap-1.5">
							<span class="w-3 h-3 rounded bg-rose-500 inline-block" />
							Tabrakan / Di Luar Grid
						</span>
					</div>

					<p class="hidden sm:block">
						Tips: Tekan tombol "Arah" untuk membalik horizontal/vertikal
					</p>
				</div>
			</UCard>
		</div>
	</div>
</template>
