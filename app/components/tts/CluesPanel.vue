<script setup lang="ts">
import { computed } from 'vue'
import { useCrosswordStore } from '~/stores/crosswordStore'
import type { PlacedWord } from '~/utils/crossword'
import LetterTile from './LetterTile.vue'

const store = useCrosswordStore()

const acrossClues = computed(() =>
	store.layout.placed.filter((p) => p.direction === 'across')
)

const downClues = computed(() =>
	store.layout.placed.filter((p) => p.direction === 'down')
)

// Mendatar = secondary (amber), Menurun = primary (sky); warna yang sama dipakai di papan TTS
const groups = computed(() => [
	{ key: 'across' as const, title: 'Mendatar', icon: 'i-lucide-arrow-right', color: 'secondary' as const, items: acrossClues.value },
	{ key: 'down' as const, title: 'Menurun', icon: 'i-lucide-arrow-down', color: 'primary' as const, items: downClues.value }
])

const activeClasses = {
	// ring-inset: cincin digambar di dalam kotak, jadi tidak terpotong oleh wadah yang bisa di-scroll
	across: 'bg-secondary/10 ring-2 ring-inset ring-secondary',
	down: 'bg-primary/10 ring-2 ring-inset ring-primary'
}

const iconClasses = {
	across: 'text-secondary',
	down: 'text-primary'
}

function isClueActive(p: PlacedWord) {
	if (!store.selected) return false
	if (store.selected.direction !== p.direction) return false

	const len = p.answer.length
	const dr = p.direction === 'down' ? 1 : 0
	const dc = p.direction === 'across' ? 1 : 0

	for (let k = 0; k < len; k++) {
		if (
			store.selected.row === p.row + dr * k &&
			store.selected.col === p.col + dc * k
		) {
			return true
		}
	}
	return false
}

function isWordSolved(p: PlacedWord) {
	const len = p.answer.length
	const dr = p.direction === 'down' ? 1 : 0
	const dc = p.direction === 'across' ? 1 : 0

	for (let k = 0; k < len; k++) {
		const r = p.row + dr * k
		const c = p.col + dc * k
		const input = store.userInputs[r]?.[c] || ''
		if (input.toUpperCase() !== (p.answer[k] ?? '').toUpperCase()) {
			return false
		}
	}
	return true
}

function selectClue(p: PlacedWord) {
	store.selected = {
		row: p.row,
		col: p.col,
		direction: p.direction
	}
}
</script>

<template>
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
		<UCard
			v-for="group in groups"
			:key="group.key"
			:ui="{ header: 'px-4 py-3 sm:px-5', body: 'p-2 sm:p-3' }"
		>
			<template #header>
				<div class="flex items-center gap-2">
					<UIcon :name="group.icon" class="size-5" :class="iconClasses[group.key]" aria-hidden="true" />
					<h3 class="font-extrabold text-lg">{{ group.title }}</h3>
					<span class="ml-auto text-sm text-muted">{{ group.items.length }} soal</span>
				</div>
			</template>

			<ul class="space-y-1 lg:max-h-95 lg:overflow-y-auto lg:pr-1">
				<li v-for="p in group.items" :key="`${group.key}-${p.number}`">
					<button
						type="button"
						class="w-full flex items-start gap-3 p-2.5 rounded-md text-left transition duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
						:class="isClueActive(p) ? activeClasses[group.key] : 'hover:bg-elevated'"
						:aria-current="isClueActive(p) ? 'true' : undefined"
						@click="selectClue(p)"
					>
						<LetterTile :label="p.number" :color="group.color" size="sm" />
						<span
							class="flex-1 text-base leading-snug pt-1.5"
							:class="isWordSolved(p) ? 'line-through text-muted' : 'text-default'"
						>
							{{ p.clue }}
							<span class="text-sm text-muted whitespace-nowrap">({{ p.answer.length }} huruf)</span>
						</span>
						<UIcon
							v-if="isWordSolved(p)"
							name="i-lucide-circle-check"
							class="size-6 shrink-0 mt-1.5 text-success"
							aria-label="Terjawab"
						/>
					</button>
				</li>
			</ul>
		</UCard>
	</div>
</template>
