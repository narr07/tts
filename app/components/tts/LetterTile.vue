<script setup lang="ts">
// Kotak bergaya sel TTS (nomor kecil di pojok kiri atas), dipakai ulang di logo, nomor misi, peringkat, dan nomor soal
const props = withDefaults(defineProps<{
	label?: string | number
	corner?: string | number
	icon?: string
	color?: 'primary' | 'secondary' | 'success' | 'neutral'
	size?: 'sm' | 'md' | 'lg'
}>(), {
	label: undefined,
	corner: undefined,
	icon: undefined,
	color: 'neutral',
	size: 'md'
})

// Class ditulis utuh (bukan interpolasi) supaya terdeteksi Tailwind
const colorClasses = {
	primary: 'bg-primary text-inverted border-primary-900/40 dark:border-primary-200/60',
	secondary: 'bg-secondary text-inverted border-secondary-900/40 dark:border-secondary-200/60',
	success: 'bg-success text-inverted border-success-900/40 dark:border-success-200/60',
	neutral: 'bg-default text-highlighted border-accented'
}

const sizeClasses = {
	sm: { box: 'size-9 text-base', icon: 'size-5', corner: 'text-[10px] top-0 left-0.5' },
	md: { box: 'size-12 text-xl', icon: 'size-6', corner: 'text-[11px] top-0.5 left-1' },
	lg: { box: 'size-16 text-3xl', icon: 'size-8', corner: 'text-xs top-1 left-1.5' }
}
</script>

<template>
	<span
		class="relative inline-flex items-center justify-center shrink-0 rounded-md border-2 border-b-4 font-extrabold leading-none select-none"
		:class="[colorClasses[props.color], sizeClasses[props.size].box]"
	>
		<span
			v-if="props.corner !== undefined"
			class="absolute font-bold leading-none"
			:class="sizeClasses[props.size].corner"
			aria-hidden="true"
		>
			{{ props.corner }}
		</span>
		<UIcon v-if="props.icon" :name="props.icon" :class="sizeClasses[props.size].icon" />
		<template v-else>{{ props.label }}</template>
	</span>
</template>
