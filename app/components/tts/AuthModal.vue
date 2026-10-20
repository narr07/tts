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
			<div class="space-y-5">
				<!-- Header -->
				<div class="text-center space-y-1">
					<div class="size-12 rounded-md bg-primary/10 text-primary mx-auto flex items-center justify-center">
						<UIcon name="i-lucide-user" class="size-6" />
					</div>
					<h3 class="text-2xl font-extrabold text-highlighted">
						{{
							activeTab === 'student_login'
								? 'Masuk Siswa SD'
								: activeTab === 'student_register'
									? 'Pendaftaran Siswa Baru'
									: 'Masuk Guru & Admin'
						}}
					</h3>
					<p class="text-base text-muted">
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
				<div role="tablist" aria-label="Cara masuk" class="flex items-center gap-1 p-1 bg-elevated rounded-lg">
					<button
						type="button"
						role="tab"
						:aria-selected="activeTab === 'student_login'"
						class="flex-1 min-h-11 px-2 text-sm font-bold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-primary"
						:class="activeTab === 'student_login' ? 'bg-default shadow-sm text-primary' : 'text-toned hover:text-highlighted'"
						@click="activeTab = 'student_login'; errorMessage = ''"
					>
						Masuk Siswa
					</button>
					<button
						type="button"
						role="tab"
						:aria-selected="activeTab === 'student_register'"
						class="flex-1 min-h-11 px-2 text-sm font-bold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-primary"
						:class="activeTab === 'student_register' ? 'bg-default shadow-sm text-primary' : 'text-toned hover:text-highlighted'"
						@click="activeTab = 'student_register'; errorMessage = ''"
					>
						Daftar Siswa
					</button>
					<button
						type="button"
						role="tab"
						:aria-selected="activeTab === 'teacher_login'"
						class="flex-1 min-h-11 px-2 text-sm font-bold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-primary"
						:class="activeTab === 'teacher_login' ? 'bg-default shadow-sm text-primary' : 'text-toned hover:text-highlighted'"
						@click="activeTab = 'teacher_login'; errorMessage = ''"
					>
						Guru / Admin
					</button>
				</div>

				<!-- Alert Error -->
				<UAlert
					v-if="errorMessage"
					color="error"
					variant="subtle"
					icon="i-lucide-circle-alert"
					:title="errorMessage"
				/>

				<!-- FORM 1: MASUK SISWA -->
				<form
					v-if="activeTab === 'student_login'"
					class="space-y-4"
					@submit.prevent="handleStudentLogin"
				>
					<div class="space-y-1.5">
						<label for="authmodal-studentnisn" class="block text-sm font-bold text-toned">
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
						<label for="authmodal-studentbirthdate" class="block text-sm font-bold text-toned">
							Tanggal Lahir
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
						<label for="authmodal-regnisn" class="block text-sm font-bold text-toned">NISN Siswa</label>
						<UInput
							id="authmodal-regnisn"
							v-model="regNisn"
							placeholder="10 digit nomor NISN"
							icon="i-lucide-id-card"
							class="w-full"
						/>
					</div>

					<div class="space-y-1">
						<label for="authmodal-regname" class="block text-sm font-bold text-toned">Nama Lengkap</label>
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
							<label for="authmodal-regbirthdate" class="block text-sm font-bold text-toned">Tanggal Lahir</label>
							<UInput
								id="authmodal-regbirthdate"
								v-model="regBirthDate"
								type="date"
								class="w-full"
							/>
						</div>
						<div class="space-y-1">
							<label for="authmodal-reggrade" class="block text-sm font-bold text-toned">Tingkat Kelas</label>
							<USelect
								id="authmodal-reggrade"
								v-model="regGrade"
								:items="GRADE_OPTIONS"
								class="w-full"
							/>
						</div>
					</div>

					<div class="space-y-1">
						<label for="authmodal-regschool" class="block text-sm font-bold text-toned">Nama Sekolah</label>
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
						<label for="authmodal-teacheremail" class="block text-sm font-bold text-toned">
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
						<label for="authmodal-teacherpin" class="block text-sm font-bold text-toned">
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
