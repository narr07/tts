<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '~/stores/authStore'

const emit = defineEmits<{
	(e: 'playPuzzle', puzzle: any): void
}>()

const auth = useAuthStore()

const selectedGrade = ref<number>(auth.currentUser?.grade || 1)
// Begitu siswa masuk (atau ganti akun), peta langsung pindah ke kelasnya
watch(() => auth.currentUser?.grade, (grade) => {
	if (grade) selectedGrade.value = grade
})
const selectedSubject = ref<string>('Semua')

const gradeThemes: Record<number, { name: string; phase: string; icon: string }> = {
	1: { name: 'Kelas 1 SD', phase: 'Fase A · Pengenalan Kata', icon: 'i-lucide-sprout' },
	2: { name: 'Kelas 2 SD', phase: 'Fase A · Kosakata Lingkungan', icon: 'i-lucide-trees' },
	3: { name: 'Kelas 3 SD', phase: 'Fase B · Sains & Budaya', icon: 'i-lucide-compass' },
	4: { name: 'Kelas 4 SD', phase: 'Fase B · Eksplorasi Nusantara', icon: 'i-lucide-lightbulb' },
	5: { name: 'Kelas 5 SD', phase: 'Fase C · Wawasan Ilmiah', icon: 'i-lucide-rocket' },
	6: { name: 'Kelas 6 SD', phase: 'Fase C · Uji Kompetensi Juara', icon: 'i-lucide-award' }
}

const currentTheme = computed(() => gradeThemes[selectedGrade.value] ?? gradeThemes[1]!)

// Fetch semua soal untuk kelas terpilih
const { data: allGradePuzzles, status, refresh } = await useFetch<any[]>(() => {
	return `/api/puzzles?grade=${selectedGrade.value}`
}, {
	watch: [selectedGrade]
})

// Mata pelajaran yang dinamis HANYA yang ada soalnya di kelas ini (sesuai instruksi guru)
const availableSubjects = computed(() => {
	const subs = new Set<string>()
	if (Array.isArray(allGradePuzzles.value)) {
		for (const p of allGradePuzzles.value) {
			if (p.subject) subs.add(p.subject)
		}
	}
	return ['Semua', ...Array.from(subs)]
})

// Jika subject terpilih tidak ada di list baru, kembalikan ke 'Semua'
watch(availableSubjects, (newSubs) => {
	if (!newSubs.includes(selectedSubject.value)) {
		selectedSubject.value = 'Semua'
	}
})

// Filter soal berdasarkan mata pelajaran aktif
const puzzles = computed(() => {
	if (!allGradePuzzles.value) return []
	if (selectedSubject.value === 'Semua') return allGradePuzzles.value
	return allGradePuzzles.value.filter(p => p.subject === selectedSubject.value)
})

// Fetch progress siswa
// Endpoint mengembalikan daftar kosong untuk tamu dan guru
const { data: studentProgress } = await useFetch<any[]>('/api/progress/student', {
	watch: [() => auth.currentUser?.id, () => auth.currentUser?.totalXp]
})

const completedPuzzleMap = computed(() => {
	const map: Record<string, { stars: number; score: number }> = {}
	if (Array.isArray(studentProgress.value)) {
		for (const item of studentProgress.value) {
			map[item.puzzleId] = { stars: item.stars, score: item.score }
		}
	}
	return map
})
</script>

<template>
	<div class="space-y-6 max-w-2xl mx-auto pb-16">
		<!-- Kartu Filter & Pemilihan Kelas -->
		<UCard :ui="{ body: 'p-4 sm:p-5' }">
			<div class="flex items-center justify-between gap-3 mb-4">
				<div>
					<span class="text-[11px] font-black uppercase tracking-wider text-primary">
						Jalur Petualangan Belajar
					</span>
					<h2 class="text-xl sm:text-2xl font-black tracking-tight">
						Pilih Tingkat Kelas
					</h2>
				</div>
				<span class="px-2.5 py-1 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800">
					{{ currentTheme.phase }}
				</span>
			</div>

			<!-- Grid Tombol Kelas 1-6 (Menggunakan komponen resmi UButton Nuxt UI) -->
			<div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
				<UButton
					v-for="g in 6"
					:key="`grade-${g}`"
					block
					:color="selectedGrade === g ? 'primary' : 'neutral'"
					:variant="selectedGrade === g ? 'solid' : 'subtle'"
					:icon="gradeThemes[g]?.icon"
					class="flex-col h-16 font-black cursor-pointer rounded-xl"
					@click="selectedGrade = g"
				>
					Kelas {{ g }}
				</UButton>
			</div>

			<!-- Filter Mata Pelajaran Dinamis (Hanya tampil jika ada lebih dari 1 opsi) -->
			<div
				v-if="availableSubjects.length > 1"
				class="pt-3 mt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto pb-1"
			>
				<span class="text-xs font-bold text-muted shrink-0">Pelajaran:</span>
				<div class="flex items-center gap-1.5 flex-nowrap sm:flex-wrap">
					<UButton
						v-for="subj in availableSubjects"
						:key="subj"
						size="xs"
						:variant="selectedSubject === subj ? 'solid' : 'subtle'"
						:color="selectedSubject === subj ? 'primary' : 'neutral'"
						class="font-bold shrink-0 rounded-lg cursor-pointer"
						@click="selectedSubject = subj"
					>
						{{ subj }}
					</UButton>
				</div>
			</div>
		</UCard>

		<!-- Loading State (UIcon animate-spin) -->
		<div v-if="status === 'pending'" class="p-16 text-center text-muted">
			<UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
			<p class="text-sm font-bold">Memuat peta petualangan kata...</p>
		</div>

		<UAlert
			v-else-if="status === 'error'"
			color="error"
			variant="subtle"
			icon="i-lucide-circle-alert"
			title="Peta belajar gagal dimuat"
			description="Periksa koneksi internet, lalu coba lagi."
			:actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: () => refresh() }]"
		/>

		<!-- Empty State (Menggunakan komponen resmi UEmpty Nuxt UI) -->
		<UEmpty
			v-else-if="!puzzles || puzzles.length === 0"
			icon="i-lucide-book-open"
			title="Belum Ada Soal TTS"
			:description="`Belum ada teka-teki silang yang dibuat guru untuk kategori pelajaran ini di Kelas ${selectedGrade}.`"
			class="p-8 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm bg-white dark:bg-neutral-900"
		>
			<template #actions>
				<UButton
					size="sm"
					variant="soft"
					color="primary"
					class="font-bold cursor-pointer"
					@click="selectedSubject = 'Semua'"
				>
					Lihat Semua Pelajaran
				</UButton>
			</template>
		</UEmpty>

		<!-- Daftar Kartu Teka-Teki Silang (Peta Misi) -->
		<div v-else class="space-y-4">
			<UCard
				v-for="(puzzle, idx) in puzzles"
				:key="puzzle.id"
				class="cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
				:class="completedPuzzleMap[puzzle.id] ? 'ring-2 ring-amber-400/80 bg-amber-50/10' : ''"
				:ui="{ body: 'p-4 sm:p-5' }"
				@click="emit('playPuzzle', puzzle)"
			>
				<div class="flex items-center justify-between gap-3 sm:gap-4">
					<div class="flex items-center gap-3 sm:gap-4 min-w-0">
						<!-- Icon Milestone Box -->
						<div
							class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm border-b-2 select-none"
							:class="[
								completedPuzzleMap[puzzle.id]
									? 'bg-amber-500 border-amber-700 text-inverted'
									: 'bg-primary border-primary-600 text-inverted shadow-primary/20'
							]"
						>
							<UIcon
								:name="completedPuzzleMap[puzzle.id] ? 'i-lucide-check-check' : puzzle.icon || 'i-lucide-puzzle'"
								class="w-6 h-6 sm:w-7 sm:h-7"
							/>
							<span class="text-[10px] sm:text-xs font-black tracking-tight mt-0.5 leading-none">
								Misi {{ idx + 1 }}
							</span>
						</div>

						<!-- Info Soal -->
						<div class="min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
									{{ puzzle.subject }}
								</span>
								<span class="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
									{{ puzzle.questionCount }} Kotak Soal
								</span>
							</div>
							<h3 class="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-neutral-100 truncate hover:text-primary transition-colors">
								{{ puzzle.title }}
							</h3>
							<p class="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
								{{ puzzle.description || 'Selesaikan tantangan teka-teki silang ini dan kumpulkan bintang!' }}
							</p>
						</div>
					</div>

					<!-- Sisi Kanan: Bintang & Tombol Aksi -->
					<div class="flex flex-col items-end gap-1.5 shrink-0 pl-1">
						<div
							class="flex gap-0.5 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg"
							role="img"
							:aria-label="`${completedPuzzleMap[puzzle.id]?.stars ?? 0} dari 3 bintang`"
						>
							<span
								v-for="star in 3"
								:key="star"
								aria-hidden="true"
								class="text-xs sm:text-sm leading-none"
								:class="(completedPuzzleMap[puzzle.id]?.stars ?? 0) >= star ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-600'"
							>
								★
							</span>
						</div>

						<UButton
							size="xs"
							:color="completedPuzzleMap[puzzle.id] ? 'primary' : 'neutral'"
							:variant="completedPuzzleMap[puzzle.id] ? 'subtle' : 'solid'"
							trailing-icon="i-lucide-play"
							class="font-bold cursor-pointer"
						>
							{{ completedPuzzleMap[puzzle.id] ? 'Ulangi' : 'Mainkan' }}
						</UButton>
					</div>
				</div>
			</UCard>
		</div>
	</div>
</template>