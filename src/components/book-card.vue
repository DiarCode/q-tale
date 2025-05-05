<template>
	<div
		class="group relative bg-white/5 shadow-blue-800/10 shadow-lg backdrop-blur-md border border-white/10 rounded-xl w-56 h-72 overflow-hidden hover:scale-105 transition-transform hover:-translate-y-4 duration-500 book-card"
	>
		<img
			class="absolute inset-0 opacity-60 w-full h-full object-cover"
			:src="props.book.cover"
			:alt="props.book.title"
		/>
		<div class="absolute inset-0 pointer-events-none card-shine" />
		<div class="bottom-0 absolute inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
			<h4 class="font-semibold text-white">{{props.book.title}}</h4>
			<p class="text-blue-200 text-sm">{{props.book.author}}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<any>()
</script>

<style scoped></style>
