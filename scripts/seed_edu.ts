import { createClient } from '@libsql/client'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'

const dbPath = path.resolve('.data/db/sqlite.db')
const client = createClient({
	url: `file:${dbPath}`
})

async function run() {
	const now = Date.now()

	// 1. Seed Super Admin
	const adminId = 'usr_admin_dinar'
	const adminEmail = 'dinarpermadi07@gmail.com'
	const adminName = 'Dinar Permadi'
	// Sandi admin tidak ditulis di kode: ambil dari env, atau buat acak dan tampilkan sekali
	const adminPassword = process.env.SEED_ADMIN_PASSWORD || randomBytes(9).toString('base64url')
	if (!process.env.SEED_ADMIN_PASSWORD) {
		console.log(`🔑 Sandi admin (${adminEmail}): ${adminPassword}`)
	}
	const passwordHash = await hashPassword(adminPassword)
	const teacherHash = await hashPassword('guru123')

	await client.execute({
		sql: `INSERT OR REPLACE INTO "user" (id, name, email, role, createdAt, updatedAt, schoolName) 
		VALUES (?, ?, ?, 'admin', ?, ?, 'Pusat Admin TTS')`,
		args: [adminId, adminName, adminEmail, now, now]
	})

	await client.execute({
		sql: `INSERT OR REPLACE INTO "account" (id, accountId, providerId, userId, password, createdAt, updatedAt)
		VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
		args: ['acc_admin_dinar', adminEmail, adminId, passwordHash, now, now]
	})

	// 2. Seed Sample Teachers
	const teacher1Id = 'usr_teacher_budi'
	const teacher1Email = 'guru.budi@sdn01.sch.id'
	await client.execute({
		sql: `INSERT OR REPLACE INTO "user" (id, name, email, role, createdAt, updatedAt, schoolName) 
		VALUES (?, 'Pak Budi Santoso, S.Pd.', ?, 'teacher', ?, ?, 'SDN Nusantara 01')`,
		args: [teacher1Id, teacher1Email, now, now]
	})
	await client.execute({
		sql: `INSERT OR REPLACE INTO "account" (id, accountId, providerId, userId, password, createdAt, updatedAt)
		VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
		args: ['acc_teacher_budi', teacher1Email, teacher1Id, teacherHash, now, now]
	})

	const teacher2Id = 'usr_teacher_siti'
	const teacher2Email = 'bu.siti@sdpelita.sch.id'
	await client.execute({
		sql: `INSERT OR REPLACE INTO "user" (id, name, email, role, createdAt, updatedAt, schoolName) 
		VALUES (?, 'Ibu Siti Aminah, M.Pd.', ?, 'teacher', ?, ?, 'SD Pelita Harapan')`,
		args: [teacher2Id, teacher2Email, now, now]
	})
	await client.execute({
		sql: `INSERT OR REPLACE INTO "account" (id, accountId, providerId, userId, password, createdAt, updatedAt)
		VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
		args: ['acc_teacher_siti', teacher2Email, teacher2Id, teacherHash, now, now]
	})

	// 3. Seed Sample Students with Leaderboard stats
	const sampleStudents = [
		{
			id: 'std_1',
			name: 'Rian Pratama',
			nisn: '0012345671',
			birthDate: '2017-03-15',
			grade: 1,
			school: 'SDN Nusantara 01',
			xp: 350,
			stars: 9
		},
		{
			id: 'std_2',
			name: 'Aisyah Putri',
			nisn: '0012345672',
			birthDate: '2016-08-20',
			grade: 2,
			school: 'SD Pelita Harapan',
			xp: 520,
			stars: 14
		},
		{
			id: 'std_3',
			name: 'Bima Satria',
			nisn: '0012345673',
			birthDate: '2015-05-10',
			grade: 3,
			school: 'SD Bintang Kejora',
			xp: 410,
			stars: 11
		},
		{
			id: 'std_4',
			name: 'Dewi Lestari',
			nisn: '0012345674',
			birthDate: '2014-11-25',
			grade: 4,
			school: 'SDN Nusantara 01',
			xp: 780,
			stars: 20
		},
		{
			id: 'std_5',
			name: 'Farhan Maulana',
			nisn: '0012345675',
			birthDate: '2013-02-18',
			grade: 5,
			school: 'SD Merdeka Belajar',
			xp: 650,
			stars: 16
		},
		{
			id: 'std_6',
			name: 'Zahra Khairunnisa',
			nisn: '0012345676',
			birthDate: '2012-09-04',
			grade: 6,
			school: 'SD Unggulan Cendekia',
			xp: 920,
			stars: 24
		}
	]

	for (const s of sampleStudents) {
		const email = `${s.nisn}@siswa.tts.id`
		await client.execute({
			sql: `INSERT OR REPLACE INTO "user" (id, name, email, role, nisn, birthDate, grade, schoolName, totalXp, totalStars, createdAt, updatedAt)
			VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [s.id, s.name, email, s.nisn, s.birthDate, s.grade, s.school, s.xp, s.stars, now, now]
		})
		await client.execute({
			sql: `INSERT OR REPLACE INTO "account" (id, accountId, providerId, userId, password, createdAt, updatedAt)
			VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
			args: [`acc_${s.id}`, email, s.id, await hashPassword(s.birthDate), now, now]
		})
	}

	console.log('✅ Admin, Guru, dan Siswa berhasil di-seed!')
}

run()
