// Menyalin data dari SQLite lokal (.data/db/sqlite.db) ke file SQL yang siap diimpor ke Cloudflare D1.
// Struktur tabel tidak ikut: di D1 tabel dibuat lewat migrasi (`wrangler d1 migrations apply`).
// Sesi login (session, verification) tidak ikut, jadi semua pengguna perlu masuk ulang di produksi.
//
// Pemakaian:
//   bun scripts/export_d1.ts                         -> menulis .data/d1-data.sql
//   SEED_ADMIN_PASSWORD=... bun scripts/export_d1.ts -> sekalian mengganti sandi admin di file SQL
//   bunx wrangler d1 execute petualangan-kata-sd --remote --file .data/d1-data.sql
import { createClient } from '@libsql/client'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { hashPassword } from 'better-auth/crypto'

const dbPath = path.resolve(process.argv[2] || '.data/db/sqlite.db')
const outPath = path.resolve(process.argv[3] || '.data/d1-data.sql')
const client = createClient({ url: `file:${dbPath}` })

// Urutan mengikuti foreign key: induk dulu, baru tabel yang merujuknya
const TABLES = ['user', 'account', 'puzzles', 'questions', 'student_progress']

function literal(value: unknown): string {
	if (value === null || value === undefined) return 'NULL'
	if (typeof value === 'number' || typeof value === 'bigint') return String(value)
	if (typeof value === 'boolean') return value ? '1' : '0'
	if (value instanceof ArrayBuffer) return `X'${Buffer.from(value).toString('hex')}'`
	return `'${String(value).replace(/'/g, '\'\'')}'`
}

async function run() {
	const newAdminPassword = process.env.SEED_ADMIN_PASSWORD
	const newAdminHash = newAdminPassword ? await hashPassword(newAdminPassword) : null
	const adminIds = new Set(
		(await client.execute(`SELECT id FROM "user" WHERE role = 'admin'`)).rows.map(r => String(r.id))
	)

	const lines: string[] = []
	for (const table of TABLES) {
		const { rows, columns } = await client.execute(`SELECT * FROM "${table}"`)
		lines.push(`-- ${table}: ${rows.length} baris`)
		for (const row of rows) {
			const values = columns.map((col) => {
				// Sandi admin diganti hanya kalau SEED_ADMIN_PASSWORD diisi
				if (newAdminHash && table === 'account' && col === 'password' && adminIds.has(String(row.userId))) {
					return literal(newAdminHash)
				}
				return literal(row[col])
			})
			// OR IGNORE: aman dijalankan ulang, baris yang sudah ada di D1 tidak ditimpa
			lines.push(`INSERT OR IGNORE INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});`)
		}
		console.log(`${table}: ${rows.length} baris`)
	}

	writeFileSync(outPath, lines.join('\n') + '\n')
	console.log(`\nFile SQL ditulis ke ${outPath}`)
	if (newAdminHash) {
		console.log('Sandi admin di file ini sudah diganti dengan SEED_ADMIN_PASSWORD.')
	} else if (adminIds.size > 0) {
		console.log('Peringatan: sandi admin ikut apa adanya. Isi SEED_ADMIN_PASSWORD untuk menggantinya, atau ganti lewat profil setelah masuk.')
	}
}

run().catch((err) => {
	console.error(err)
	process.exit(1)
})
