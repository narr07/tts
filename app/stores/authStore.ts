import { defineStore } from 'pinia'
import { computed } from 'vue'

export interface AppUser {
	id: string
	name: string
	email: string
	role: 'student' | 'teacher' | 'admin'
	nisn?: string
	birthDate?: string
	grade?: number
	schoolName?: string
	totalXp?: number
	totalStars?: number
}

export const useAuthStore = defineStore('auth', () => {
	// Sesi dari cookie Better Auth yang dibuat server; peran tidak bisa diubah dari peramban
	const { user, loggedIn, signOut, fetchSession } = useUserSession()

	const currentUser = computed(() => (user.value as AppUser | null) ?? null)

	const isLoggedIn = computed(() => loggedIn.value)
	const role = computed(() => currentUser.value?.role || 'guest')
	const isAdmin = computed(() => currentUser.value?.role === 'admin')
	const isTeacher = computed(() => isAdmin.value || currentUser.value?.role === 'teacher')
	const isStudent = computed(() => currentUser.value?.role === 'student')

	function loginStudent(nisn: string, birthDate: string) {
		return runWithSessionRefresh(() =>
			$fetch<{ success: boolean; user: AppUser }>('/api/auth/student-login', {
				method: 'POST',
				body: { nisn, birthDate }
			})
		)
	}

	function registerStudent(payload: {
		nisn: string
		name: string
		birthDate: string
		grade: number
		schoolName: string
	}) {
		return runWithSessionRefresh(() =>
			$fetch<{ success: boolean; user: AppUser; message: string }>('/api/auth/student-register', {
				method: 'POST',
				body: payload
			})
		)
	}

	function loginTeacher(email: string, pin: string) {
		return runWithSessionRefresh(() =>
			$fetch<{ success: boolean; user: AppUser }>('/api/auth/teacher-login', {
				method: 'POST',
				body: { email, password: pin }
			})
		)
	}

	function logout() {
		return signOut()
	}

	// XP dan bintang sudah dihitung di server; cukup ambil ulang sesinya
	function refreshStats() {
		return fetchSession({ force: true })
	}

	function updateProfile(payload: {
		name?: string
		schoolName?: string
		grade?: number
		password?: string
	}) {
		return runWithSessionRefresh(() =>
			$fetch<{ success: boolean; user: AppUser }>('/api/user/profile', {
				method: 'PUT',
				body: payload
			})
		)
	}

	return {
		currentUser,
		isLoggedIn,
		role,
		isAdmin,
		isTeacher,
		isStudent,
		loginStudent,
		registerStudent,
		loginTeacher,
		logout,
		refreshStats,
		updateProfile
	}
})
