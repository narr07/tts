<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '~/stores/authStore'
import LetterTile from './LetterTile.vue'

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

const firstName = computed(() => auth.isStudent ? auth.currentUser?.name?.split(' ')[0] : '')
const doneCount = computed(() => puzzles.value.filter(p => completedPuzzleMap.value[p.id]).length)
// Misi pertama yang belum selesai jadi titik fokus: kotak biru dan tombol penuh, misi lain lebih tenang
const nextMissionId = computed(() => puzzles.value.find(p => !completedPuzzleMap.value[p.id])?.id)
</script>

<template>
	<div class="max-w-2xl mx-auto space-y-6">
		<!-- Pemilihan kelas -->
		<section aria-labelledby="judul-peta" class="space-y-4">
			<div>
				<h2 id="judul-peta" class="text-2xl sm:text-3xl font-extrabold tracking-tight text-highlighted">
					{{ firstName ? `Halo, ${firstName}!` : 'Peta Belajar' }}
				</h2>
				<p class="text-base text-muted mt-1">
					Pilih kelasmu, lalu selesaikan misinya satu per satu.
				</p>
			</div>

			<div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
				<UButton
					v-for="g in 6"
					:key="`grade-${g}`"
					block
					:color="selectedGrade === g ? 'primary' : 'neutral'"
					:variant="selectedGrade === g ? 'solid' : 'outline'"
					:icon="gradeThemes[g]?.icon"
					:aria-pressed="selectedGrade === g"
					class="flex-col gap-1 h-18 font-bold text-base"
					:ui="{ leadingIcon: 'size-6' }"
					@click="selectedGrade = g"
				>
					Kelas {{ g }}
				</UButton>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<UBadge color="secondary" variant="soft" size="lg" class="font-bold">
					{{ currentTheme.phase }}
				</UBadge>
				<span v-if="status === 'success' && puzzles.length > 0 && auth.isStudent" class="text-sm text-muted">
					{{ doneCount }} dari {{ puzzles.length }} misi selesai
				</span>
			</div>

			<!-- Filter mata pelajaran, hanya kalau kelas ini punya lebih dari satu -->
			<div
				v-if="availableSubjects.length > 2"
				class="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 py-1"
				role="group"
				aria-label="Pilih mata pelajaran"
			>
				<UButton
					v-for="subj in availableSubjects"
					:key="subj"
					:variant="selectedSubject === subj ? 'solid' : 'soft'"
					:color="selectedSubject === subj ? 'secondary' : 'neutral'"
					:aria-pressed="selectedSubject === subj"
					class="font-bold shrink-0"
					@click="selectedSubject = subj"
				>
					{{ subj }}
				</UButton>
			</div>
		</section>

		<!-- Memuat, galat, kosong, dan daftar misi bergantian dengan memudar -->
		<Transition name="fade" mode="out-in">
		<div v-if="status === 'pending'" class="space-y-4" aria-busy="true" aria-label="Memuat misi">
			<div v-for="n in 3" :key="n" class="flex items-center gap-4">
				<USkeleton class="size-12 rounded-md" />
				<USkeleton class="h-28 flex-1 rounded-lg" />
			</div>
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

		<UEmpty
			v-else-if="!puzzles || puzzles.length === 0"
			icon="i-lucide-book-open"
			:title="`Belum ada misi untuk Kelas ${selectedGrade}`"
			description="Gurumu belum membuat teka-teki silang di kelas ini. Coba pilih kelas lain dulu."
			variant="outline"
			size="xl"
		/>

		<ol v-else :key="`misi-${selectedSubject}`" class="relative space-y-4" aria-label="Daftar misi">
			<!-- Jalur misi: kotak bernomor disambung garis putus-putus. Key ikut pelajaran supaya ganti filter juga memudar -->
			<span
				aria-hidden="true"
				class="absolute left-6 top-6 bottom-6 -translate-x-1/2 border-l-2 border-dashed border-accented"
			/>
			<li
				v-for="(puzzle, idx) in puzzles"
				:key="puzzle.id"
				class="relative flex items-center gap-3 sm:gap-4"
			>
				<LetterTile
					v-if="completedPuzzleMap[puzzle.id]"
					icon="i-lucide-check"
					color="success"
					role="img"
					:aria-label="`Misi ${idx + 1}, selesai`"
				/>
				<LetterTile
					v-else
					:label="idx + 1"
					:color="puzzle.id === nextMissionId ? 'primary' : 'neutral'"
					role="img"
					:aria-label="puzzle.id === nextMissionId ? `Misi ${idx + 1}, misi berikutnya` : `Misi ${idx + 1}`"
				/>

				<UCard
					class="flex-1 min-w-0 cursor-pointer transition-shadow hover:shadow-md hover:ring-primary/50"
					:class="puzzle.id === nextMissionId ? 'ring-2 ring-primary' : ''"
					:ui="{ body: 'p-4 sm:p-5' }"
					@click="emit('playPuzzle', puzzle)"
				>
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
						<UBadge v-if="puzzle.subject" color="secondary" variant="soft" class="font-bold">
							{{ puzzle.subject }}
						</UBadge>
						<span class="text-sm text-muted">{{ puzzle.questionCount }} soal</span>
					</div>

					<h3 class="text-lg font-extrabold leading-snug text-highlighted">
						{{ puzzle.title }}
					</h3>
					<p v-if="puzzle.description" class="text-sm text-muted line-clamp-2 mt-0.5">
						{{ puzzle.description }}
					</p>

					<div class="mt-3 flex items-center justify-between gap-3">
						<span
							class="flex gap-0.5 text-2xl leading-none"
							role="img"
							:aria-label="`${completedPuzzleMap[puzzle.id]?.stars ?? 0} dari 3 bintang`"
						>
							<span
								v-for="star in 3"
								:key="star"
								aria-hidden="true"
								:class="(completedPuzzleMap[puzzle.id]?.stars ?? 0) >= star ? 'text-secondary-500' : 'text-dimmed opacity-40'"
							>★</span>
						</span>

						<UButton
							:color="completedPuzzleMap[puzzle.id] ? 'neutral' : 'primary'"
							:variant="completedPuzzleMap[puzzle.id] ? 'outline' : puzzle.id === nextMissionId ? 'solid' : 'soft'"
							:icon="completedPuzzleMap[puzzle.id] ? 'i-lucide-rotate-ccw' : 'i-lucide-play'"
							class="font-bold"
							@click.stop="emit('playPuzzle', puzzle)"
						>
							{{ completedPuzzleMap[puzzle.id] ? 'Main lagi' : 'Mainkan' }}
						</UButton>
					</div>
				</UCard>
			</li>
		</ol>
		</Transition>
	</div>
</template>

