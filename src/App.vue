<template>
	<div class="fixed inset-0 bg-black pointer-events-none" />

	<router-view v-slot="{ Component }">
		<transition
			name="scale"
			mode="out-in"
		>
			<component :is="Component" />
		</transition>
	</router-view>
</template>

<script setup lang="ts">
// no extra JS needed here
</script>

<style>
.scale-enter-active,
.scale-leave-active {
  transition: all 0.6s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
