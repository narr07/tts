// Sekali jalan: meng-hash kata sandi lama yang masih tersimpan sebagai teks biasa di tabel account.
// Aman dijalankan ulang, karena sandi yang sudah berbentuk hash Better Auth dilewati.
// Pemakaian: bun scripts/hash_passwords.ts [path ke sqlite.db]
import { createClient } from '@libsql/client'
import path from 'node:path'
import { hashPassword } from 'better-auth/crypto'

const dbPath = path.resolve(process.argv[2] || '.data/db/sqlite.db')
const client = createClient({ url: `file:${dbPath}` })

// Format hash Better Auth: salt hex 32 karakter + ':' + kunci scrypt hex 128 karakter
const HASHED = /^[0-9a-f]{32}:[0-9a-f]{128}$/

async function run() {
	const rows = await client.execute(`SELECT id, password FROM "account" WHERE "providerId" = 'credential' AND password IS NOT NULL`)
	let updated = 0

	for (const row of rows.rows) {
		const password = String(row.password)
		if (HASHED.test(password)) continue

		await client.execute({
			sql: `UPDATE "account" SET password = ?, "updatedAt" = ? WHERE id = ?`,
			args: [await hashPassword(password), Date.now(), row.id]
		})
		updated++
	}

	console.log(`✅ ${updated} dari ${rows.rows.length} sandi di-hash (${dbPath})`)
}

run()
