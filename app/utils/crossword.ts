export type Direction = 'across' | 'down'

export interface WordEntry {
	clue: string
	answer: string
}

export interface PlacedWord {
	id?: string
	clue: string
	answer: string
	direction: Direction
	row: number
	col: number
	number: number
}

export interface CrosswordResult {
	grid: (string | null)[][]
	placed: PlacedWord[]
	unplaced: WordEntry[]
	width: number
	height: number
}

export interface SavedQuestion {
	id: string
	clue: string
	answer: string
	direction: string | null
	row: number | null
	col: number | null
	number: number | null
}

export interface BuiltLayout {
	grid: (string | null)[][]
	placed: PlacedWord[]
	width: number
	height: number
}

export const cellKey = (r: number, c: number) => `${r},${c}`

export function placeLetter(
	grid: Map<string, string>,
	letter: string,
	r: number,
	c: number
) {
	grid.set(cellKey(r, c), letter)
}

export interface PlacementCheck {
	ok: boolean
	intersections: number
	reason?: string
}

export function canPlace(
	grid: Map<string, string>,
	word: string,
	row: number,
	col: number,
	direction: Direction
): PlacementCheck {
	const dr = direction === 'down' ? 1 : 0
	const dc = direction === 'across' ? 1 : 0
	let intersections = 0

	for (let k = 0; k < word.length; k++) {
		const r = row + dr * k
		const c = col + dc * k
		const existing = grid.get(cellKey(r, c))

		if (existing) {
			if (existing !== word[k]) {
				return {
					ok: false,
					intersections: 0,
					reason: `Tabrakan huruf di (${r}, ${c}): ada '${existing}' tapi butuh '${word[k]}'`
				}
			}
			intersections++
		} else {
			// Periksa tetangga tegak lurus agar kata tidak berdampingan tanpa pemisah
			if (direction === 'across') {
				if (grid.has(cellKey(r - 1, c)) || grid.has(cellKey(r + 1, c))) {
					return {
						ok: false,
						intersections: 0,
						reason: `Kotak di (${r}, ${c}) menyentuh huruf lain secara paralel`
					}
				}
			} else {
				if (grid.has(cellKey(r, c - 1)) || grid.has(cellKey(r, c + 1))) {
					return {
						ok: false,
						intersections: 0,
						reason: `Kotak di (${r}, ${c}) menyentuh huruf lain secara paralel`
					}
				}
			}
		}
	}

	// Sel tepat sebelum kata harus kosong
	if (grid.has(cellKey(row - dr, col - dc))) {
		return { ok: false, intersections: 0, reason: 'Menempel langsung di awal kata lain' }
	}
	// Sel tepat sesudah kata harus kosong
	if (grid.has(cellKey(row + dr * word.length, col + dc * word.length))) {
		return { ok: false, intersections: 0, reason: 'Menempel langsung di akhir kata lain' }
	}

	return { ok: true, intersections }
}

export function assignNumbers(
	grid: (string | null)[][],
	placed: PlacedWord[]
) {
	const height = grid.length
	const width = height > 0 ? grid[0].length : 0
	const numberMap = new Map<string, number>()
	let num = 0

	for (let r = 0; r < height; r++) {
		for (let c = 0; c < width; c++) {
			if (!grid[r][c]) continue
			const startsAcross =
				(c === 0 || !grid[r][c - 1]) && c + 1 < width && !!grid[r][c + 1]
			const startsDown =
				(r === 0 || !grid[r - 1][c]) && r + 1 < height && !!grid[r + 1][c]
			if (startsAcross || startsDown) {
				num++
				numberMap.set(cellKey(r, c), num)
			}
		}
	}

	for (const p of placed) {
		p.number = numberMap.get(cellKey(p.row, p.col)) ?? 0
	}
}

export function buildLayoutFromPlaced(placed: PlacedWord[]): BuiltLayout {
	const validPlaced = placed.filter(
		p => p.direction && p.row !== null && p.col !== null && p.answer
	)

	if (validPlaced.length === 0) {
		return { grid: [], placed: [], width: 0, height: 0 }
	}

	let maxR = 0
	let maxC = 0
	for (const p of validPlaced) {
		const len = p.answer.length
		if (p.direction === 'across') {
			maxR = Math.max(maxR, p.row)
			maxC = Math.max(maxC, p.col + len - 1)
		} else {
			maxR = Math.max(maxR, p.row + len - 1)
			maxC = Math.max(maxC, p.col)
		}
	}

	const height = maxR + 1
	const width = maxC + 1
	const grid: (string | null)[][] = Array.from({ length: height }, () =>
		Array(width).fill(null)
	)

	for (const p of validPlaced) {
		for (let k = 0; k < p.answer.length; k++) {
			const r = p.direction === 'down' ? p.row + k : p.row
			const c = p.direction === 'across' ? p.col + k : p.col
			if (r >= 0 && r < height && c >= 0 && c < width) {
				grid[r][c] = p.answer[k]
			}
		}
	}

	assignNumbers(grid, validPlaced)

	return {
		grid,
		placed: validPlaced.sort((a, b) => (a.number || 0) - (b.number || 0)),
		width,
		height
	}
}

export function generateCrossword(entries: WordEntry[]): CrosswordResult {
	const words = entries
		.map(e => ({
			clue: e.clue.trim(),
			answer: e.answer.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
		}))
		.filter(e => e.answer.length >= 2 && e.clue.length > 0)

	if (words.length === 0) {
		return { grid: [], placed: [], unplaced: [], width: 0, height: 0 }
	}

	const sorted = [...words].sort((a, b) => b.answer.length - a.answer.length)
	const grid = new Map<string, string>()
	const placed: PlacedWord[] = []

	// Tempatkan kata pertama secara mendatar di (0, 0)
	const first = sorted[0]
	for (let k = 0; k < first.answer.length; k++) {
		placeLetter(grid, first.answer[k], 0, k)
	}
	placed.push({
		clue: first.clue,
		answer: first.answer,
		direction: 'across',
		row: 0,
		col: 0,
		number: 0
	})

	const queue = sorted.slice(1)
	const unplaced: WordEntry[] = []

	while (queue.length > 0) {
		let progress = false
		const nextQueue: WordEntry[] = []

		for (const w of queue) {
			let best: { row: number; col: number; direction: Direction } | null = null
			let bestScore = -1

			for (let i = 0; i < w.answer.length; i++) {
				const letter = w.answer[i]
				for (const p of placed) {
					for (let j = 0; j < p.answer.length; j++) {
						if (p.answer[j] !== letter) continue

						let row: number
						let col: number
						let direction: Direction

						if (p.direction === 'across') {
							direction = 'down'
							row = p.row - i
							col = p.col + j
						} else {
							direction = 'across'
							row = p.row + j
							col = p.col - i
						}

						const check = canPlace(grid, w.answer, row, col, direction)
						if (check.ok && check.intersections >= 1 && check.intersections > bestScore) {
							bestScore = check.intersections
							best = { row, col, direction }
						}
					}
				}
			}

			if (best) {
				const dr = best.direction === 'down' ? 1 : 0
				const dc = best.direction === 'across' ? 1 : 0
				for (let k = 0; k < w.answer.length; k++) {
					placeLetter(grid, w.answer[k], best.row + dr * k, best.col + dc * k)
				}
				placed.push({
					clue: w.clue,
					answer: w.answer,
					direction: best.direction,
					row: best.row,
					col: best.col,
					number: 0
				})
				progress = true
			} else {
				nextQueue.push(w)
			}
		}

		if (!progress) {
			unplaced.push(...nextQueue)
			break
		}
		if (nextQueue.length === 0) break
		queue.length = 0
		queue.push(...nextQueue)
	}

	// Normalisasi koordinat agar mulai dari (0, 0)
	let minR = Infinity
	let minC = Infinity
	let maxR = -Infinity
	let maxC = -Infinity

	for (const k of grid.keys()) {
		const [r, c] = k.split(',').map(Number)
		if (r < minR) minR = r
		if (c < minC) minC = c
		if (r > maxR) maxR = r
		if (c > maxC) maxC = c
	}

	for (const p of placed) {
		p.row -= minR
		p.col -= minC
	}

	const height = maxR - minR + 1
	const width = maxC - minC + 1
	const grid2d: (string | null)[][] = Array.from({ length: height }, () =>
		Array(width).fill(null)
	)

	for (const [k, letter] of grid.entries()) {
		const [r, c] = k.split(',').map(Number)
		grid2d[r - minR][c - minC] = letter
	}

	assignNumbers(grid2d, placed)

	return {
		grid: grid2d,
		placed,
		unplaced,
		width,
		height
	}
}
