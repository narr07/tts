<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCrosswordStore } from '~/stores/crosswordStore'
import { useIntervalFn } from '@vueuse/core'
import CrosswordGrid from './CrosswordGrid.vue'
import CluesPanel from './CluesPanel.vue'

const props = defineProps<{
	initialPuzzle?: any
}>()

const emit = defineEmits<{
	(e: 'backToPath'): void
}>()

const store = useCrosswordStore()
const selectedPuzzleId = ref<string>('')

// Data fetching puzzles list
const { data: puzzles, status, refresh } = await useFetch<any[]>('/api/puzzles')

const timerText = computed(() => {
	const mins = Math.floor(store.secondsElapsed / 60)
	const secs = store.secondsElapsed % 60
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const { resume } = useIntervalFn(() => {
	if (store.isTimerRunning) {
		store.secondsElapsed++
	}
}, 1000, { immediate: false })

const puzzleItems = computed(() =>
	(puzzles.value ?? []).map(p => ({ label: `[K${p.grade || 1}] ${p.title}`, value: p.id }))
)

const nextPuzzle = computed(() => {
	const list = puzzles.value
	if (!Array.isArray(list)) return null
	const idx = list.findIndex(p => p.id === selectedPuzzleId.value)
	return idx >= 0 ? list[idx + 1] ?? null : null
})

function selectPuzzle(puzzle: any) {
	if (!puzzle) return
	selectedPuzzleId.value = puzzle.id
	store.initPuzzle(puzzle)
	resume()
}

// Watch initialPuzzle prop
watch(
	() => props.initialPuzzle,
	(p) => {
		if (p) {
			selectPuzzle(p)
		}
	},
	{ immediate: true }
)

// Inisialisasi puzzle pertama jika data tersedia dan belum ada yang dipilih
watch(
	puzzles,
	(list) => {
		if (Array.isArray(list) && list.length > 0 && !selectedPuzzleId.value && !props.initialPuzzle) {
			selectPuzzle(list[0])
		}
	},
	{ immediate: true }
)
</script>

<template>
	<div class="space-y-6">
		<!-- Puzzle Picker & Game Bar -->
		<UCard :ui="{ body: 'p-3 sm:p-4' }">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<!-- Puzzle Selector & Back Button -->
				<div class="flex items-center gap-3">
					<UButton
						size="sm"
						variant="ghost"
						color="neutral"
						icon="i-lucide-arrow-left"
						class="shrink-0 cursor-pointer"
						@click="emit('backToPath')"
					>
						Peta Belajar
					</UButton>

					<div class="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
						<UIcon name="i-lucide-puzzle" class="w-6 h-6" />
					</div>
					<div>
						<div class="flex items-center gap-2 flex-wrap">
							<h2 class="font-black text-base sm:text-lg leading-tight">
								{{ store.activePuzzle?.title || 'Teka-Teki Silang' }}
							</h2>
							<span
								v-if="store.activePuzzle?.grade"
								class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800"
							>
								Kelas {{ store.activePuzzle.grade }} SD
							</span>
							<span
								v-if="store.activePuzzle?.subject"
								class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
							>
								{{ store.activePuzzle.subject }}
							</span>
						</div>
						<p class="text-xs text-muted mt-0.5 line-clamp-1">
							{{ store.activePuzzle?.description || 'Silakan isi kotak teka-teki silang!' }}
						</p>
					</div>
				</div>

				<!-- Action Controls & Timer -->
				<div class="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
					<!-- Timer -->
					<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-mono font-bold">
						<UIcon name="i-lucide-timer" class="w-4 h-4 text-amber-500" />
						<span>{{ timerText }}</span>
					</div>

					<!-- Puzzle Dropdown -->
					<USelect
						v-if="puzzleItems.length > 0"
						v-model="selectedPuzzleId"
						:items="puzzleItems"
						aria-label="Pilih teka-teki"
						size="sm"
						class="max-w-[200px]"
						@update:model-value="(id) => selectPuzzle(puzzles?.find(p => p.id === id))"
					/>

					<UButton
						size="sm"
						color="primary"
						icon="i-lucide-check-circle"
						@click="store.checkAnswers"
					>
						Cek
					</UButton>

					<UButton
						size="sm"
						variant="outline"
						color="neutral"
						icon="i-lucide-refresh-cw"
						@click="store.resetInputs"
					>
						Reset
					</UButton>

					<UButton
						size="sm"
						variant="outline"
						color="neutral"
						icon="i-lucide-eye"
						@click="store.revealAll"
					>
						Kunci
					</UButton>
				</div>
			</div>
		</UCard>

		<!-- Main Play Grid and Clues -->
		<div v-if="store.activePuzzle" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
			<!-- Crossword Grid Area (7 cols on desktop) -->
			<div class="lg:col-span-7 flex flex-col items-center">
				<UCard class="w-full" :ui="{ body: 'p-2 sm:p-4' }">
					<CrosswordGrid
						:has-next="!!nextPuzzle"
						@next="selectPuzzle(nextPuzzle)"
						@back-to-path="emit('backToPath')"
					/>
				</UCard>
			</div>

			<!-- Clues Panel Area (5 cols on desktop) -->
			<div class="lg:col-span-5">
				<CluesPanel />
			</div>
		</div>

		<UAlert
			v-else-if="status === 'error'"
			color="error"
			variant="subtle"
			icon="i-lucide-circle-alert"
			title="Teka-teki gagal dimuat"
			description="Periksa koneksi internet, lalu coba lagi."
			:actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: () => refresh() }]"
		/>

		<UEmpty
			v-else-if="status === 'success' && puzzleItems.length === 0"
			icon="i-lucide-book-open"
			title="Belum ada teka-teki"
			description="Guru belum membuat teka-teki silang. Coba buka lagi nanti."
		/>

		<!-- Loading State -->
		<div v-else class="p-12 text-center text-muted">
			<UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
			<p class="text-sm">Menyiapkan teka-teki silang...</p>
		</div>
	</div>
</template>
