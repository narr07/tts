import { createClient } from '@libsql/client'
import path from 'node:path'

const dbPath = path.resolve('.data/db/sqlite.db')
const client = createClient({
	url: `file:${dbPath}`
})

async function run() {
	const statements = [
		`CREATE TABLE IF NOT EXISTS "user" (
			"id" text PRIMARY KEY NOT NULL,
			"name" text NOT NULL,
			"email" text NOT NULL UNIQUE,
			"emailVerified" integer DEFAULT 0 NOT NULL,
			"image" text,
			"createdAt" integer NOT NULL,
			"updatedAt" integer NOT NULL,
			"role" text DEFAULT 'student' NOT NULL,
			"banned" integer DEFAULT 0,
			"banReason" text,
			"banExpires" integer,
			"nisn" text,
			"birthDate" text,
			"grade" integer DEFAULT 1,
			"schoolName" text DEFAULT '',
			"totalXp" integer DEFAULT 0,
			"totalStars" integer DEFAULT 0
		);`,
		`CREATE TABLE IF NOT EXISTS "session" (
			"id" text PRIMARY KEY NOT NULL,
			"expiresAt" integer NOT NULL,
			"token" text NOT NULL UNIQUE,
			"createdAt" integer NOT NULL,
			"updatedAt" integer NOT NULL,
			"ipAddress" text,
			"userAgent" text,
			"userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
			"impersonatedBy" text
		);`,
		`CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");`,
		`CREATE TABLE IF NOT EXISTS "account" (
			"id" text PRIMARY KEY NOT NULL,
			"accountId" text NOT NULL,
			"providerId" text NOT NULL,
			"userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
			"accessToken" text,
			"refreshToken" text,
			"idToken" text,
			"accessTokenExpiresAt" integer,
			"refreshTokenExpiresAt" integer,
			"scope" text,
			"password" text,
			"createdAt" integer NOT NULL,
			"updatedAt" integer NOT NULL
		);`,
		`CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");`,
		`CREATE TABLE IF NOT EXISTS "verification" (
			"id" text PRIMARY KEY NOT NULL,
			"identifier" text NOT NULL,
			"value" text NOT NULL,
			"expiresAt" integer NOT NULL,
			"createdAt" integer NOT NULL,
			"updatedAt" integer NOT NULL
		);`,
		`CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");`
	]

	for (const stmt of statements) {
		try {
			await client.execute(stmt)
		} catch (e: any) {
			console.log('Notice:', e.message)
		}
	}
	console.log('Better Auth tables verified in SQLite DB!')
}

run()
