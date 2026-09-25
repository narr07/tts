<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/authStore'

const props = defineProps<{
	open: boolean
}>()

const emit = defineEmits<{
	(e: 'update:open', val: boolean): void
}>()

const auth = useAuthStore()
const toast = useToast()

const name = ref('')
const schoolName = ref('')
const grade = ref<number>(1)
const newPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen && auth.currentUser) {
			name.value = auth.currentUser.name || ''
			schoolName.value = auth.currentUser.schoolName || ''
			grade.value = auth.currentUser.grade || 1
			newPassword.value = ''
			errorMessage.value = ''
		}
	}
)

async function handleSave() {
	if (!name.value.trim()) {
		errorMessage.value = 'Nama lengkap tidak boleh kosong!'
		return
	}

	isLoading.value = true
	errorMessage.value = ''
	try {
		await auth.updateProfile({
			name: name.value.trim(),
			schoolName: schoolName.value.trim(),
			grade: auth.isStudent ? Number(grade.value) : undefined,
			password: newPassword.value.trim() ? newPassword.value.trim() : undefined
		})

		toast.add({
			title: 'Profil Berhasil Diperbarui',
			description: 'Data profil Anda telah berhasil disimpan.',
			color: 'success'
		})
		emit('update:open', false)
	} catch (err: any) {
		errorMessage.value = err.data?.statusMessage || 'Gagal menyimpan perubahan profil.'
	} finally {
		isLoading.value = false
	}
}
</script>

<template>
	<UModal
		:open="open"
		@update:open="(val) => emit('update:open', val)"
	>
		<template #body>
			<div class="p-4 sm:p-6 space-y-5 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl">
				<!-- Header -->
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
						<UIcon name="i-lucide-user-pen" class="w-6 h-6" />
					</div>
					<div>
						<h3 class="text-lg font-black text-neutral-900 dark:text-neutral-100">
							Edit Profil Saya
						</h3>
						<p class="text-xs text-neutral-500 dark:text-neutral-400">
							{{ auth.isStudent ? 'Sesuaikan nama, sekolah, dan kelas Anda.' : 'Sesuaikan data profil dan kata sandi Anda.' }}
						</p>
					</div>
				</div>

				<!-- Alert Error -->
				<div
					v-if="errorMessage"
					class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2"
				>
					<UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0 text-rose-500" />
					<span>{{ errorMessage }}</span>
				</div>

				<form class="space-y-4" @submit.prevent="handleSave">
					<!-- Nama Lengkap -->
					<div class="space-y-1.5">
						<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
							Nama Lengkap
						</label>
						<UInput
							v-model="name"
							placeholder="Masukkan nama lengkap..."
							icon="i-lucide-user"
							class="w-full"
							required
						/>
					</div>

					<!-- Asal Sekolah -->
					<div class="space-y-1.5">
						<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
							Nama Sekolah
						</label>
						<UInput
							v-model="schoolName"
							placeholder="Contoh: SDN 01 Nusantara"
							icon="i-lucide-school"
							class="w-full"
						/>
					</div>

					<!-- Tingkat Kelas (Hanya untuk Siswa) -->
					<div v-if="auth.isStudent" class="space-y-1.5">
						<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
							Tingkat Kelas SD
						</label>
						<select
							v-model="grade"
							class="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 font-bold outline-none"
						>
							<option :value="1">Kelas 1 SD</option>
							<option :value="2">Kelas 2 SD</option>
							<option :value="3">Kelas 3 SD</option>
							<option :value="4">Kelas 4 SD</option>
							<option :value="5">Kelas 5 SD</option>
							<option :value="6">Kelas 6 SD</option>
						</select>
					</div>

					<!-- Ubah Kata Sandi / PIN Baru (Opsional) -->
					<div class="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
						<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
							<span>Ubah Kata Sandi / PIN</span>
							<span class="text-[10px] text-neutral-400 font-normal">Kosongkan jika tidak ingin diubah</span>
						</label>
						<UInput
							v-model="newPassword"
							type="password"
							placeholder="Masukkan kata sandi baru..."
							icon="i-lucide-lock"
							class="w-full"
						/>
					</div>

					<div class="flex items-center gap-2 pt-3">
						<UButton
							type="button"
							color="neutral"
							variant="outline"
							class="flex-1 font-bold justify-center"
							@click="emit('update:open', false)"
						>
							Batal
						</UButton>
						<UButton
							type="submit"
							color="primary"
							class="flex-1 font-bold justify-center"
							:loading="isLoading"
						>
							Simpan Perubahan
						</UButton>
					</div>
				</form>
			</div>
		</template>
	</UModal>
</template>
