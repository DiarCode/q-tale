<template>
	<nav class="top-4 right-0 left-0 z-50 fixed flex justify-center px-4">
		<div
			class="flex items-center gap-16 bg-[#15002a]/60 shadow backdrop-blur px-8 py-3 border border-purple-500/30 rounded-full"
		>
			<RouterLink to="/">
				<h1 class="logo">Audioqor</h1>
			</RouterLink>
			<div class="hidden md:flex gap-8">
				<!-- internal anchors use href for smooth scrolling -->
				<RouterLink
					:to="{name: 'home', hash: '#hero'}"
					class="nav-link"
				>
					Басты бет
				</RouterLink>
				<RouterLink
					:to="{name: 'home', hash: '#books'}"
					class="nav-link"
					>Кітаптар</RouterLink
				>
				<RouterLink
					to="/books"
					class="nav-link"
					>Жанрлар</RouterLink
				>
				<!-- router-link for a different page -->
				<RouterLink
					to="/books"
					class="nav-link"
					>Жаңа қосылғандар</RouterLink
				>
			</div>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
/* nav */
.logo{ @apply bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 font-bold text-transparent text-2xl; }
.nav-link{ @apply relative text-purple-300 hover:text-white transition; }
.nav-link::after{ content:'';@apply absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-purple-400 to-fuchsia-500 scale-x-0 origin-left transition-transform; }
.nav-link:hover::after{ @apply scale-x-100; }
</style>
