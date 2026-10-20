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
			<div class="space-y-5">
				<!-- Header -->
				<div class="flex items-center gap-3">
					<div class="size-12 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<UIcon name="i-lucide-user-pen" class="size-6" />
					</div>
					<div>
						<h3 class="text-xl font-extrabold text-highlighted">
							{{ auth.isStudent ? 'Profil Saya' : 'Edit Profil Saya' }}
						</h3>
						<p class="text-sm text-muted">
							{{ auth.isStudent ? 'Ubah nama, sekolah, dan kelasmu.' : 'Sesuaikan data profil dan kata sandi Anda.' }}
						</p>
					</div>
				</div>

				<UAlert
					v-if="errorMessage"
					color="error"
					variant="subtle"
					icon="i-lucide-circle-alert"
					:title="errorMessage"
				/>

				<form class="space-y-4" @submit.prevent="handleSave">
					<!-- Nama Lengkap -->
					<div class="space-y-1.5">
						<label for="profilemodal-name" class="block text-sm font-bold text-toned">
							Nama Lengkap
						</label>
						<UInput
							id="profilemodal-name"
							v-model="name"
							placeholder="Masukkan nama lengkap..."
							icon="i-lucide-user"
							class="w-full"
							required
						/>
					</div>

					<!-- Asal Sekolah -->
					<div class="space-y-1.5">
						<label for="profilemodal-schoolname" class="block text-sm font-bold text-toned">
							Nama Sekolah
						</label>
						<UInput
							id="profilemodal-schoolname"
							v-model="schoolName"
							placeholder="Contoh: SDN 01 Nusantara"
							icon="i-lucide-school"
							class="w-full"
						/>
					</div>

					<!-- Tingkat Kelas (Hanya untuk Siswa) -->
					<div v-if="auth.isStudent" class="space-y-1.5">
						<label for="profilemodal-grade" class="block text-sm font-bold text-toned">
							Tingkat Kelas SD
						</label>
						<USelect
							id="profilemodal-grade"
							v-model="grade"
							:items="GRADE_OPTIONS"
							class="w-full"
						/>
					</div>

					<!-- Ubah Kata Sandi / PIN Baru (Opsional) -->
					<div class="space-y-1.5 pt-3 border-t border-default">
						<label for="profilemodal-newpassword" class="block text-sm font-bold text-toned">
							Ubah Kata Sandi / PIN
							<span class="block text-xs text-muted font-normal">Kosongkan jika tidak ingin diubah</span>
						</label>
						<UInput
							id="profilemodal-newpassword"
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
