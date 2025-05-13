<template>
	<div
		ref="host"
		class="lottie-orb"
		:style="{ display: visible ? 'block' : 'none' }"
		@click="$emit('click')"
	/>
</template>

<script setup lang="ts">
import lottie, { type AnimationItem } from 'lottie-web'
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Props {
  animation: object
  visible: boolean
}
const props = defineProps<Props>()
const host = ref<HTMLDivElement|null>(null)
let player: AnimationItem|null = null

onMounted(() => {
  player = lottie.loadAnimation({
    container: host.value!,
    renderer:  'svg',
    loop:      true,
    autoplay:  true,
    animationData: props.animation,
  })
})
onBeforeUnmount(() => player?.destroy())
</script>

<style scoped>
.lottie-orb {
  position: absolute;
  inset: 0;
  cursor: pointer;
}
</style>
