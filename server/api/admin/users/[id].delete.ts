import { db } from 'hub:db'
import { sql } from 'drizzle-orm'

defineRouteMeta({
	openAPI: {
		tags: ['Admin'],
		operationId: 'deleteUser',
		summary: 'Hapus pengguna',
		security: [
			{
				bearerAuth: []
			},
			{
				cookieAuth: []
			}
		],
		description: 'Khusus admin. Ikut menghapus sesi dan progres pengguna itu. Akun admin tidak bisa dihapus.',
		responses: {
			200: {
				description: 'Terhapus',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/Success'
						}
					}
				}
			},
			401: {
				$ref: '#/components/responses/Unauthorized'
			},
			403: {
				$ref: '#/components/responses/Forbidden'
			},
			404: {
				$ref: '#/components/responses/NotFound'
			}
		}
	}
})

export default defineEventHandler(async (event) => {
	await requireRole(event, ['admin'])
	const id = getRouterParam(event, 'id')

	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID pengguna tidak valid.'
		})
	}

	const target = await db.all(sql`
		SELECT email, role FROM "user" WHERE id = ${id} LIMIT 1
	`)

	if (!target || target.length === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Pengguna tidak ditemukan.'
		})
	}

	const user = target[0] as any
	if (user.role === 'admin') {
		throw createError({
			statusCode: 403,
			statusMessage: 'Akun admin tidak dapat dihapus.'
		})
	}

	// Hapus accounts & sessions terkait
	await db.run(sql`DELETE FROM "account" WHERE "userId" = ${id}`)
	await db.run(sql`DELETE FROM "session" WHERE "userId" = ${id}`)
	await db.run(sql`DELETE FROM "student_progress" WHERE "student_id" = ${id}`)
	await db.run(sql`DELETE FROM "user" WHERE id = ${id}`)

	return {
		success: true,
		message: `Pengguna berhasil dihapus.`
	}
})
