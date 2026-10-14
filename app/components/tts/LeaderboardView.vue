<script setup lang="ts">
import { ref } from 'vue'

const selectedGrade = ref<number | null>(null)

// SSR-friendly useFetch
const { data: students, status, refresh } = await useFetch<any[]>(() => {
	return selectedGrade.value
		? `/api/leaderboard?grade=${selectedGrade.value}`
		: '/api/leaderboard'
}, {
	watch: [selectedGrade]
})
</script>

<template>
	<div class="space-y-6 max-w-4xl mx-auto">
		<!-- Header Banner -->
		<div class="p-6 rounded-3xl bg-amber-700 text-white shadow-2xl text-center space-y-2 relative overflow-hidden">
			<div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-3xl mx-auto flex items-center justify-center shadow-inner">
				👑
			</div>
			<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white">
				Papan Peringkat Juara TTS SD
			</h2>
			<p class="text-xs sm:text-sm text-amber-100 max-w-md mx-auto">
				Kumpulkan XP dan bintang emas dengan menyelesaikan teka-teki silang tematik setiap hari!
			</p>
		</div>

		<!-- Grade Filter Pills -->
		<div class="flex items-center justify-center gap-1.5 flex-wrap">
			<UButton
				size="sm"
				:color="selectedGrade === null ? 'primary' : 'neutral'"
				:variant="selectedGrade === null ? 'solid' : 'outline'"
				class="font-bold text-xs"
				@click="selectedGrade = null"
			>
				Semua Kelas
			</UButton>
			<UButton
				v-for="g in 6"
				:key="`grade-btn-${g}`"
				size="sm"
				:color="selectedGrade === g ? 'primary' : 'neutral'"
				:variant="selectedGrade === g ? 'solid' : 'outline'"
				class="font-bold text-xs"
				@click="selectedGrade = g"
			>
				Kelas {{ g }}
			</UButton>
		</div>

		<!-- Podium Top 3 (if at least 3 students exist) -->
		<div v-if="students && students.length >= 3" class="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-6 pb-2">
			<!-- Rank 2 -->
			<div class="flex flex-col items-center space-y-2 order-1">
				<div class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center text-xl sm:text-2xl shadow-lg relative">
					🥈
					<span class="absolute -bottom-2 px-2 py-0.5 rounded-full bg-slate-600 text-[10px] text-white font-black shadow-sm">
						#2
					</span>
				</div>
				<div class="text-center">
					<p class="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
						{{ students[1].name }}
					</p>
					<p class="text-[10px] text-toned line-clamp-1">
						{{ students[1].schoolName }}
					</p>
					<p class="font-black text-xs text-amber-700 dark:text-amber-400 mt-0.5">
						⚡ {{ students[1].totalXp }} XP
					</p>
				</div>
				<div class="w-full h-16 sm:h-20 bg-slate-300 dark:bg-slate-700 rounded-t-2xl flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-lg shadow-inner">
					2
				</div>
			</div>

			<!-- Rank 1 (Tallest) -->
			<div class="flex flex-col items-center space-y-2 order-2 -mt-4">
				<div class="w-14 h-14 sm:w-20 sm:h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 border-4 border-amber-400 flex items-center justify-center text-2xl sm:text-4xl shadow-2xl relative">
					👑
					<span class="absolute -bottom-2.5 px-2.5 py-0.5 rounded-full bg-amber-700 text-[10px] sm:text-xs text-white font-black shadow-md">
						#1 Juara
					</span>
				</div>
				<div class="text-center">
					<p class="font-black text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-1">
						{{ students[0].name }}
					</p>
					<p class="text-[10px] sm:text-xs text-toned line-clamp-1">
						{{ students[0].schoolName }}
					</p>
					<p class="font-black text-sm text-amber-700 dark:text-amber-400 mt-0.5">
						⚡ {{ students[0].totalXp }} XP
					</p>
				</div>
				<div class="w-full h-24 sm:h-28 bg-amber-400 rounded-t-2xl flex items-center justify-center font-black text-amber-950 text-2xl shadow-xl">
					1
				</div>
			</div>

			<!-- Rank 3 -->
			<div class="flex flex-col items-center space-y-2 order-3">
				<div class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-amber-900/10 dark:bg-amber-950/40 border-2 border-amber-700/30 flex items-center justify-center text-xl sm:text-2xl shadow-lg relative">
					🥉
					<span class="absolute -bottom-2 px-2 py-0.5 rounded-full bg-amber-700 text-[10px] text-white font-black shadow-sm">
						#3
					</span>
				</div>
				<div class="text-center">
					<p class="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
						{{ students[2].name }}
					</p>
					<p class="text-[10px] text-toned line-clamp-1">
						{{ students[2].schoolName }}
					</p>
					<p class="font-black text-xs text-amber-700 dark:text-amber-400 mt-0.5">
						⚡ {{ students[2].totalXp }} XP
					</p>
				</div>
				<div class="w-full h-12 sm:h-16 bg-amber-200 dark:bg-amber-900/40 rounded-t-2xl flex items-center justify-center font-black text-amber-800 dark:text-amber-200 text-base shadow-inner">
					3
				</div>
			</div>
		</div>

		<!-- Table List -->
		<UCard :ui="{ body: 'p-3 sm:p-5' }">
			<div v-if="status === 'pending'" class="p-8 text-center text-muted">
				<UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
				<p class="text-xs">Memuat peringkat siswa...</p>
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

			<div v-else-if="!students || students.length === 0" class="p-8 text-center text-muted text-sm">
				Belum ada data nilai untuk kelas ini.
			</div>

			<div v-else class="space-y-2">
				<div
					v-for="(s, idx) in students"
					:key="s.id"
					class="flex items-center justify-between p-3 rounded-2xl border transition-all"
					:class="idx === 0 ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'"
				>
					<div class="flex items-center gap-3">
						<!-- Rank Number -->
						<div
							class="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
							:class="[
								idx === 0 ? 'bg-amber-700 text-white shadow-md' :
								idx === 1 ? 'bg-slate-400 text-white' :
								idx === 2 ? 'bg-amber-700 text-white' :
								'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
							]"
						>
							{{ idx + 1 }}
						</div>

						<div>
							<div class="flex items-center gap-2">
								<p class="font-extrabold text-sm text-neutral-900 dark:text-neutral-100">
									{{ s.name }}
								</p>
								<UBadge color="primary" variant="subtle" size="xs">
									Kelas {{ s.grade }} SD
								</UBadge>
							</div>
							<p class="text-xs text-muted mt-0.5">
								{{ s.schoolName }}
							</p>
						</div>
					</div>

					<div class="flex items-center gap-3 text-right">
						<div>
							<div class="font-black text-sm text-amber-700 dark:text-amber-400">
								⚡ {{ s.totalXp }} <span class="text-[10px] font-bold text-muted">XP</span>
							</div>
							<div class="text-xs font-bold text-amber-700 dark:text-amber-400">
								⭐ {{ s.totalStars }} Bintang
							</div>
						</div>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>
