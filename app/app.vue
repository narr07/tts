<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/authStore'
import AuthModal from '~/components/tts/AuthModal.vue'
import ProfileModal from '~/components/tts/ProfileModal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isAuthModalOpen = ref(false)
const isProfileModalOpen = ref(false)

type TabType = 'path' | 'play' | 'leaderboard' | 'admin' | 'users'

const currentTab = computed<TabType>({
	get: () => {
		const t = route.query.tab as TabType
		if (['path', 'play', 'leaderboard', 'admin', 'users'].includes(t)) {
			return t
		}
		return 'path' // Default ke jalur petualangan kata!
	},
	set: (val) => router.push({ query: { ...route.query, tab: val === 'path' ? undefined : val } })
})
</script>

<template>
	<UApp>
		<div class="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200">
			<!-- Header Utama -->
			<header class="sticky top-0 z-40 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
				<div class="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
					<!-- Logo & Brand -->
					<div
						class="flex items-center gap-2.5 cursor-pointer shrink-0 select-none"
						@click="currentTab = 'path'"
					>
						<div class="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20 font-black text-xl">
							🧩
						</div>
						<div>
							<h1 class="font-black text-base sm:text-lg tracking-tight leading-tight flex items-center gap-1.5">
								<span>Petualangan Kata SD</span>
								<span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
									Kelas 1-6
								</span>
							</h1>
							<p class="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
								Teka-Teki Silang Tematik Kurikulum Merdeka
							</p>
						</div>
					</div>

					<!-- Navigation Tabs -->
					<nav aria-label="Navigasi Utama" class="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-x-auto max-w-full">
						<button
							type="button"
							role="tab"
							:aria-selected="currentTab === 'path'"
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
							:class="currentTab === 'path' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'"
							@click="currentTab = 'path'"
						>
							<UIcon name="i-lucide-map" class="w-4 h-4" />
							<span>Peta Belajar</span>
						</button>

						<button
							type="button"
							role="tab"
							:aria-selected="currentTab === 'play'"
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
							:class="currentTab === 'play' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'"
							@click="currentTab = 'play'"
						>
							<UIcon name="i-lucide-gamepad-2" class="w-4 h-4" />
							<span>Bermain</span>
						</button>

						<button
							type="button"
							role="tab"
							:aria-selected="currentTab === 'leaderboard'"
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
							:class="currentTab === 'leaderboard' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'"
							@click="currentTab = 'leaderboard'"
						>
							<UIcon name="i-lucide-trophy" class="w-4 h-4" />
							<span>Peringkat</span>
						</button>

						<!-- Admin Studio Tab (Visible to Teacher and Super Admin) -->
						<button
							v-if="auth.isTeacher"
							type="button"
							role="tab"
							:aria-selected="currentTab === 'admin'"
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
							:class="currentTab === 'admin' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'"
							@click="currentTab = 'admin'"
						>
							<UIcon name="i-lucide-pencil-ruler" class="w-4 h-4" />
							<span>Studio Guru</span>
						</button>

						<!-- Super Admin Users Management Tab -->
						<button
							v-if="auth.isAdmin"
							type="button"
							role="tab"
							:aria-selected="currentTab === 'users'"
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
							:class="currentTab === 'users' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'"
							@click="currentTab = 'users'"
						>
							<UIcon name="i-lucide-shield-check" class="w-4 h-4 text-primary" />
							<span>Kelola Pengguna</span>
						</button>
					</nav>

					<!-- User Profile / Auth Button -->
					<div class="flex items-center gap-2 shrink-0">
						<!-- Jika Sudah Login -->
						<div v-if="auth.isLoggedIn && auth.currentUser" class="flex items-center gap-2">
							<!-- Siswa Stats Pill -->
							<div
								v-if="auth.isStudent"
								class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs"
							>
								<span class="font-extrabold text-amber-700 dark:text-amber-400">⚡ {{ auth.currentUser.totalXp || 0 }} XP</span>
								<span class="text-neutral-300 dark:text-neutral-700">•</span>
								<span class="font-bold text-amber-600 dark:text-amber-400">⭐ {{ auth.currentUser.totalStars || 0 }}</span>
							</div>

							<!-- User Badge (Dapat diklik untuk edit profil sendiri) -->
							<div class="flex items-center gap-1.5 pl-2">
								<button
									type="button"
									class="text-right hidden sm:block hover:opacity-80 transition-opacity cursor-pointer group select-none"
									title="Klik untuk mengedit profil Anda"
									@click="isProfileModalOpen = true"
								>
									<p class="font-extrabold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-primary transition-colors flex items-center justify-end gap-1">
										<span>{{ auth.currentUser.name }}</span>
										<UIcon name="i-lucide-pencil" class="w-3 h-3 text-neutral-400 group-hover:text-primary" />
									</p>
									<p class="text-[10px] text-neutral-500 line-clamp-1">
										{{ auth.isAdmin ? 'Super Admin' : auth.isTeacher ? 'Guru Pembimbing' : `Kelas ${auth.currentUser.grade} SD · ${auth.currentUser.schoolName}` }}
									</p>
								</button>

								<UButton
									size="xs"
									color="neutral"
									variant="ghost"
									icon="i-lucide-user-pen"
									title="Edit Profil Saya"
									class="cursor-pointer"
									@click="isProfileModalOpen = true"
								/>

								<UButton
									size="xs"
									color="neutral"
									variant="outline"
									icon="i-lucide-log-out"
									title="Keluar Akun"
									class="cursor-pointer"
									@click="auth.logout"
								>
									Keluar
								</UButton>
							</div>
						</div>

						<!-- Jika Belum Login (Guest) -->
						<div v-else>
							<UButton
								size="sm"
								color="primary"
								icon="i-lucide-log-in"
								class="font-black text-xs cursor-pointer"
								@click="isAuthModalOpen = true"
							>
								Masuk / Daftar
							</UButton>
						</div>
					</div>
				</div>
			</header>

			<!-- Konten Utama -->
			<main class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8">
				<NuxtPage :current-tab="currentTab" @switch-tab="(tab) => currentTab = tab" />
			</main>

			<!-- Footer -->
			<footer class="border-t border-neutral-200/80 dark:border-neutral-800 py-6 text-center text-xs text-neutral-500 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm">
				<div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
					<div class="flex items-center gap-2">
						<span class="font-black text-neutral-800 dark:text-neutral-200">🧩 Petualangan Kata SD</span>
						<span>•</span>
						<p>Media Pembelajaran Teka-Teki Silang Interaktif Siswa Sekolah Dasar</p>
					</div>
					<p class="text-neutral-400 dark:text-neutral-500 text-[11px]">
						Mendukung Kurikulum Merdeka Fase A, B, dan C
					</p>
				</div>
			</footer>

			<!-- Auth Modal -->
			<AuthModal v-model:open="isAuthModalOpen" />

			<!-- Profile Modal (Edit Profil Siswa & Guru) -->
			<ProfileModal v-model:open="isProfileModalOpen" />
		</div>
	</UApp>
</template>
