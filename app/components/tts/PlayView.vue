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
const isRevealConfirmOpen = ref(false)

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
	(puzzles.value ?? []).map(p => ({ label: `Kelas ${p.grade || 1}: ${p.title}`, value: p.id }))
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

// Kunci jawaban membuat teka-teki tidak dapat bintang, jadi minta konfirmasi dulu
function confirmReveal() {
	store.revealAll()
	isRevealConfirmOpen.value = false
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
	<div class="space-y-5">
		<!-- Kepala permainan -->
		<section class="space-y-4">
			<div class="flex items-center justify-between gap-3">
				<UButton
					variant="ghost"
					color="neutral"
					icon="i-lucide-arrow-left"
					class="-ml-2.5 font-bold"
					@click="emit('backToPath')"
				>
					Peta Belajar
				</UButton>

				<div
					v-if="store.activePuzzle"
					class="flex items-center gap-1.5 px-3 h-10 rounded-md bg-default ring ring-default text-base font-bold tabular-nums"
					role="timer"
					:aria-label="`Waktu bermain ${timerText}`"
				>
					<UIcon name="i-lucide-timer" class="size-5 text-secondary" aria-hidden="true" />
					<span aria-hidden="true">{{ timerText }}</span>
				</div>
			</div>

			<div v-if="store.activePuzzle">
				<div class="flex flex-wrap items-center gap-2 mb-1.5">
					<UBadge v-if="store.activePuzzle.grade" color="primary" variant="soft" class="font-bold">
						Kelas {{ store.activePuzzle.grade }} SD
					</UBadge>
					<UBadge v-if="store.activePuzzle.subject" color="secondary" variant="soft" class="font-bold">
						{{ store.activePuzzle.subject }}
					</UBadge>
				</div>
				<h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-highlighted leading-tight">
					{{ store.activePuzzle.title }}
				</h2>
				<p v-if="store.activePuzzle.description" class="text-base text-muted mt-1">
					{{ store.activePuzzle.description }}
				</p>
			</div>

			<div v-if="store.activePuzzle" class="flex flex-wrap items-center gap-2">
				<UButton
					color="primary"
					icon="i-lucide-circle-check"
					class="font-bold"
					@click="store.checkAnswers"
				>
					Cek jawaban
				</UButton>

				<UButton
					variant="outline"
					color="neutral"
					icon="i-lucide-eraser"
					class="font-bold"
					@click="store.resetInputs"
				>
					Hapus isian
				</UButton>

				<UButton
					variant="ghost"
					color="neutral"
					icon="i-lucide-key-round"
					class="font-bold"
					:disabled="store.isRevealed"
					@click="isRevealConfirmOpen = true"
				>
					Lihat kunci
				</UButton>

				<USelect
					v-if="puzzleItems.length > 1"
					v-model="selectedPuzzleId"
					:items="puzzleItems"
					aria-label="Ganti teka-teki"
					icon="i-lucide-list"
					class="w-full sm:w-64 sm:ml-auto"
					@update:model-value="(id) => selectPuzzle(puzzles?.find(p => p.id === id))"
				/>
			</div>
		</section>

		<!-- Papan TTS dan daftar soal. Key ikut id teka-teki supaya ganti teka-teki juga memudar -->
		<Transition name="fade" mode="out-in">
		<div v-if="store.activePuzzle" :key="`papan-${store.activePuzzle.id}`" class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
			<div class="lg:col-span-7">
				<UCard :ui="{ body: 'p-3 sm:p-5' }">
					<p class="text-sm text-muted text-center mb-3">
						Ketuk kotak putih untuk membaca soal dan mengisi jawabannya.
					</p>
					<CrosswordGrid
						:has-next="!!nextPuzzle"
						@next="selectPuzzle(nextPuzzle)"
						@back-to-path="emit('backToPath')"
					/>
				</UCard>
			</div>

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
			description="Gurumu belum membuat teka-teki silang. Coba buka lagi nanti."
			variant="outline"
			size="xl"
		/>

		<div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-5" aria-busy="true" aria-label="Menyiapkan teka-teki">
			<USkeleton class="lg:col-span-7 h-80 rounded-lg" />
			<USkeleton class="lg:col-span-5 h-80 rounded-lg" />
		</div>
		</Transition>

		<UModal
			v-model:open="isRevealConfirmOpen"
			title="Buka kunci jawaban?"
			description="Semua kotak akan langsung terisi jawaban yang benar. Teka-teki ini tidak memberi bintang dan XP kalau kuncinya dibuka."
		>
			<template #footer>
				<div class="flex flex-wrap justify-end gap-2 w-full">
					<UButton color="neutral" variant="outline" class="font-bold" @click="isRevealConfirmOpen = false">
						Coba sendiri dulu
					</UButton>
					<UButton color="error" icon="i-lucide-key-round" class="font-bold" @click="confirmReveal">
						Buka kunci
					</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>
