<template>
	<div class="flex flex-col gap-2">
		<!-- waveform -->
		<IllestWaveform
			ref="waveRef"
			v-bind="waveOpts"
			@on-ready="onReady"
			@on-play="playing = true"
			@on-pause="playing = false"
			@on-click="resumeAfterSeek"
		/>

		<!-- controls -->
		<div class="flex items-center gap-3 rounded-xl select-none">
			<!-- play / pause -->
			<button
				:disabled="!ready"
				@click="toggle"
				class="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 p-2 rounded-full transition"
			>
				<component
					:is="playing ? PauseIcon : PlayIcon"
					class="w-4 h-4 text-white"
				/>
			</button>

			<!-- clock -->
			<span class="ml-auto w-[110px] tabular-nums text-slate-300 text-sm text-right">
				{{ current }} / {{ duration }}
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { IllestWaveform, type IllestWaveformProps } from '1llest-waveform-vue'
import '1llest-waveform-vue/lib/style.css'
import { PauseIcon, PlayIcon } from 'lucide-vue-next'
import { onBeforeUnmount, ref, watch } from 'vue'

// accept a URL
const props = defineProps<{ url: string }>()

// waveform configuration
const waveOpts: IllestWaveformProps = {
  url: props.url,
  waveColor:     '#8b5cf6',
  progressColor: '#4c1d95',
  cursorColor:   '#ffffff',
  barWidth:      2,
  interact:      true,
  fade:          true,
} as const

// refs & state
const waveRef  = ref<typeof IllestWaveform | null>(null)
const ready    = ref(false)
const playing  = ref(false)
const vol      = ref(1)             // 0–1 master volume
const current  = ref('0:00')        // clock
const duration = ref('0:00')

// helper to drive the Web Audio gainNode directly
function setGain(value: number) {
  const g = waveRef.value?.gainNode
  if (g) g.gain.setTargetAtTime(value, g.context.currentTime, 0.01)
}

// once the waveform is ready, grab its duration and set initial gain
function onReady() {
  ready.value    = true
  duration.value = waveRef.value?.getDuration() ?? '0:00'
  setGain(vol.value)
}

// keep the slider ↔ gainNode in sync
watch(vol, v => {
  if (ready.value) setGain(v)
}, { immediate: true })

// play / pause toggle
function toggle() {
  if (!ready.value) return

  if (playing.value) {
    waveRef.value?.pause()
  }  else {
    waveRef.value?.play()
  }
}


// after any click/seek on the waveform, ensure playback resumes at new pos
function resumeAfterSeek() {
  if (playing.value) waveRef.value?.play()
}

// real-time clock while playing
let raf = 0
function tick() {
  current.value = waveRef.value?.getCurrentTime() ?? '0:00'
  if (playing.value) raf = requestAnimationFrame(tick)
}
watch(playing, isOn => {
  if (isOn) tick()
  else      cancelAnimationFrame(raf)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>
