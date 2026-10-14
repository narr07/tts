<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/authStore'

defineProps<{
	open: boolean
}>()

const emit = defineEmits<{
	(e: 'update:open', val: boolean): void
}>()

const auth = useAuthStore()

const activeTab = ref<'student_login' | 'student_register' | 'teacher_login'>('student_login')
const errorMessage = ref('')
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

// Akun contoh hanya muncul saat development, karena siapa pun bisa memakainya
const showSampleAccount = import.meta.dev

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
					<p class="text-xs text-muted">
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
				<div role="tablist" aria-label="Cara masuk" class="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
					<button
						type="button"
						role="tab"
						:aria-selected="activeTab === 'student_login'"
						class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
						:class="activeTab === 'student_login' ? 'bg-white dark:bg-neutral-700 shadow-sm text-warning' : 'text-toned hover:text-highlighted'"
						@click="activeTab = 'student_login'; errorMessage = ''"
					>
						Masuk Siswa
					</button>
					<button
						type="button"
						role="tab"
						:aria-selected="activeTab === 'student_register'"
						class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
						:class="activeTab === 'student_register' ? 'bg-white dark:bg-neutral-700 shadow-sm text-warning' : 'text-toned hover:text-highlighted'"
						@click="activeTab = 'student_register'; errorMessage = ''"
					>
						Daftar Siswa
					</button>
					<button
						type="button"
						role="tab"
						:aria-selected="activeTab === 'teacher_login'"
						class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
						:class="activeTab === 'teacher_login' ? 'bg-white dark:bg-neutral-700 shadow-sm text-warning' : 'text-toned hover:text-highlighted'"
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
						<label for="authmodal-studentnisn" class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
							Nomor Induk Siswa Nasional (NISN)
						</label>
						<UInput
							id="authmodal-studentnisn"
							v-model="studentNisn"
							placeholder="Contoh: 0012345674"
							icon="i-lucide-id-card"
							class="w-full"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="authmodal-studentbirthdate" class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
							Tanggal Lahir (Format: YYYY-MM-DD)
						</label>
						<UInput
							id="authmodal-studentbirthdate"
							v-model="studentBirthDate"
							type="date"
							icon="i-lucide-calendar"
							class="w-full"
						/>
					</div>

					<div v-if="showSampleAccount" class="flex items-center justify-between text-xs pt-1">
						<UButton
							variant="link"
							color="warning"
							size="xs"
							class="px-0"
							@click="fillStudentSample"
						>
							Coba akun contoh (Dewi, kelas 4)
						</UButton>
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
						<label for="authmodal-regnisn" class="text-xs font-bold text-neutral-700 dark:text-neutral-300">NISN Siswa</label>
						<UInput
							id="authmodal-regnisn"
							v-model="regNisn"
							placeholder="10 digit nomor NISN"
							icon="i-lucide-id-card"
							class="w-full"
						/>
					</div>

					<div class="space-y-1">
						<label for="authmodal-regname" class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Nama Lengkap</label>
						<UInput
							id="authmodal-regname"
							v-model="regName"
							placeholder="Nama lengkap siswa"
							icon="i-lucide-user"
							class="w-full"
						/>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-1">
							<label for="authmodal-regbirthdate" class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Tanggal Lahir</label>
							<UInput
								id="authmodal-regbirthdate"
								v-model="regBirthDate"
								type="date"
								class="w-full"
							/>
						</div>
						<div class="space-y-1">
							<label for="authmodal-reggrade" class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Tingkat Kelas</label>
							<USelect
								id="authmodal-reggrade"
								v-model="regGrade"
								:items="GRADE_OPTIONS"
								class="w-full"
							/>
						</div>
					</div>

					<div class="space-y-1">
						<label for="authmodal-regschool" class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Nama Sekolah</label>
						<UInput
							id="authmodal-regschool"
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
						<label for="authmodal-teacheremail" class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
							Email Guru / Admin
						</label>
						<UInput
							id="authmodal-teacheremail"
							v-model="teacherEmail"
							type="email"
							placeholder="nama@sekolah.sch.id"
							icon="i-lucide-mail"
							class="w-full"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="authmodal-teacherpin" class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
							Kata Sandi / PIN
						</label>
						<UInput
							id="authmodal-teacherpin"
							v-model="teacherPin"
							type="password"
							placeholder="Masukkan kata sandi..."
							icon="i-lucide-lock"
							class="w-full"
						/>
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
