<template>
	<div class="stage">
		<!-- ambient blobs -->
		<div class="blob b1"></div>
		<div class="blob b2"></div>
		<div class="blob b3"></div>
		<div class="blob b4"></div>
		<div class="blob b5"></div>

		<!-- starfield -->
		<canvas
			ref="galaxyCanvas"
			class="galaxy"
		></canvas>

		<!-- back -->
		<button
			class="btn-back"
			@click="$router.back()"
		>
			<ChevronLeft class="w-5 h-5" /> Қайту
		</button>

		<!-- PLAYER -->
		<div class="player-card">
			<!-- cover -->
			<div
				class="cover-box"
				:class="{ spin: playing }"
			>
				<img
					:src="track.cover"
					class="cover"
				/>
			</div>

			<h1 class="title">{{ track.title }}</h1>
			<h2 class="author">{{ track.author }}</h2>

			<!-- progress -->
			<div
				class="bar"
				@click="scrub"
			>
				<div
					class="bar-fill"
					:style="{ width: progress + '%' }"
				></div>
			</div>
			<div class="times">
				<span>{{ currentTime }}</span
				><span>{{ track.duration }}</span>
			</div>

			<!-- controls -->
			<div class="controls">
				<button
					class="btn-play"
					@click="toggle"
				>
					<component :is="playing ? Pause : Play" />
				</button>
			</div>

			<audio
				ref="audio"
				:src="track.src"
				preload="auto"
				@timeupdate="updateTime"
				@ended="playing = false"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ChevronLeft, Pause, Play } from 'lucide-vue-next'
import * as THREE from 'three'
import { computed, onMounted, onUnmounted, ref } from 'vue'

/* demo track */
const track = {
  title: 'Абай жолы • 1‑бөлім',
  author: 'Мұхтар Әуезов',
  src: 'https://cdn.pixabay.com/audio/2022/03/15/audio_9b578c4d8b.mp3',
  cover:
    'https://imbb.org.kz/wp-content/uploads/2020/02/b24fc64e6b2af76a016add3383cd9939.jpg',
  duration: '12:28:34'
}

/* ==== audio state ==== */
const audio = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const current = ref(0)

const progress = computed(() =>
  audio.value ? (audio.value.currentTime / audio.value.duration) * 100 : 0
)
const currentTime = computed(() =>
  new Date(current.value * 1000).toISOString().substr(11, 8)
)

function toggle() {
  if (!audio.value) return
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  playing.value ? audio.value.pause() : audio.value.play()
  playing.value = !playing.value
}
function updateTime() {
  current.value = audio.value?.currentTime ?? 0
}
function scrub(e: MouseEvent) {
  if (!audio.value) return
  const { left, width } = (e.currentTarget as HTMLElement).getBoundingClientRect()
  audio.value.currentTime = ((e.clientX - left) / width) * audio.value.duration
}

/* ==== Three starfield ==== */
const galaxyCanvas = ref<HTMLCanvasElement | null>(null)
let renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  pts: THREE.Points,
  raf: number

function initGalaxy() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000)
  camera.position.z = 100
  renderer = new THREE.WebGLRenderer({ canvas: galaxyCanvas.value!, alpha: true })
  renderer.setSize(innerWidth, innerHeight)
  renderer.setPixelRatio(devicePixelRatio)

  /* starfield geometry */
  const starN = 2000
  const g = new THREE.BufferGeometry()
  const pos = new Float32Array(starN * 3)
  const col = new Float32Array(starN * 3)
  const sizes = new Float32Array(starN)
  const twinkle = new Float32Array(starN)

  for (let i = 0; i < starN; i++) {
    // Random positions in a spherical volume
    const radius = 80 + Math.random() * 20
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    pos[i * 3 + 2] = radius * Math.cos(phi)

    // Brighter, but still soft purple-blue colors
    const c = new THREE.Color(0x555588).lerp(new THREE.Color(0x8888bb), Math.random() * 0.4)
    col[i * 3] = c.r
    col[i * 3 + 1] = c.g
    col[i * 3 + 2] = c.b

    sizes[i] = 0.8 + Math.random() * 1.2
    twinkle[i] = Math.random()
  }

  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  g.setAttribute('twinkle', new THREE.BufferAttribute(twinkle, 1))

  // Custom shader for rounded particles
  const m = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: { value: null }
    },
    vertexShader: `
      attribute float size;
      attribute float twinkle;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z) * twinkle;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 xy = gl_PointCoord - vec2(0.5);
        float dist = length(xy);
        if (dist > 0.5) discard;
        gl_FragColor = vec4(vColor, smoothstep(0.5, 0.3, dist) * 0.8);
      }
    `,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  pts = new THREE.Points(g, m)
  scene.add(pts)

  const loop = () => {
    raf = requestAnimationFrame(loop)
    // Gentle rotation
    pts.rotation.y += 0.0002
    // Twinkle effect
    const twinkleAttr = pts.geometry.attributes.twinkle
    for (let i = 0; i < starN; i++) {
      twinkleAttr.array[i] = Math.sin(Date.now() * 0.001 + i) * 0.3 + 0.7
    }
    twinkleAttr.needsUpdate = true
    renderer.render(scene, camera)
  }
  loop()
}
const resizer = () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
}

onMounted(() => {
  initGalaxy()
  window.addEventListener('resize', resizer)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  renderer.dispose()
  window.removeEventListener('resize', resizer)
})
</script>

<style scoped>
/* === stage & entrance === */
.stage {
  @apply relative flex justify-center items-center min-h-screen overflow-hidden;
  background: linear-gradient(135deg, #03000a 0%, #0a0015 45%, #120022 100%);
  animation: fadeIn 0.9s ease forwards, zoomIn 0.9s ease forwards;
}
@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}
@keyframes zoomIn {
  from { transform: scale(0.88) }
  to { transform: scale(1) }
}

/* blobs */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(160px);
  opacity: 0.15;
  mix-blend-mode: screen;
}
.b1 {
  width: 34rem;
  height: 34rem;
  top: -12%;
  left: -18%;
  background: #4c1d95;
  animation: blobMove1 26s ease-in-out infinite;
}
.b2 {
  width: 28rem;
  height: 28rem;
  bottom: -14%;
  right: -20%;
  background: #5b21b6;
  animation: blobMove2 30s ease-in-out infinite;
}
.b3 {
  width: 22rem;
  height: 22rem;
  top: 60%;
  left: 48%;
  transform: translateX(-50%);
  background: #6d28d9;
  animation: blobMove3 32s ease-in-out infinite;
}
.b4 {
  width: 30rem;
  height: 30rem;
  top: 20%;
  right: -10%;
  background: #581c87;
  animation: blobMove4 28s ease-in-out infinite;
}
.b5 {
  width: 26rem;
  height: 26rem;
  bottom: 10%;
  left: -15%;
  background: #6b21a8;
  animation: blobMove5 34s ease-in-out infinite;
}
@keyframes blobMove1 {
  50% { transform: translate(12%, 18%) scale(1.12) }
}
@keyframes blobMove2 {
  50% { transform: translate(-10%, -14%) scale(0.92) }
}
@keyframes blobMove3 {
  50% { transform: translate(-40%, -12%) scale(1.28) }
}
@keyframes blobMove4 {
  50% { transform: translate(-15%, 10%) scale(1.1) }
}
@keyframes blobMove5 {
  50% { transform: translate(10%, -10%) scale(0.95) }
}

/* canvas */
.galaxy {
  @apply z-[1] absolute inset-0 pointer-events-none;
}

/* back */
.btn-back {
  @apply top-6 left-6 z-10 fixed flex items-center gap-1 text-purple-500 transition-colors duration-300 cursor-pointer;
  border-radius: 24px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
}
.btn-back:hover { color: #fff; background: rgba(255, 255, 255, 0.08) }

/* === player card === */
.player-card {
  width: 100%;
  max-width: 560px;
  padding: 3.5rem 2.8rem 3.2rem;
  text-align: center;
  border-radius: 64px;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(40px) saturate(140%);
  box-shadow: 0 18px 70px -18px rgba(0, 0, 0, 0.8);
  z-index: 2;
  animation: slideUp 1s cubic-bezier(0.25, 0.8, 0.25, 1) 0.2s forwards;
  opacity: 0;
  transform: translateY(60px);
}
@keyframes slideUp {
  to { opacity: 1; transform: translateY(0) }
}

/* cover */
.cover-box {
  width: 220px;
  height: 220px;
  margin: 0 auto;
  border-radius: 42px;
  overflow: hidden;
  transition: transform 0.7s ease;
}
.cover-box.spin { animation: bob 8s ease-in-out infinite }
@keyframes bob {
  50% { transform: translateY(-8px) }
}
.cover { width: 100%; height: 100%; object-fit: cover }

/* typography */
.title {
  margin-top: 2rem;
  font-weight: 700;
  font-size: 32px;
  background: linear-gradient(90deg, #a21caf, #7e22ce);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.author { margin-top: 0.4rem; color: #8b5cf6; font-size: 1.05rem }

/* progress */
.bar {
  position: relative;
  height: 12px;
  margin: 2.2rem 0 0.7rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 40px;
  cursor: pointer;
}
.bar-fill {
  height: 100%;
  border-radius: 40px;
  background: linear-gradient(90deg, #7e22ce, #5b21b6);
  transition: width 0.25s linear;
}
.times {
  @apply flex justify-between text-purple-500 text-xs;
  font-size: 0.82rem;
}

/* controls */
.controls {
  @apply flex justify-center items-center gap-6 mt-8;
}
.btn-play {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at 30% 30%, #3b1677 0%);
  box-shadow: 0 0 28px rgba(139, 92, 246, 0.4);
  transition: transform 0.25s var(--easing), box-shadow 0.25s var(--easing);
}
.btn-play:hover {
  transform: scale(1.08);
  box-shadow: 0 0 32px rgba(139, 92, 246, 0.5);
}
.btn-play svg { width: 44px; height: 44px; color: #fff }

/* common easing */
:root { --easing: cubic-bezier(0.4, 0, 0.2, 1) }
</style>
