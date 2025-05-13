<template>
	<div class="stage">
		<!-- Back nav -->
		<nav
			class="nav-back"
			@click="router.back()"
		>
			<ChevronLeft class="w-5 h-5" /> Қайту
		</nav>

		<!-- Ambient blobs & galaxy -->
		<template
			v-for="n in 5"
			:key="n"
		>
			<div :class="`blob b${n}`" />
		</template>
		<canvas
			ref="galaxyCanvas"
			class="galaxy"
		/>

		<!-- Audio player card -->
		<div
			v-if="book"
			class="player-card"
		>
			<img
				:src="book.coverImage"
				class="cover"
				alt="cover"
			/>
			<div class="info">
				<h4 class="title">{{ book.title }}</h4>
				<p class="author">{{ book.author }}</p>
			</div>

			<audio
				v-if="audioSrc"
				ref="audio"
				:src="audioSrc"
				@loadedmetadata="onMeta"
				@timeupdate="onMeta"
			/>

			<div class="controls">
				<button
					class="play-btn"
					:disabled="!ready"
					@click="toggle"
				>
					<Play
						v-if="!playing"
						class="w-6 h-6"
					/>
					<Pause
						v-else
						class="w-6 h-6"
					/>
				</button>

				<div
					class="progress"
					@click="scrub"
				>
					<div
						class="progress__filled"
						:style="progStyle"
					/>
				</div>
				<div class="time">{{ fmt(current) }} / {{ fmt(duration) }}</div>
			</div>
		</div>

		<!-- Voice assistant -->
		<ChatBot
			v-if="book"
			:book-id="book.id"
			:timestamp="current"
		/>
	</div>
</template>

<script setup lang="ts">
import { ChevronLeft, Pause, Play } from 'lucide-vue-next'
import * as THREE from 'three'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ChatBot from '@/components/player/voice-assistant.vue'
import { getBookAudio, getBookById, type Book, type Voice } from '@/constants/books'

const route   = useRoute()
const router  = useRouter()

const bookId   = Number(route.params.id)
const voiceTag = (route.params.voice as Voice) ?? 'male'

const book     = ref<Book | null>(null)
const audioSrc = ref('')

try {
  book.value     = getBookById(bookId)
  audioSrc.value = getBookAudio(bookId, voiceTag)
} catch {
  router.back()
}

const audio   = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const ready   = ref(false)
const current = ref(0)

const duration = computed(() => audio.value?.duration ?? 0)
const progStyle = computed(() => ({
  width: duration.value ? `${(current.value/duration.value)*100}%` : '0%',
}))

function onMeta() {
  if (!audio.value) return
  current.value = audio.value.currentTime
  ready.value   = true
}
function toggle() {
  if (!ready.value || !audio.value) return
  if (audio.value.paused) {
    void audio.value.play().then(() => (playing.value = true))
  } else {
    audio.value.pause()
    playing.value = false
  }
}
function scrub(e: MouseEvent) {
  if (!audio.value || !duration.value) return
  const { left, width } = (e.currentTarget as HTMLElement).getBoundingClientRect()
  audio.value.currentTime = ((e.clientX - left) / width) * duration.value
}
function fmt(s = 0) {
  const m = Math.floor(s/60)
  const sec = Math.floor(s%60)
  return `${m}:${sec.toString().padStart(2,'0')}`
}

/* Galaxy background */
const galaxyCanvas = ref<HTMLCanvasElement|null>(null)
let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, stars: THREE.Points, frameId=0

function initGalaxy() {
  if (!galaxyCanvas.value) return
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 1, 4000)
  camera.position.z = 1000

  const geom = new THREE.BufferGeometry()
  const pos: number[] = []
  for (let i = 0; i < 8000; i++) {
    pos.push(
      THREE.MathUtils.randFloatSpread(2000),
      THREE.MathUtils.randFloatSpread(2000),
      THREE.MathUtils.randFloatSpread(2000)
    )
  }
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  stars = new THREE.Points(geom, new THREE.PointsMaterial({ color: 0xffffff, size: 1 }))
  scene.add(stars)

  renderer = new THREE.WebGLRenderer({ canvas: galaxyCanvas.value, alpha: true })
  renderer.setPixelRatio(devicePixelRatio)
  renderer.setSize(innerWidth, innerHeight)

  const animate = () => {
    frameId = requestAnimationFrame(animate)
    stars.rotation.x += 0.0003
    stars.rotation.y += 0.0002
    renderer.render(scene, camera)
  }
  animate()

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth/innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
  })
}

onMounted(initGalaxy)
onUnmounted(() => cancelAnimationFrame(frameId))
</script>

<style scoped>
.stage{@apply relative min-h-screen text-white overflow-hidden bg-gradient-to-br from-[#05000d] via-[#0a0018] to-[#140023]}
.nav-back{@apply absolute top-5 left-5 z-50 flex items-center gap-1 cursor-pointer text-purple-200 hover:text-white}

.blob{position:absolute;border-radius:50%;filter:blur(100px);opacity:.5}
.blob.b1{@apply w-[220px] h-[220px] bg-[#7328d9] top-8 left-12}
.blob.b2{@apply w-[320px] h-[320px] bg-[#a644e6] top-20 right-8}
.blob.b3{@apply w-[260px] h-[260px] bg-[#612df9] bottom-12 left-20}
.blob.b4{@apply w-[380px] h-[380px] bg-[#8e34f7] bottom-14 right-14}
.blob.b5{@apply w-[160px] h-[160px] bg-[#9933ff] bottom-44 left-56}
.galaxy{position:absolute;inset:0}

.player-card{@apply absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-8 p-10 rounded-[30px] bg-gray-900/60 backdrop-blur-lg shadow-2xl}
.cover{@apply w-52 h-52 rounded-2xl shadow-2xl object-cover}
.info{@apply text-center}
.title{@apply text-3xl font-semibold}
.author{@apply text-purple-300}
.controls{@apply w-full flex flex-col items-center gap-4}
.play-btn{@apply w-20 h-20 rounded-full flex items-center justify-center bg-purple-600 hover:bg-purple-500 transition}
.progress{@apply relative w-full h-4 rounded-full cursor-pointer bg-purple-800}
.progress__filled{@apply absolute inset-y-0 left-0 bg-purple-500 rounded-full}
.time{@apply text-base text-purple-200}
</style>
