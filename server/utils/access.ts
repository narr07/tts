import type { H3Event } from 'h3'

export type AppRole = 'student' | 'teacher' | 'admin'

export const APP_ROLES: AppRole[] = ['student', 'teacher', 'admin']

// 401 kalau belum masuk, 403 kalau perannya tidak termasuk `roles`
export function requireRole(event: H3Event, roles: AppRole[]) {
	return requireUserSession(event, { user: { role: roles } })
}

// Login siswa (NISN + tanggal lahir) dan guru (email + sandi) memakai form sendiri,
// jadi sesi Better Auth dibuat manual setelah kredensial dicek.
// Web memakai cookie; aplikasi Flutter memakai token yang dikembalikan sebagai Bearer
export async function startSession(event: H3Event, userId: string) {
	const session = await createSession(event, userId)
	await setSessionCookie(event, session.token)
	return { token: session.token, expiresAt: session.expiresAt }
}
