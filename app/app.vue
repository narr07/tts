<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/authStore'
import AuthModal from '~/components/tts/AuthModal.vue'
import ProfileModal from '~/components/tts/ProfileModal.vue'
import LetterTile from '~/components/tts/LetterTile.vue'

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
	set: val => router.push({ query: { ...route.query, tab: val === 'path' ? undefined : val } })
})

// short dipakai di navigasi bawah (ponsel/tablet) yang lebarnya terbatas
const navItems = computed(() => [
	{ tab: 'path' as const, label: 'Peta Belajar', short: 'Peta', icon: 'i-lucide-map' },
	{ tab: 'play' as const, label: 'Bermain', short: 'Main', icon: 'i-lucide-gamepad-2' },
	{ tab: 'leaderboard' as const, label: 'Peringkat', short: 'Peringkat', icon: 'i-lucide-trophy' },
	...(auth.isTeacher ? [{ tab: 'admin' as const, label: 'Studio Guru', short: 'Studio', icon: 'i-lucide-pencil-ruler' }] : []),
	...(auth.isAdmin ? [{ tab: 'users' as const, label: 'Kelola Pengguna', short: 'Pengguna', icon: 'i-lucide-shield-check' }] : [])
])

const roleText = computed(() => {
	const u = auth.currentUser
	if (!u) return ''
	if (auth.isAdmin) return 'Super Admin'
	if (auth.isTeacher) return 'Guru Pembimbing'
	return `Kelas ${u.grade} SD`
})
</script>

<template>
	<UApp :tooltip="{ delayDuration: 200 }">
		<div class="min-h-dvh flex flex-col bg-muted text-default font-sans">
			<header class="sticky top-0 z-40 border-b border-default bg-default">
				<div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
					<!-- Logo -->
					<NuxtLink
						to="/"
						class="flex items-center gap-2.5 shrink-0 min-w-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						aria-label="Petualangan Kata SD, kembali ke Peta Belajar"
					>
						<LetterTile icon="i-lucide-puzzle" color="primary" size="sm" />
						<!-- Saat masuk, layar sempit butuh tempat untuk XP, avatar, dan tombol keluar; nama aplikasi disembunyikan dulu -->
						<span class="min-w-0" :class="auth.isLoggedIn ? 'hidden sm:block' : 'block'">
							<span class="block font-extrabold text-base sm:text-lg leading-tight truncate">Petualangan Kata</span>
							<span class="hidden sm:block text-xs text-muted leading-tight">TTS untuk Kelas 1 sampai 6 SD</span>
						</span>
					</NuxtLink>

					<!-- Navigasi atas, hanya di layar lebar -->
					<nav aria-label="Navigasi utama" class="hidden lg:flex items-center gap-1">
						<UButton
							v-for="item in navItems"
							:key="item.tab"
							:icon="item.icon"
							:color="currentTab === item.tab ? 'primary' : 'neutral'"
							:variant="currentTab === item.tab ? 'soft' : 'ghost'"
							:aria-current="currentTab === item.tab ? 'page' : undefined"
							class="font-bold"
							@click="currentTab = item.tab"
						>
							{{ item.label }}
						</UButton>
					</nav>

					<!-- Akun -->
					<div class="flex items-center gap-2 shrink-0">
						<template v-if="auth.isLoggedIn && auth.currentUser">
							<div
								v-if="auth.isStudent"
								class="flex items-center gap-2.5 px-3 h-10 rounded-md bg-secondary/10 text-secondary font-extrabold text-sm"
							>
								<span class="flex items-center gap-1" :aria-label="`${auth.currentUser.totalXp || 0} XP`">
									<UIcon name="i-lucide-zap" class="size-4" aria-hidden="true" />
									<span aria-hidden="true">{{ auth.currentUser.totalXp || 0 }}</span>
								</span>
								<span class="flex items-center gap-1" :aria-label="`${auth.currentUser.totalStars || 0} bintang`">
									<span aria-hidden="true" class="text-base leading-none">★</span>
									<span aria-hidden="true">{{ auth.currentUser.totalStars || 0 }}</span>
								</span>
							</div>

							<UTooltip text="Ubah profil">
								<UButton
									color="neutral"
									variant="ghost"
									class="hidden sm:flex text-left"
									@click="isProfileModalOpen = true"
								>
									<UAvatar :alt="auth.currentUser.name" size="sm" />
									<span class="min-w-0 max-w-36">
										<span class="block font-bold text-sm leading-tight truncate">{{ auth.currentUser.name }}</span>
										<span class="block text-xs text-muted leading-tight truncate">{{ roleText }}</span>
									</span>
								</UButton>
							</UTooltip>

							<UTooltip text="Ubah profil">
								<UButton
									color="neutral"
									variant="ghost"
									class="sm:hidden"
									aria-label="Ubah profil"
									@click="isProfileModalOpen = true"
								>
									<UAvatar :alt="auth.currentUser.name" size="sm" />
								</UButton>
							</UTooltip>

							<UTooltip text="Keluar dari akun">
								<UButton
									color="neutral"
									variant="outline"
									icon="i-lucide-log-out"
									aria-label="Keluar dari akun"
									@click="auth.logout"
								/>
							</UTooltip>
						</template>

						<UButton
							v-else
							color="primary"
							icon="i-lucide-log-in"
							class="font-bold"
							@click="isAuthModalOpen = true"
						>
							Masuk / Daftar
						</UButton>
					</div>
				</div>
			</header>

			<!-- pb bawah memberi ruang untuk navigasi bawah supaya isi terakhir tidak tertutup -->
			<main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12">
				<NuxtPage :current-tab="currentTab" @switch-tab="(tab: TabType) => currentTab = tab" />
			</main>

			<footer class="hidden lg:block border-t border-default bg-default">
				<p class="max-w-6xl mx-auto px-6 py-5 text-sm text-muted">
					Petualangan Kata SD: teka-teki silang untuk siswa kelas 1 sampai 6, mengikuti Kurikulum Merdeka Fase A, B, dan C.
				</p>
			</footer>

			<!-- Navigasi bawah untuk ponsel dan tablet, tetap dalam jangkauan jempol -->
			<nav
				aria-label="Navigasi utama"
				class="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default pb-[env(safe-area-inset-bottom)]"
			>
				<div class="max-w-xl mx-auto flex items-stretch gap-1 px-2 py-1.5">
					<UButton
						v-for="item in navItems"
						:key="item.tab"
						:icon="item.icon"
						:color="currentTab === item.tab ? 'primary' : 'neutral'"
						:variant="currentTab === item.tab ? 'soft' : 'ghost'"
						:aria-current="currentTab === item.tab ? 'page' : undefined"
						class="flex-1 min-w-0 flex-col gap-0.5 h-14 px-1 text-xs font-bold"
						:ui="{ leadingIcon: 'size-6' }"
						@click="currentTab = item.tab"
					>
						<span class="truncate max-w-full">{{ item.short }}</span>
					</UButton>
				</div>
			</nav>

			<AuthModal v-model:open="isAuthModalOpen" />
			<ProfileModal v-model:open="isProfileModalOpen" />
		</div>
	</UApp>
</template>
