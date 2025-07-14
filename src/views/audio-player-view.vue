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

			<div class="controls">
				<button
					class="play-btn"
					:disabled="!ready"
					@click="togglePlayback"
				>
					<Play
						v-if="!isPlaying"
						class="w-6 h-6"
					/>
					<Pause
						v-else
						class="w-6 h-6"
					/>
				</button>

				<!-- <div class="progress-container">
					<div
						class="progress"
						@click="seekAudio"
						@touchend="seekAudio"
					>
						<div
							class="progress__filled"
							:style="progressStyle"
						/>
					</div>
					<div class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
				</div> -->
			</div>
		</div>

		<!-- Voice assistant -->
		<ChatBot
			v-if="book"
			:book-id="book.id"
			:timestamp="currentTime"
		/>
	</div>
</template>

<script setup lang="ts">
import { Howl } from 'howler'
import { ChevronLeft, Pause, Play } from 'lucide-vue-next'
import * as THREE from 'three'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ChatBot from '@/components/player/voice-assistant.vue'
import { getBookAudio, getBookById, type Book, type Voice } from '@/constants/books'

const route = useRoute();
const router = useRouter();

const bookId = Number(route.params.id);
const voiceTag = (route.params.voice as Voice) ?? 'male';

const book = ref<Book | null>(null);
const audioSrc = ref('');

try {
  book.value = getBookById(bookId);
  audioSrc.value = getBookAudio(bookId, voiceTag);
} catch {
  router.back();
}

// Howler audio implementation
const sound = ref<Howl | null>(null);
const isPlaying = ref(false);
const ready = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const updateInterval = ref<number | null>(null);

// Progress bar styling
// const progressStyle = computed(() => ({
//   width: duration.value ? `${(currentTime.value / duration.value) * 100}%` : '0%',
// }));

// Initialize audio player with streaming options
function initAudio() {
  if (!audioSrc.value) return;

  // Clear any existing instance
  if (sound.value) {
    sound.value.unload();
  }

  // Create new Howl instance with streaming options for large files
  sound.value = new Howl({
    src: [audioSrc.value],
    html5: true, // Force HTML5 Audio to handle large files
    preload: true,
    format: ['mp3'],
    onload: () => {
      ready.value = true;
      duration.value = sound.value?.duration() || 0;
    },
    onplay: () => {
      isPlaying.value = true;
      startProgressUpdate();
    },
    onpause: () => {
      isPlaying.value = false;
      stopProgressUpdate();
    },
    onstop: () => {
      isPlaying.value = false;
      stopProgressUpdate();
    },
    onend: () => {
      isPlaying.value = false;
      stopProgressUpdate();
      currentTime.value = 0;
    },
    onloaderror: () => {
      console.error('Error loading audio:');
      ready.value = false;
    },
    onplayerror: () => {
      console.error('Error playing audio:');
      // Try to recover
      sound.value?.once('unlock', () => {
        sound.value?.play();
      });
    }
  });
}

// Update progress regularly when playing
function startProgressUpdate() {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }

  updateInterval.value = window.setInterval(() => {
    if (sound.value && isPlaying.value) {
      currentTime.value = sound.value.seek();
    }
  }, 100); // Update every 100ms for smooth progress
}

function stopProgressUpdate() {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
    updateInterval.value = null;
  }
}

// Toggle play/pause
function togglePlayback() {
  if (!sound.value || !ready.value) return;

  if (isPlaying.value) {
    sound.value.pause();
  } else {
    sound.value.play();
  }
}

// // Handle seeking in the progress bar
// function seekAudio(e: MouseEvent | TouchEvent) {
//   if (!sound.value || !duration.value || !ready.value) return;

//   const target = e.currentTarget as HTMLElement;
//   const { left, width } = target.getBoundingClientRect();

//   // Get clientX for both mouse and touch events
//   const clientX = e instanceof MouseEvent
//     ? e.clientX
//     : e.changedTouches[0].clientX;

//   const clickPosition = (clientX - left) / width;
//   const seekTime = clickPosition * duration.value;

//   sound.value.seek(seekTime);
//   currentTime.value = seekTime;
// }

// // Format time to MM:SS
// function formatTime(seconds = 0): string {
//   if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
//     return '0:00';
//   }

//   const hrs = Math.floor(seconds / 3600);
//   const mins = Math.floor((seconds % 3600) / 60);
//   const secs = Math.floor(seconds % 60);

//   const padded = (n: number) => n.toString().padStart(2, '0');

//   if (hrs > 0) {
//     // H:MM:SS
//     return `${hrs}:${padded(mins)}:${padded(secs)}`;
//   } else {
//     // M:SS
//     return `${mins}:${padded(secs)}`;
//   }
// }


/* Galaxy background */
const galaxyCanvas = ref<HTMLCanvasElement | null>(null);
let scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    stars: THREE.Points,
    frameId = 0;

function initGalaxy() {
  if (!galaxyCanvas.value) return;

  // Clean up existing animation if any
  if (frameId) {
    cancelAnimationFrame(frameId);
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 4000);
  camera.position.z = 1000;

  const geom = new THREE.BufferGeometry();
  const pos: number[] = [];
  for (let i = 0; i < 8000; i++) {
    pos.push(
      THREE.MathUtils.randFloatSpread(2000),
      THREE.MathUtils.randFloatSpread(2000),
      THREE.MathUtils.randFloatSpread(2000)
    );
  }
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  stars = new THREE.Points(
    geom,
    new THREE.PointsMaterial({ color: 0xffffff, size: 1 })
  );
  scene.add(stars);

  renderer = new THREE.WebGLRenderer({
    canvas: galaxyCanvas.value,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const animate = () => {
    frameId = requestAnimationFrame(animate);
    if (stars) {
      stars.rotation.x += 0.0003;
      stars.rotation.y += 0.0002;
    }
    renderer.render(scene, camera);
  };
  animate();

  // Handle window resize
  const handleResize = () => {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };

  window.addEventListener('resize', handleResize);

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}

// Lifecycle hooks
onMounted(() => {
  // Initialize galaxy background
  const cleanup = initGalaxy();

  // Initialize audio player
  initAudio();

  // Set up cleanup
  onUnmounted(() => {
    // Clean up ThreeJS
    if (frameId) {
      cancelAnimationFrame(frameId);
    }

    if (renderer) {
      renderer.dispose();
    }

    // Clean up Howler
    if (sound.value) {
      sound.value.unload();
    }

    // Clean up interval
    stopProgressUpdate();

    // Run any additional cleanup
    if (cleanup) cleanup();
  });
});

// Watch for changes in audioSrc
watch(audioSrc, () => {
  initAudio();
});
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

.player-card{@apply absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-8 p-10 rounded-[32px] bg-slate-900 border border-purple-900/30 bg-opacity-10 backdrop-blur-sm shadow-2xl}
.cover{@apply w-52 h-52 rounded-2xl shadow-2xl object-cover}
.info{@apply text-center}
.title{@apply text-3xl font-semibold}
.author{@apply text-purple-300}
.controls{@apply w-full flex flex-col items-center gap-6}
.play-btn{@apply w-20 h-20 rounded-full flex items-center justify-center bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed transition cursor-pointer}
.progress-container{@apply w-full flex flex-col gap-2}
.progress{@apply relative w-full h-5 rounded-full cursor-pointer bg-purple-800}
.progress__filled{@apply absolute inset-y-0 left-0 bg-purple-500 rounded-full transition-all duration-100}
.time{@apply text-base text-purple-200 text-center}
</style>
