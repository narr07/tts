import { defineServerAuth } from '@nuxtjs/better-auth/config'
import { admin } from 'better-auth/plugins'

export default defineServerAuth({
	emailAndPassword: {
		enabled: true
	},
	user: {
		additionalFields: {
			role: {
				type: 'string',
				defaultValue: 'student'
			},
			nisn: {
				type: 'string',
				required: false
			},
			birthDate: {
				type: 'string',
				required: false
			},
			grade: {
				type: 'number',
				required: false,
				defaultValue: 1
			},
			schoolName: {
				type: 'string',
				required: false,
				defaultValue: ''
			},
			totalXp: {
				type: 'number',
				required: false,
				defaultValue: 0
			},
			totalStars: {
				type: 'number',
				required: false,
				defaultValue: 0
			}
		}
	},
	plugins: [
		admin()
	]
})
