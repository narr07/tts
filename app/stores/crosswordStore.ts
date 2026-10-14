import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
	buildLayoutFromPlaced,
	type PlacedWord,
	type BuiltLayout,
	type SavedQuestion,
	cellKey
} from '~/utils/crossword'
import { computeGridMeta, type GridMeta } from '~/utils/gridMeta'

export interface Selection {
	row: number
	col: number
	direction: 'across' | 'down'
}

export const useCrosswordStore = defineStore('crossword', () => {
	const activePuzzle = ref<any>(null)
	const selected = ref<Selection | null>(null)
	const userInputs = ref<string[][]>([])
	const isChecked = ref(false)
	const isSolved = ref(false)
	const isRevealed = ref(false)
	const secondsElapsed = ref(0)
	const isTimerRunning = ref(false)

	const layout = computed<BuiltLayout>(() => {
		if (!activePuzzle.value || !activePuzzle.value.questions) {
			return { grid: [], placed: [], width: 0, height: 0 }
		}

		const placed: PlacedWord[] = activePuzzle.value.questions
			.filter((q: SavedQuestion) => q.direction && q.row !== null && q.col !== null)
			.map((q: SavedQuestion) => ({
				id: q.id,
				clue: q.clue,
				answer: q.answer,
				direction: q.direction as 'across' | 'down',
				row: q.row as number,
				col: q.col as number,
				number: q.number as number
			}))

		return buildLayoutFromPlaced(placed)
	})

	const meta = computed<GridMeta>(() => computeGridMeta(layout.value))

	function initPuzzle(puzzle: any) {
		activePuzzle.value = puzzle
		isChecked.value = false
		isSolved.value = false
		isRevealed.value = false
		secondsElapsed.value = 0
		isTimerRunning.value = true

		const { width, height, grid } = layout.value
		userInputs.value = Array.from({ length: height }, () => Array(width).fill(''))

		// Auto select first cell
		for (let r = 0; r < height; r++) {
			for (let c = 0; c < width; c++) {
				if (grid[r]?.[c]) {
					const wi = meta.value.wordIndex.get(cellKey(r, c))
					const direction = wi?.across !== undefined ? 'across' : 'down'
					selected.value = { row: r, col: c, direction }
					return
				}
			}
		}
	}

	function resetInputs() {
		const { width, height } = layout.value
		userInputs.value = Array.from({ length: height }, () => Array(width).fill(''))
		isChecked.value = false
		isSolved.value = false
		isRevealed.value = false
	}

	function revealAll() {
		const { width, height, grid } = layout.value
		userInputs.value = Array.from({ length: height }, (_, r) =>
			Array.from({ length: width }, (_, c) => grid[r]?.[c] || '')
		)
		isRevealed.value = true
		isChecked.value = true
		isSolved.value = true
		isTimerRunning.value = false
	}

	// Dipakai diam-diam setiap kali huruf diketik: tidak menandai merah/hijau
	const isComplete = computed(() => {
		const { width, height, grid } = layout.value
		let total = 0
		for (let r = 0; r < height; r++) {
			for (let c = 0; c < width; c++) {
				const answer = grid[r]?.[c]
				if (!answer) continue
				total++
				if (userInputs.value[r]?.[c]?.toUpperCase() !== answer.toUpperCase()) return false
			}
		}
		return total > 0
	})

	// Tombol "Cek": menampilkan tanda benar/salah di setiap kotak
	function checkAnswers() {
		isChecked.value = true
		return isComplete.value
	}

	function markSolved() {
		isSolved.value = true
		isTimerRunning.value = false
	}

	return {
		activePuzzle,
		selected,
		userInputs,
		isChecked,
		isSolved,
		isRevealed,
		secondsElapsed,
		isTimerRunning,
		layout,
		meta,
		isComplete,
		initPuzzle,
		resetInputs,
		revealAll,
		checkAnswers,
		markSolved
	}
})
