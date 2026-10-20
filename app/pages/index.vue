<script setup lang="ts">
import { ref } from 'vue'
import PlayView from '~/components/tts/PlayView.vue'
import AdminStudio from '~/components/tts/AdminStudio.vue'
import AdventurePath from '~/components/tts/AdventurePath.vue'
import LeaderboardView from '~/components/tts/LeaderboardView.vue'
import AdminUsers from '~/components/tts/AdminUsers.vue'

defineProps<{
	currentTab: 'path' | 'play' | 'leaderboard' | 'admin' | 'users'
}>()

const emit = defineEmits<{
	(e: 'switchTab', tab: 'path' | 'play' | 'leaderboard' | 'admin' | 'users'): void
}>()

const currentActivePuzzle = ref<any>(null)

// Tab berganti lewat query, bukan rute, jadi transisi antar "halaman" dipasang di template ini (kelas .tab-* di main.css)

function handlePlayPuzzle(puzzle: any) {
	currentActivePuzzle.value = puzzle
	emit('switchTab', 'play')
}

function handleSaved() {
	emit('switchTab', 'path')
}
</script>

<template>
	<Transition name="tab" mode="out-in">
		<div :key="currentTab">
			<!-- TAB 1: JALUR PETUALANGAN KATA -->
			<AdventurePath
				v-if="currentTab === 'path'"
				@play-puzzle="handlePlayPuzzle"
			/>

			<!-- TAB 2: CROSSWORD PLAY VIEW -->
			<PlayView
				v-else-if="currentTab === 'play'"
				:initial-puzzle="currentActivePuzzle"
				@back-to-path="emit('switchTab', 'path')"
			/>

			<!-- TAB 3: LEADERBOARD -->
			<LeaderboardView
				v-else-if="currentTab === 'leaderboard'"
			/>

			<!-- TAB 4: ADMIN STUDIO (PEMBUAT SOAL) -->
			<AdminStudio
				v-else-if="currentTab === 'admin'"
				@saved="handleSaved"
			/>

			<!-- TAB 5: SUPER ADMIN USERS MANAGEMENT -->
			<AdminUsers
				v-else-if="currentTab === 'users'"
			/>
		</div>
	</Transition>
</template>
