<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/authStore'

const auth = useAuthStore()
const toast = useToast()

const activeTab = ref<'teachers' | 'students'>('teachers')
const search = ref('')

const { data, status, refresh: fetchUsers } = await useFetch<{ teachers: any[]; students: any[] }>('/api/admin/users')
const teachers = computed(() => data.value?.teachers || [])
const students = computed(() => data.value?.students || [])
const isLoading = computed(() => status.value === 'pending')

// Edit Modal State
const isEditModalOpen = ref(false)
const isSaving = ref(false)
const editErrorMessage = ref('')
const editingUser = ref<{
	id: string
	name: string
	email: string
	schoolName: string
	grade?: number
	nisn?: string
	totalXp?: number
	totalStars?: number
	password?: string
	isStudent: boolean
}>({
	id: '',
	name: '',
	email: '',
	schoolName: '',
	grade: 1,
	nisn: '',
	totalXp: 0,
	totalStars: 0,
	password: '',
	isStudent: false
})

function openEditTeacher(t: any) {
	editingUser.value = {
		id: t.id,
		name: t.name,
		email: t.email,
		schoolName: t.schoolName || '',
		password: '',
		isStudent: false
	}
	editErrorMessage.value = ''
	isEditModalOpen.value = true
}

function openEditStudent(s: any) {
	editingUser.value = {
		id: s.id,
		name: s.name,
		email: s.email || '',
		schoolName: s.schoolName || '',
		grade: s.grade || 1,
		nisn: s.nisn || '',
		totalXp: s.totalXp || 0,
		totalStars: s.totalStars || 0,
		password: '',
		isStudent: true
	}
	editErrorMessage.value = ''
	isEditModalOpen.value = true
}

async function handleSaveUser() {
	if (!editingUser.value.name.trim()) {
		editErrorMessage.value = 'Nama tidak boleh kosong!'
		return
	}

	isSaving.value = true
	editErrorMessage.value = ''
	try {
		await $fetch(`/api/admin/users/${editingUser.value.id}`, {
			method: 'PUT',
			body: {
				name: editingUser.value.name.trim(),
				email: editingUser.value.isStudent ? undefined : editingUser.value.email.trim(),
				schoolName: editingUser.value.schoolName.trim(),
				grade: editingUser.value.isStudent ? Number(editingUser.value.grade) : undefined,
				nisn: editingUser.value.isStudent ? editingUser.value.nisn.trim() : undefined,
				totalXp: editingUser.value.isStudent ? Number(editingUser.value.totalXp) : undefined,
				totalStars: editingUser.value.isStudent ? Number(editingUser.value.totalStars) : undefined,
				password: editingUser.value.password?.trim() ? editingUser.value.password.trim() : undefined
			}
		})

		toast.add({
			title: 'Data Pengguna Diperbarui',
			description: `Data untuk ${editingUser.value.name} berhasil disimpan.`,
			color: 'success'
		})
		isEditModalOpen.value = false
		await fetchUsers()
	} catch (err: any) {
		editErrorMessage.value = err.data?.statusMessage || 'Gagal menyimpan perubahan pengguna.'
	} finally {
		isSaving.value = false
	}
}

async function handleDelete(id: string, name: string) {
	if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${name}"?`)) {
		return
	}

	try {
		await $fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
		toast.add({
			title: 'Pengguna Dihapus',
			description: `Akun "${name}" telah dihapus.`,
			color: 'neutral'
		})
		await fetchUsers()
	} catch (err: any) {
		alert(err.data?.statusMessage || 'Gagal menghapus pengguna.')
	}
}

onMounted(() => {
	fetchUsers()
})
</script>

<template>
	<div class="space-y-6">
		<!-- Header Panel Super Admin -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900 text-white shadow-xl border border-neutral-800">
			<div class="flex items-center gap-3">
				<div class="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0">
					👑
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h2 class="font-extrabold text-lg sm:text-xl">Manajemen Pengguna Super Admin</h2>
						<UBadge color="primary" variant="subtle" size="sm">Pusat Kendali</UBadge>
					</div>
					<p class="text-xs text-neutral-400 mt-0.5">
						Login sebagai: <strong class="text-amber-400">{{ auth.currentUser?.email }}</strong> (Dinar Permadi)
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<UButton
					size="sm"
					variant="outline"
					color="neutral"
					icon="i-lucide-refresh-cw"
					:loading="isLoading"
					@click="fetchUsers"
				>
					Segarkan Data
				</UButton>
			</div>
		</div>

		<!-- Main Card -->
		<UCard :ui="{ body: 'p-4 sm:p-6' }">
			<!-- Tab Switchers & Search -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
				<div class="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
					<button
						type="button"
						class="px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer"
						:class="activeTab === 'teachers' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary dark:text-primary-400' : 'text-neutral-500 hover:text-neutral-900'"
						@click="activeTab = 'teachers'"
					>
						<UIcon name="i-lucide-graduation-cap" class="w-4 h-4" />
						<span>Data Guru ({{ teachers.length }})</span>
					</button>
					<button
						type="button"
						class="px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer"
						:class="activeTab === 'students' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary dark:text-primary-400' : 'text-neutral-500 hover:text-neutral-900'"
						@click="activeTab = 'students'"
					>
						<UIcon name="i-lucide-users" class="w-4 h-4" />
						<span>Data Siswa SD ({{ students.length }})</span>
					</button>
				</div>

				<div class="w-full sm:w-64">
					<UInput
						v-model="search"
						placeholder="Cari nama, NISN, atau sekolah..."
						icon="i-lucide-search"
						size="sm"
						class="w-full"
					/>
				</div>
			</div>

			<!-- TAB 1: DAFTAR GURU -->
			<div v-if="activeTab === 'teachers'" class="space-y-4">
				<div v-if="isLoading" class="p-8 text-center text-neutral-400">
					<UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
					<p class="text-xs">Memuat data guru...</p>
				</div>

				<div v-else-if="teachers.length === 0" class="p-8 text-center text-neutral-400 text-sm">
					Belum ada guru yang terdaftar.
				</div>

				<div v-else class="overflow-x-auto">
					<table class="w-full text-left text-xs border-collapse">
						<thead>
							<tr class="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider">
								<th class="py-3 px-3 font-bold">Nama Guru</th>
								<th class="py-3 px-3 font-bold">Email</th>
								<th class="py-3 px-3 font-bold">Asal Sekolah</th>
								<th class="py-3 px-3 font-bold text-right">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
							<tr
								v-for="t in teachers.filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.schoolName.toLowerCase().includes(search.toLowerCase()) || item.email.toLowerCase().includes(search.toLowerCase()))"
								:key="t.id"
								class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
							>
								<td class="py-3 px-3 font-bold text-neutral-900 dark:text-neutral-100">
									<div class="flex items-center gap-2">
										<div class="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 flex items-center justify-center font-bold">
											{{ t.name.charAt(0) }}
										</div>
										<div>
											<p>{{ t.name }}</p>
											<UBadge v-if="t.role === 'admin'" color="primary" variant="subtle" size="xs">Super Admin</UBadge>
										</div>
									</div>
								</td>
								<td class="py-3 px-3 text-neutral-600 dark:text-neutral-400 font-mono">
									{{ t.email }}
								</td>
								<td class="py-3 px-3 text-neutral-700 dark:text-neutral-300">
									{{ t.schoolName || '-' }}
								</td>
								<td class="py-3 px-3 text-right">
									<div class="flex items-center justify-end gap-1.5">
										<UButton
											size="xs"
											color="neutral"
											variant="ghost"
											icon="i-lucide-pencil"
											class="cursor-pointer font-bold"
											@click="openEditTeacher(t)"
										>
											Edit
										</UButton>
										<UButton
											v-if="t.email !== 'dinarpermadi07@gmail.com'"
											size="xs"
											color="error"
											variant="ghost"
											icon="i-lucide-trash-2"
											class="cursor-pointer"
											@click="handleDelete(t.id, t.name)"
										>
											Hapus
										</UButton>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- TAB 2: DAFTAR SISWA -->
			<div v-else class="space-y-4">
				<div v-if="isLoading" class="p-8 text-center text-neutral-400">
					<UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
					<p class="text-xs">Memuat data siswa...</p>
				</div>

				<div v-else-if="students.length === 0" class="p-8 text-center text-neutral-400 text-sm">
					Belum ada siswa yang mendaftar.
				</div>

				<div v-else class="overflow-x-auto">
					<table class="w-full text-left text-xs border-collapse">
						<thead>
							<tr class="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider">
								<th class="py-3 px-3 font-bold">NISN & Nama Siswa</th>
								<th class="py-3 px-3 font-bold">Kelas</th>
								<th class="py-3 px-3 font-bold">Asal Sekolah</th>
								<th class="py-3 px-3 font-bold">Total XP</th>
								<th class="py-3 px-3 font-bold">Bintang</th>
								<th class="py-3 px-3 font-bold text-right">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
							<tr
								v-for="s in students.filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.schoolName.toLowerCase().includes(search.toLowerCase()) || (item.nisn && item.nisn.includes(search)))"
								:key="s.id"
								class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
							>
								<td class="py-3 px-3 font-bold text-neutral-900 dark:text-neutral-100">
									<div class="flex items-center gap-2">
										<div class="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center font-bold">
											{{ s.name.charAt(0) }}
										</div>
										<div>
											<p class="leading-tight">{{ s.name }}</p>
											<p class="text-[10px] text-neutral-500 font-mono font-normal">NISN: {{ s.nisn || '-' }}</p>
										</div>
									</div>
								</td>
								<td class="py-3 px-3">
									<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
										Kelas {{ s.grade }} SD
									</span>
								</td>
								<td class="py-3 px-3 text-neutral-700 dark:text-neutral-300">
									{{ s.schoolName || '-' }}
								</td>
								<td class="py-3 px-3 font-extrabold text-amber-600 dark:text-amber-400">
									⚡ {{ s.totalXp || 0 }} XP
								</td>
								<td class="py-3 px-3 font-extrabold text-amber-500">
									⭐ {{ s.totalStars || 0 }}
								</td>
								<td class="py-3 px-3 text-right">
									<div class="flex items-center justify-end gap-1.5">
										<UButton
											size="xs"
											color="neutral"
											variant="ghost"
											icon="i-lucide-pencil"
											class="cursor-pointer font-bold"
											@click="openEditStudent(s)"
										>
											Edit
										</UButton>
										<UButton
											size="xs"
											color="error"
											variant="ghost"
											icon="i-lucide-trash-2"
											class="cursor-pointer"
											@click="handleDelete(s.id, s.name)"
										>
											Hapus
										</UButton>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</UCard>

		<!-- MODAL EDIT PENGGUNA (UNTUK ADMIN) -->
		<UModal
			:open="isEditModalOpen"
			@update:open="(val) => isEditModalOpen = val"
		>
			<template #body>
				<div class="p-4 sm:p-6 space-y-5 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl">
					<div class="flex items-center gap-3">
						<div class="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
							<UIcon name="i-lucide-user-cog" class="w-6 h-6" />
						</div>
						<div>
							<h3 class="text-lg font-black text-neutral-900 dark:text-neutral-100">
								Edit Data Pengguna
							</h3>
							<p class="text-xs text-neutral-500 dark:text-neutral-400">
								{{ editingUser.isStudent ? 'Sesuaikan data profil dan capaian siswa SD.' : 'Sesuaikan profil guru atau pengajar.' }}
							</p>
						</div>
					</div>

					<div
						v-if="editErrorMessage"
						class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2"
					>
						<UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0 text-rose-500" />
						<span>{{ editErrorMessage }}</span>
					</div>

					<form class="space-y-4" @submit.prevent="handleSaveUser">
						<!-- Nama Lengkap -->
						<div class="space-y-1.5">
							<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
								Nama Lengkap
							</label>
							<UInput
								v-model="editingUser.name"
								placeholder="Nama pengguna..."
								class="w-full font-bold"
								required
							/>
						</div>

						<!-- Jika Guru: Email -->
						<div v-if="!editingUser.isStudent" class="space-y-1.5">
							<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
								Alamat Email
							</label>
							<UInput
								v-model="editingUser.email"
								type="email"
								placeholder="nama@sekolah.sch.id"
								class="w-full font-mono"
								required
							/>
						</div>

						<!-- Jika Siswa: NISN & Kelas -->
						<div v-if="editingUser.isStudent" class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
									NISN Siswa
								</label>
								<UInput
									v-model="editingUser.nisn"
									placeholder="10 digit NISN..."
									class="w-full font-mono font-bold"
								/>
							</div>

							<div class="space-y-1.5">
								<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
									Tingkat Kelas
								</label>
								<select
									v-model="editingUser.grade"
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
						</div>

						<!-- Asal Sekolah -->
						<div class="space-y-1.5">
							<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
								Asal Sekolah
							</label>
							<UInput
								v-model="editingUser.schoolName"
								placeholder="Contoh: SDN 01 Nusantara"
								class="w-full"
							/>
						</div>

						<!-- Jika Siswa: Edit XP & Stars -->
						<div v-if="editingUser.isStudent" class="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
							<div class="space-y-1.5">
								<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
									Total XP
								</label>
								<UInput
									v-model="editingUser.totalXp"
									type="number"
									class="w-full font-bold"
								/>
							</div>
							<div class="space-y-1.5">
								<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
									Total Bintang
								</label>
								<UInput
									v-model="editingUser.totalStars"
									type="number"
									class="w-full font-bold"
								/>
							</div>
						</div>

						<!-- Reset Kata Sandi / PIN (Opsional) -->
						<div class="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
							<label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
								<span>Ganti Kata Sandi / PIN Akun</span>
								<span class="text-[10px] text-neutral-400 font-normal">Kosongkan bila tidak diganti</span>
							</label>
							<UInput
								v-model="editingUser.password"
								type="password"
								placeholder="Ketik kata sandi baru untuk user ini..."
								class="w-full"
							/>
						</div>

						<div class="flex items-center gap-2 pt-3">
							<UButton
								type="button"
								color="neutral"
								variant="outline"
								class="flex-1 font-bold justify-center"
								@click="isEditModalOpen = false"
							>
								Batal
							</UButton>
							<UButton
								type="submit"
								color="primary"
								class="flex-1 font-bold justify-center"
								:loading="isSaving"
							>
								Simpan Perubahan
							</UButton>
						</div>
					</form>
				</div>
			</template>
		</UModal>
	</div>
</template>
