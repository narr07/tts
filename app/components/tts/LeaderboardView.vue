<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/authStore'
import LetterTile from './LetterTile.vue'

const auth = useAuthStore()
const selectedGrade = ref<number | null>(null)

// SSR-friendly useFetch
const { data: students, status, refresh } = await useFetch<any[]>(() => {
	return selectedGrade.value
		? `/api/leaderboard?grade=${selectedGrade.value}`
		: '/api/leaderboard'
}, {
	watch: [selectedGrade]
})

const list = computed(() => students.value ?? [])
const showPodium = computed(() => list.value.length >= 3)
// Tiga teratas sudah tampil di podium, jadi daftar di bawahnya mulai dari peringkat 4
const rest = computed(() => showPodium.value ? list.value.slice(3) : list.value)
const restOffset = computed(() => showPodium.value ? 3 : 0)

// Urutan tampil podium: 2, 1, 3 supaya juara pertama di tengah
const podium = computed(() => {
	if (!showPodium.value) return []
	return [
		{ rank: 2, student: list.value[1], height: 'h-16 sm:h-20', block: 'bg-accented text-toned' },
		{ rank: 1, student: list.value[0], height: 'h-24 sm:h-28', block: 'bg-secondary/20 text-secondary' },
		{ rank: 3, student: list.value[2], height: 'h-12 sm:h-16', block: 'bg-accented text-toned' }
	]
})

const isMe = (s: any) => auth.isStudent && auth.currentUser?.id === s.id
</script>

<template>
	<div class="max-w-3xl mx-auto space-y-6">
		<div>
			<h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-highlighted">
				Papan Peringkat
			</h2>
			<p class="text-base text-muted mt-1">
				Selesaikan teka-teki untuk mengumpulkan XP dan bintang.
			</p>
		</div>

		<div
			class="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 py-1"
			role="group"
			aria-label="Pilih kelas"
		>
			<UButton
				:color="selectedGrade === null ? 'primary' : 'neutral'"
				:variant="selectedGrade === null ? 'solid' : 'soft'"
				:aria-pressed="selectedGrade === null"
				class="font-bold shrink-0"
				@click="selectedGrade = null"
			>
				Semua kelas
			</UButton>
			<UButton
				v-for="g in 6"
				:key="`grade-btn-${g}`"
				:color="selectedGrade === g ? 'primary' : 'neutral'"
				:variant="selectedGrade === g ? 'solid' : 'soft'"
				:aria-pressed="selectedGrade === g"
				class="font-bold shrink-0"
				@click="selectedGrade = g"
			>
				Kelas {{ g }}
			</UButton>
		</div>

		<!-- Memuat, galat, kosong, dan daftar bergantian dengan memudar; key ikut kelas supaya ganti kelas juga memudar -->
		<Transition name="fade" mode="out-in">
		<div v-if="status === 'pending'" class="space-y-2" aria-busy="true" aria-label="Memuat peringkat">
			<USkeleton v-for="n in 5" :key="n" class="h-18 rounded-lg" />
		</div>

		<UAlert
			v-else-if="status === 'error'"
			color="error"
			variant="subtle"
			icon="i-lucide-circle-alert"
			title="Papan peringkat gagal dimuat"
			description="Periksa koneksi internet, lalu coba lagi."
			:actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: () => refresh() }]"
		/>

		<UEmpty
			v-else-if="list.length === 0"
			icon="i-lucide-trophy"
			title="Belum ada yang masuk peringkat"
			:description="selectedGrade ? `Belum ada siswa Kelas ${selectedGrade} yang menyelesaikan teka-teki. Jadilah yang pertama!` : 'Selesaikan teka-teki pertamamu supaya namamu muncul di sini.'"
			variant="outline"
			size="xl"
		/>

		<div v-else :key="`peringkat-${selectedGrade ?? 'semua'}`" class="space-y-6">
			<!-- Podium tiga teratas -->
			<ol v-if="showPodium" class="grid grid-cols-3 gap-2 sm:gap-4 items-end" aria-label="Tiga juara teratas">
				<li
					v-for="p in podium"
					:key="p.rank"
					class="flex flex-col items-center gap-2 min-w-0"
				>
					<LetterTile
						:label="p.rank"
						:icon="p.rank === 1 ? 'i-lucide-crown' : undefined"
						:corner="p.rank === 1 ? 1 : undefined"
						:color="p.rank === 1 ? 'secondary' : 'neutral'"
						:size="p.rank === 1 ? 'lg' : 'md'"
						role="img"
						:aria-label="`Peringkat ${p.rank}`"
					/>
					<div class="text-center min-w-0 w-full">
						<UBadge v-if="isMe(p.student)" color="primary" variant="solid" size="sm" class="mb-0.5">
							Kamu
						</UBadge>
						<p class="font-extrabold text-sm sm:text-base text-highlighted truncate">
							{{ p.student.name }}
						</p>
						<p class="text-xs sm:text-sm text-muted truncate">
							{{ p.student.schoolName }}
						</p>
						<p class="font-extrabold text-sm sm:text-base text-secondary mt-0.5">
							{{ p.student.totalXp }} XP
						</p>
					</div>
					<div
						class="w-full rounded-t-lg flex items-start justify-center pt-2 font-extrabold text-2xl"
						:class="[p.height, p.block]"
						aria-hidden="true"
					>
						{{ p.rank }}
					</div>
				</li>
			</ol>

			<UCard v-if="rest.length > 0" :ui="{ body: 'p-2 sm:p-3' }">
				<ol class="divide-y divide-default" :start="restOffset + 1">
					<li
						v-for="(s, idx) in rest"
						:key="s.id"
						class="flex items-center gap-3 p-2.5 sm:p-3 rounded-md"
						:class="isMe(s) ? 'bg-primary/10' : ''"
					>
						<LetterTile
							:label="restOffset + idx + 1"
							:color="isMe(s) ? 'primary' : 'neutral'"
							size="sm"
							role="img"
							:aria-label="`Peringkat ${restOffset + idx + 1}`"
						/>

						<div class="flex-1 min-w-0">
							<p class="font-bold text-base text-highlighted truncate">
								{{ s.name }}
								<UBadge v-if="isMe(s)" color="primary" variant="solid" size="sm" class="ml-1 align-middle">
									Kamu
								</UBadge>
							</p>
							<p class="text-sm text-muted truncate">
								Kelas {{ s.grade }} · {{ s.schoolName }}
							</p>
						</div>

						<div class="text-right shrink-0">
							<p class="font-extrabold text-base text-secondary">
								{{ s.totalXp }} XP
							</p>
							<p class="text-sm text-muted" :aria-label="`${s.totalStars} bintang`">
								<span aria-hidden="true">★ {{ s.totalStars }}</span>
							</p>
						</div>
					</li>
				</ol>
			</UCard>
		</div>
		</Transition>
	</div>
</template>
