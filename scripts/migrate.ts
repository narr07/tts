import { createClient } from '@libsql/client'
import path from 'node:path'

const dbPath = path.resolve('.data/db/sqlite.db')
const client = createClient({
	url: `file:${dbPath}`
})

async function run() {
	try {
		await client.execute("ALTER TABLE teachers ADD role text DEFAULT 'teacher' NOT NULL;")
		console.log('Column role added successfully to teachers table!')
	} catch (err: any) {
		console.log('Notice:', err.message)
	}
}

run()
