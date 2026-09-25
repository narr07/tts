<script setup lang="ts">
import { computed } from 'vue'
import { useCrosswordStore } from '~/stores/crosswordStore'
import { cellKey, type PlacedWord } from '~/utils/crossword'

const store = useCrosswordStore()

const acrossClues = computed(() =>
	store.layout.placed.filter((p) => p.direction === 'across')
)

const downClues = computed(() =>
	store.layout.placed.filter((p) => p.direction === 'down')
)

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
		if (input.toUpperCase() !== p.answer[k].toUpperCase()) {
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
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Kolom Mendatar -->
		<UCard :ui="{ body: 'p-3 sm:p-4' }">
			<template #header>
				<div class="flex items-center gap-2">
					<UIcon name="i-lucide-arrow-right" class="text-amber-500 w-4 h-4" />
					<h3 class="font-bold text-sm sm:text-base">Mendatar</h3>
					<UBadge color="neutral" variant="subtle" size="xs" class="ml-auto">
						{{ acrossClues.length }} Soal
					</UBadge>
				</div>
			</template>

			<div class="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
				<div
					v-for="p in acrossClues"
					:key="`across-${p.number}`"
					class="p-2.5 rounded-lg cursor-pointer transition-all duration-150 flex items-start gap-2.5 text-xs sm:text-sm"
					:class="[
						isClueActive(p)
							? 'bg-amber-100 dark:bg-amber-950/70 border-l-4 border-amber-500 shadow-sm'
							: 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
					]"
					@click="selectClue(p)"
				>
					<span class="font-extrabold text-amber-600 dark:text-amber-400 min-w-[20px]">
						{{ p.number }}.
					</span>
					<span
						class="flex-1 leading-snug"
						:class="{
							'line-through text-neutral-400 dark:text-neutral-500': isWordSolved(p)
						}"
					>
						{{ p.clue }}
					</span>
					<UIcon
						v-if="isWordSolved(p)"
						name="i-lucide-check-circle"
						class="text-emerald-500 w-4 h-4 shrink-0"
					/>
				</div>
			</div>
		</UCard>

		<!-- Kolom Menurun -->
		<UCard :ui="{ body: 'p-3 sm:p-4' }">
			<template #header>
				<div class="flex items-center gap-2">
					<UIcon name="i-lucide-arrow-down" class="text-sky-500 w-4 h-4" />
					<h3 class="font-bold text-sm sm:text-base">Menurun</h3>
					<UBadge color="neutral" variant="subtle" size="xs" class="ml-auto">
						{{ downClues.length }} Soal
					</UBadge>
				</div>
			</template>

			<div class="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
				<div
					v-for="p in downClues"
					:key="`down-${p.number}`"
					class="p-2.5 rounded-lg cursor-pointer transition-all duration-150 flex items-start gap-2.5 text-xs sm:text-sm"
					:class="[
						isClueActive(p)
							? 'bg-sky-100 dark:bg-sky-950/70 border-l-4 border-sky-500 shadow-sm'
							: 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
					]"
					@click="selectClue(p)"
				>
					<span class="font-extrabold text-sky-600 dark:text-sky-400 min-w-[20px]">
						{{ p.number }}.
					</span>
					<span
						class="flex-1 leading-snug"
						:class="{
							'line-through text-neutral-400 dark:text-neutral-500': isWordSolved(p)
						}"
					>
						{{ p.clue }}
					</span>
					<UIcon
						v-if="isWordSolved(p)"
						name="i-lucide-check-circle"
						class="text-emerald-500 w-4 h-4 shrink-0"
					/>
				</div>
			</div>
		</UCard>
	</div>
</template>
