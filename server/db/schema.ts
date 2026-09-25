import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const students = sqliteTable('students', {
	id: text('id').primaryKey(),
	nisn: text('nisn').notNull().unique(),
	name: text('name').notNull(),
	birthDate: text('birth_date').notNull(), // format: YYYY-MM-DD
	grade: integer('grade').notNull(), // 1 sampai 6
	schoolName: text('school_name').notNull(),
	totalXp: integer('total_xp').notNull().default(0),
	totalStars: integer('total_stars').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const teachers = sqliteTable('teachers', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	pin: text('pin').notNull(),
	schoolName: text('school_name').notNull(),
	role: text('role').notNull().default('teacher'), // 'admin' | 'teacher'
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const puzzles = sqliteTable('puzzles', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	grade: integer('grade').notNull().default(1), // Kelas 1-6
	subject: text('subject').notNull().default('Bahasa Indonesia'), // IPAS, Matematika, PPKn, dll
	orderIndex: integer('order_index').notNull().default(1), // Posisi urutan level
	icon: text('icon').notNull().default('i-lucide-book-open'),
	teacherId: text('teacher_id').references(() => teachers.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const questions = sqliteTable('questions', {
	id: text('id').primaryKey(),
	puzzleId: text('puzzle_id')
		.notNull()
		.references(() => puzzles.id, { onDelete: 'cascade' }),
	clue: text('clue').notNull(),
	answer: text('answer').notNull(),
	direction: text('direction'), // 'across' | 'down'
	row: integer('row'),
	col: integer('col'),
	number: integer('number')
})

export const studentProgress = sqliteTable('student_progress', {
	id: text('id').primaryKey(),
	studentId: text('student_id')
		.notNull()
		.references(() => students.id, { onDelete: 'cascade' }),
	puzzleId: text('puzzle_id')
		.notNull()
		.references(() => puzzles.id, { onDelete: 'cascade' }),
	score: integer('score').notNull().default(0),
	stars: integer('stars').notNull().default(0), // 1-3 bintang
	timeSeconds: integer('time_seconds').notNull().default(0),
	isCompleted: integer('is_completed').notNull().default(0), // 1 jika selesai
	completedAt: integer('completed_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})
