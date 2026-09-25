<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/authStore'

const props = defineProps<{
	open: boolean
}>()

const emit = defineEmits<{
	(e: 'update:open', val: boolean): void
}>()

const auth = useAuthStore()

const activeTab = ref<'student_login' | 'student_register' | 'teacher_login'>('student_login')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// Student Login Form
const studentNisn = ref('')
const studentBirthDate = ref('')

// Student Register Form
const regNisn = ref('')
const regName = ref('')
const regBirthDate = ref('')
const regGrade = ref(1)
const regSchool = ref('')

// Teacher Login Form
const teacherEmail = ref('')
const teacherPin = ref('')

async function handleStudentLogin() {
	errorMessage.value = ''
	if (!studentNisn.value || !studentBirthDate.value) {
		errorMessage.value = 'Silakan masukkan NISN dan Tanggal Lahir!'
		return
	}
	isLoading.value = true
	try {
		await auth.loginStudent(studentNisn.value, studentBirthDate.value)
		emit('update:open', false)
	} catch (err: any) {
		errorMessage.value = err.data?.statusMessage || 'NISN atau Tanggal Lahir tidak cocok.'
	} finally {
		isLoading.value = false
	}
}

async function handleStudentRegister() {
	errorMessage.value = ''
	if (!regNisn.value || !regName.value || !regBirthDate.value || !regSchool.value) {
		errorMessage.value = 'Semua kolom wajib diisi!'
		return
	}
	isLoading.value = true
	try {
		await auth.registerStudent({
			nisn: regNisn.value,
			name: regName.value,
			birthDate: regBirthDate.value,
			grade: Number(regGrade.value),
			schoolName: regSchool.value
		})
		emit('update:open', false)
	} catch (err: any) {
		errorMessage.value = err.data?.statusMessage || 'Gagal mendaftar. Silakan coba lagi.'
	} finally {
		isLoading.value = false
	}
}

async function handleTeacherLogin() {
	errorMessage.value = ''
	if (!teacherEmail.value || !teacherPin.value) {
		errorMessage.value = 'Email dan kata sandi wajib diisi!'
		return
	}
	isLoading.value = true
	try {
		await auth.loginTeacher(teacherEmail.value, teacherPin.value)
		emit('update:open', false)
	} catch (err: any) {
		errorMessage.value = err.data?.statusMessage || 'Email atau kata sandi tidak valid.'
	} finally {
		isLoading.value = false
	}
}

function fillAdminSample() {
	teacherEmail.value = 'dinarpermadi07@gmail.com'
	teacherPin.value = 'admin123'
}

function fillStudentSample() {
	studentNisn.value = '0012345674'
	studentBirthDate.value = '2014-11-25'
}
</script>

<template>
	<UModal
		:open="open"
		@update:open="(val) => emit('update:open', val)"
	>
		<template #body>
			<div class="p-4 sm:p-6 space-y-5 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl">
				<!-- Header -->
				<div class="text-center space-y-1">
					<div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
						<UIcon name="i-lucide-user" class="w-6 h-6" />
					</div>
					<h3 class="text-xl font-black text-neutral-900 dark:text-neutral-100">
						{{
							activeTab === 'student_login'
								? 'Masuk Siswa SD'
								: activeTab === 'student_register'
									? 'Pendaftaran Siswa Baru'
									: 'Masuk Guru & Admin'
						}}
					</h3>
					<p class="text-xs text-neutral-500">
						{{
							activeTab === 'student_login'
								? 'Cukup gunakan NISN dan Tanggal Lahir untuk mulai mengumpulkan XP!'
								: activeTab === 'student_register'
									? 'Daftarkan diri dari sekolah manapun untuk ikut bermain!'
									: 'Akses khusus guru pembuat soal dan super admin pengelola.'
						}}
					</p>
				</div>

				<!-- Tab Switches -->
				<div class="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
					<button
						type="button"
						class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
						:class="activeTab === 'student_login' ? 'bg-white dark:bg-neutral-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-neutral-500 hover:text-neutral-900'"
						@click="activeTab = 'student_login'; errorMessage = ''"
					>
						Masuk Siswa
					</button>
					<button
						type="button"
						class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
						:class="activeTab === 'student_register' ? 'bg-white dark:bg-neutral-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-neutral-500 hover:text-neutral-900'"
						@click="activeTab = 'student_register'; errorMessage = ''"
					>
						Daftar Siswa
					</button>
					<button
						type="button"
						class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
						:class="activeTab === 'teacher_login' ? 'bg-white dark:bg-neutral-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-neutral-500 hover:text-neutral-900'"
						@click="activeTab = 'teacher_login'; errorMessage = ''"
					>
						Guru / Admin
					</button>
				</div>

				<!-- Alert Error -->
				<div
					v-if="errorMessage"
					class="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-2"
				>
					<UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
					<span>{{ errorMessage }}</span>
				</div>

				<!-- FORM 1: MASUK SISWA -->
				<form
					v-if="activeTab === 'student_login'"
					class="space-y-4"
					@submit.prevent="handleStudentLogin"
				>
					<div class="space-y-1.5">
						<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
							Nomor Induk Siswa Nasional (NISN)
						</label>
						<UInput
							v-model="studentNisn"
							placeholder="Contoh: 0012345674"
							icon="i-lucide-id-card"
							class="w-full"
						/>
					</div>

					<div class="space-y-1.5">
						<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
							Tanggal Lahir (Format: YYYY-MM-DD)
						</label>
						<UInput
							v-model="studentBirthDate"
							type="date"
							icon="i-lucide-calendar"
							class="w-full"
						/>
					</div>

					<div class="flex items-center justify-between text-xs pt-1">
						<button
							type="button"
							class="text-amber-600 dark:text-amber-400 underline font-medium hover:opacity-80"
							@click="fillStudentSample"
						>
							Coba Akun Contoh (Dewi - Kelas 4)
						</button>
					</div>

					<UButton
						type="submit"
						color="primary"
						class="w-full font-bold justify-center"
						:loading="isLoading"
					>
						Mulai Petualangan Belajar
					</UButton>
				</form>

				<!-- FORM 2: DAFTAR SISWA BARU -->
				<form
					v-else-if="activeTab === 'student_register'"
					class="space-y-3.5"
					@submit.prevent="handleStudentRegister"
				>
					<div class="space-y-1">
						<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">NISN Siswa</label>
						<UInput
							v-model="regNisn"
							placeholder="10 digit nomor NISN"
							icon="i-lucide-id-card"
							class="w-full"
						/>
					</div>

					<div class="space-y-1">
						<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Nama Lengkap</label>
						<UInput
							v-model="regName"
							placeholder="Nama lengkap siswa"
							icon="i-lucide-user"
							class="w-full"
						/>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-1">
							<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Tanggal Lahir</label>
							<UInput
								v-model="regBirthDate"
								type="date"
								class="w-full"
							/>
						</div>
						<div class="space-y-1">
							<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Tingkat Kelas</label>
							<select
								v-model="regGrade"
								class="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 font-medium outline-none"
							>
								<option :value="1">Kelas 1 SD</option>
								<option :value="2">Kelas 2 SD</option>
								<option :value="3">Kelas 3 SD</option>
								<option :value="4">Kelas 4 SD</option>
								<option :value="5">Kelas 5 SD</option>
								<option :value="6">Kelas 6 SD</option>
							</select>
						</div>
					</div>

					<div class="space-y-1">
						<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Nama Sekolah</label>
						<UInput
							v-model="regSchool"
							placeholder="Contoh: SDN Nusantara 01 / SD Merdeka"
							icon="i-lucide-school"
							class="w-full"
						/>
					</div>

					<UButton
						type="submit"
						color="primary"
						class="w-full font-bold justify-center mt-2"
						:loading="isLoading"
					>
						Daftar & Bergabung
					</UButton>
				</form>

				<!-- FORM 3: MASUK GURU & ADMIN -->
				<form
					v-else
					class="space-y-4"
					@submit.prevent="handleTeacherLogin"
				>
					<div class="space-y-1.5">
						<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
							Email Guru / Admin
						</label>
						<UInput
							v-model="teacherEmail"
							type="email"
							placeholder="Contoh: dinarpermadi07@gmail.com"
							icon="i-lucide-mail"
							class="w-full"
						/>
					</div>

					<div class="space-y-1.5">
						<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
							Kata Sandi / PIN
						</label>
						<UInput
							v-model="teacherPin"
							type="password"
							placeholder="Masukkan kata sandi..."
							icon="i-lucide-lock"
							class="w-full"
						/>
					</div>

					<div class="flex items-center justify-between text-xs pt-1">
						<button
							type="button"
							class="text-amber-600 dark:text-amber-400 underline font-medium hover:opacity-80"
							@click="fillAdminSample"
						>
							Masuk sebagai Super Admin (Dinar Permadi)
						</button>
					</div>

					<UButton
						type="submit"
						color="primary"
						class="w-full font-bold justify-center"
						:loading="isLoading"
					>
						Masuk Portal Guru / Admin
					</UButton>
				</form>
			</div>
		</template>
	</UModal>
</template>
