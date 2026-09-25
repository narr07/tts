import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'

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
	const currentUser = useLocalStorage<AppUser | null>('tts_auth_user', null)

	const isLoggedIn = computed(() => Boolean(currentUser.value))
	const role = computed(() => currentUser.value?.role || 'guest')
	const isAdmin = computed(() => {
		return (
			currentUser.value?.role === 'admin' ||
			currentUser.value?.email === 'dinarpermadi07@gmail.com'
		)
	})
	const isTeacher = computed(() => {
		return isAdmin.value || currentUser.value?.role === 'teacher'
	})
	const isStudent = computed(() => currentUser.value?.role === 'student')

	async function loginStudent(nisn: string, birthDate: string) {
		const res = await $fetch<{ success: boolean; user: AppUser }>('/api/auth/student-login', {
			method: 'POST',
			body: { nisn, birthDate }
		})

		if (res.success && res.user) {
			currentUser.value = res.user
		}
		return res
	}

	async function registerStudent(payload: {
		nisn: string
		name: string
		birthDate: string
		grade: number
		schoolName: string
	}) {
		const res = await $fetch<{ success: boolean; user: AppUser; message: string }>('/api/auth/student-register', {
			method: 'POST',
			body: payload
		})

		if (res.success && res.user) {
			currentUser.value = res.user
		}
		return res
	}

	async function loginTeacher(email: string, pin: string) {
		const res = await $fetch<{ success: boolean; user: AppUser }>('/api/auth/teacher-login', {
			method: 'POST',
			body: { email, password: pin }
		})

		if (res.success && res.user) {
			currentUser.value = res.user
		}
		return res
	}

	function logout() {
		currentUser.value = null
	}

	function updateStudentStats(xpEarned: number, starsEarned: number) {
		if (currentUser.value && currentUser.value.role === 'student') {
			currentUser.value.totalXp = (currentUser.value.totalXp || 0) + xpEarned
			currentUser.value.totalStars = (currentUser.value.totalStars || 0) + starsEarned
		}
	}

	async function updateProfile(payload: {
		name?: string
		schoolName?: string
		grade?: number
		password?: string
	}) {
		if (!currentUser.value?.id) return
		const res = await $fetch<{ success: boolean; user: AppUser }>('/api/user/profile', {
			method: 'PUT',
			body: {
				userId: currentUser.value.id,
				...payload
			}
		})
		if (res.success && res.user) {
			currentUser.value = {
				...currentUser.value,
				...res.user
			}
		}
		return res
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
		updateStudentStats,
		updateProfile
	}
})
