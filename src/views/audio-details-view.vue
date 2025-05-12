<template>
	<div
		class="relative bg-gradient-to-br from-[#05000d] via-[#0a0018] to-[#140023] min-h-screen overflow-hidden text-white"
	>
		<!-- blurred hero backdrop -->
		<img
			:src="book.coverImage"
			alt=""
			class="fixed inset-0 opacity-20 blur-xl w-full h-full object-cover scale-110 pointer-events-none select-none"
		/>

		<!-- Back button -->
		<nav class="top-6 left-6 z-30 absolute">
			<button
				@click="$router.back()"
				class="flex items-center text-purple-300 hover:text-white transition"
			>
				<ChevronLeft class="mr-1 w-6 h-6" /> Қайту
			</button>
		</nav>

		<!-- MAIN LAYOUT -->
		<div
			class="z-20 relative flex md:flex-row flex-col items-center md:items-start gap-16 mx-auto px-6 md:px-16 pt-32 pb-20 max-w-7xl"
		>
			<!-- Cover left -->
			<div
				ref="coverContainer"
				@mousemove="tiltCover"
				@mouseleave="resetCover"
				class="relative w-64 md:w-80 lg:w-96 h-[28rem] cover-container perspective shrink-0 fade-in-up"
			>
				<div class="absolute inset-0 bg-purple-900/50 blur-2xl rounded-[36px] halo"></div>
				<img
					:src="book.coverImage"
					alt="cover"
					class="relative shadow-2xl rounded-[36px] w-full h-full object-cover transition-transform duration-500 book-cover"
				/>
			</div>

			<!-- Details right -->
			<div class="flex flex-col flex-1 justify-center delay-200 fade-in-up">
				<h1 class="mb-4 font-extrabold text-4xl lg:text-5xl xl:text-6xl gradient-text">
					{{ book.title }}
				</h1>
				<h2 class="mb-8 text-purple-300 text-2xl">{{ book.author }}</h2>

				<ul class="gap-x-8 gap-y-4 grid grid-cols-2 lg:grid-cols-4 mb-10 text-purple-400 text-lg">
					<li class="flex flex-col items-start">
						<span class="meta-label">Жанр</span> {{ book.genre }}
					</li>
					<li class="flex flex-col items-start">
						<span class="meta-label">Бөлімдер</span> {{ book.chapters }}
					</li>
					<li class="flex flex-col items-start">
						<span class="meta-label">Ұзақтығы</span> {{ book.duration }}
					</li>
					<li class="flex flex-col items-start">
						<span class="meta-label">Шыққан жылы</span> {{ book.releaseDate }}
					</li>
				</ul>

				<p class="mb-12 max-w-prose text-purple-200 text-xl leading-relaxed">
					{{ book.description }}
				</p>

				<!-- Voice selector section -->

				<div class="flex items-center gap-4">
					<button
						class="self-start btn-play"
						@click="$router.push(`/${book.title.split(' ').join('_')}/play`)"
					>
						<Play class="mr-4 w-5 h-5" /> Тыңдауды бастау
					</button>

					<div class="custom-select-container">
						<div
							class="custom-select"
							@click="toggleDropdown"
							:class="{ 'active': isDropdownOpen }"
							ref="selectButton"
						>
							<div class="selected-option">
								<span class="voice-name">{{ selectedVoice.name }}</span>
							</div>
							<ChevronDown
								class="ml-4 w-5 h-5 dropdown-icon"
								:class="{ 'rotated': isDropdownOpen }"
							/>
						</div>

						<Transition name="dropdown">
							<div
								v-if="isDropdownOpen"
								class="dropdown-menu"
								ref="dropdownMenu"
							>
								<div class="voice-list">
									<div
										v-for="voice in voices"
										:key="voice.id"
										@click="selectVoice(voice)"
										class="voice-option"
										:class="{ 'selected': selectedVoice.id === voice.id }"
									>
										<div class="voice-details">
											<span class="option-name">{{ voice.name }}</span>
											<span class="option-meta">{{ voice.gender }} · {{ voice.language }}</span>
										</div>
									</div>
								</div>
							</div>
						</Transition>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
  ChevronDown,
  ChevronLeft,
  Play
} from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'

interface Book {
  title: string
  author: string
  coverImage: string
  genre: string
  chapters: number
  duration: string
  releaseDate: string
  description: string
}

interface Voice {
  id: string
  name: string
  type: string
  gender: string
  language: string
}

/* book stub */
const book = reactive<Book>({
  title: 'Абай жолы',
  author: 'Мұхтар Әуезов',
  coverImage:
    'https://imbb.org.kz/wp-content/uploads/2020/02/b24fc64e6b2af76a016add3383cd9939.jpg',
  genre: 'Роман-эпопея',
  chapters: 12,
  duration: '12 сағат 28 мин',
  releaseDate: '1942',
  description:
    '«Абай жолы» – Мұхтар Әуезовтің қазақ әдебиетіндегі ең алып эпосы. Роман XIX ғасырдағы қазақ өмірін, рухани дүниесін терең әрі шынайы бейнелейді.'
})

/* Voice selector implementation */
const voices = reactive<Voice[]>([
  {
    id: 'aliya',
    name: 'Әлия',
    type: 'Кәсіби диктор',
    gender: 'Әйел',
    language: 'Қазақша'
  },
  {
    id: 'kanat',
    name: 'Қанат',
    type: 'Кәсіби диктор',
    gender: 'Ер',
    language: 'Қазақша'
  }
])

const selectedVoice = ref<Voice>(voices[0])
const isDropdownOpen = ref<boolean>(false)
const dropdownMenu = ref<HTMLElement | null>(null)
const selectButton = ref<HTMLElement | null>(null)

function toggleDropdown(): void {
  isDropdownOpen.value = !isDropdownOpen.value
}

function selectVoice(voice: Voice): void {
  selectedVoice.value = voice
  isDropdownOpen.value = false
}

// Fixed click outside handler
function handleClickOutside(event: MouseEvent): void {
  // Early return if dropdown is not open
  if (!isDropdownOpen.value) return

  const path = event.composedPath();

  // Check if click was inside the dropdown or the select button
  if (
    (dropdownMenu.value && path.includes(dropdownMenu.value)) ||
    (selectButton.value && path.includes(selectButton.value))
  ) {
    // Click was inside our elements, do nothing
    return;
  }

  // Click was outside, close the dropdown
  isDropdownOpen.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

/* 3-D tilt */
const coverContainer = ref<HTMLElement | null>(null)
function tiltCover(e: MouseEvent): void {
  if (!coverContainer.value) return
  const rect = coverContainer.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  const img = coverContainer.value.querySelector<HTMLImageElement>('.book-cover')
  if (img) {
    img.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.05)`
  }
}

function resetCover(): void {
  const img = coverContainer.value?.querySelector<HTMLImageElement>('.book-cover')
  if (img) {
    img.style.transform = 'rotateY(0) rotateX(0) scale(1)'
  }
}
</script>

<style scoped>
/* gradient text */
.gradient-text {
  @apply bg-clip-text bg-gradient-to-br from-purple-500 to-pink-500 text-transparent;
}

/* halo */
.halo {
  animation: pulseSlow 8s ease-in-out infinite;
}
@keyframes pulseSlow {
  0%,100% { transform: scale(1); opacity: 0.35; }
  50%    { transform: scale(1.08); opacity: 0.6; }
}

/* play btn */
.btn-play {
  @apply inline-flex items-center bg-gradient-to-r from-fuchsia-600 to-purple-600
        px-8 py-4 rounded-full font-semibold text-white text-xl shadow-lg
        transition-transform duration-300 hover:scale-105;
}

/* label */
.meta-label {
  @apply font-semibold text-purple-300;
}

/* fade-in */
.fade-in-up {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeUp 0.9s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
}
@keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

/* delays */
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }

/* perspective */
.perspective { perspective: 1200px; }

/* Custom Select Styling */
.custom-select-container {
  @apply relative mb-6 w-full max-w-[12rem];
}

.custom-select {
  @apply flex items-center justify-between bg-purple-900/30 border border-purple-500/30
         px-6 py-5 rounded-full cursor-pointer transition-all duration-300;
}

.custom-select:hover {
  @apply bg-purple-800/40 border-purple-400/50;
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.15);
}

.custom-select.active {
  @apply bg-purple-800/60 border-purple-400;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
}

.selected-option {
  @apply flex items-center gap-3;
}

.voice-name {
  @apply font-medium text-white;
}

.voice-type {
  @apply ml-2 text-purple-300 text-sm;
}

.dropdown-icon {
  @apply text-purple-300 transition-transform duration-300;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  @apply absolute top-full left-0 right-0 mt-2  bg-purple-900
         border border-purple-500/40 rounded-2xl z-10 shadow-xl;
  overflow-y: auto;
}

.voice-option {
  @apply flex items-center px-4 py-2 hover:bg-purple-800/40 cursor-pointer transition-colors duration-200;
}

.voice-option.selected {
  @apply bg-purple-700/50;
}

.voice-details {
  @apply flex-1;
}

.option-name {
  @apply block font-medium text-white;
}

.option-meta {
  @apply block text-purple-300 text-xs;
}

.preview-btn {
  @apply p-2 text-purple-300 hover:text-white transition-colors duration-200;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Modal styling */
.modal-overlay {
  @apply fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center;
}

.modal-container {
  @apply bg-gradient-to-br from-purple-900/90 to-indigo-900/90 rounded-xl
         shadow-2xl w-full max-w-lg border border-purple-500/30;
  animation: modalSlideIn 0.3s ease-out forwards;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-purple-700/50;
}

.close-btn {
  @apply text-purple-300 hover:text-white transition-colors duration-200;
}

.modal-body {
  @apply px-6 py-4;
}

.modal-footer {
  @apply flex justify-end gap-4 px-6 py-4 border-t border-purple-700/50;
}

.form-section {
  @apply mb-6;
}

.form-section label {
  @apply block mb-2 font-medium text-purple-200;
}

.tab-container {
  @apply flex border border-purple-700 rounded-lg overflow-hidden;
}

.tab-btn {
  @apply flex items-center justify-center py-2 px-4 flex-1 text-purple-300
         transition-colors duration-200;
}

.tab-btn.active {
  @apply bg-purple-700 text-white;
}

.file-upload {
  @apply flex items-center border border-purple-700/50 rounded-lg overflow-hidden;
}

.upload-btn {
  @apply flex items-center bg-purple-800/60 py-2 px-4 cursor-pointer
         hover:bg-purple-700 transition-colors duration-200;
}

.file-name {
  @apply px-4 text-purple-300 text-sm truncate;
}

.ai-voice-controls {
  @apply space-y-4;
}

.form-row {
  @apply flex items-center;
}

.form-row label {
  @apply mb-0 w-24;
}

.radio-group {
  @apply flex gap-4;
}

.radio-option {
  @apply flex items-center cursor-pointer;
}

.radio-option input {
  @apply mr-2;
}

.range-slider {
  @apply flex flex-1 items-center gap-4;
}

.slider {
  @apply flex-1 bg-purple-800 rounded-lg h-2 appearance-none cursor-pointer;
}

.range-value {
  @apply w-20 text-purple-300 text-sm;
}

.text-input {
  @apply w-full py-2 px-4 bg-purple-800/40 border border-purple-700/50 rounded-lg
         text-white placeholder:text-purple-400 focus:border-purple-500 outline-none;
}

.cancel-btn {
  @apply px-4 py-2 text-purple-300 hover:text-white transition-colors duration-200;
}

.save-btn {
  @apply flex items-center py-2 px-4 bg-gradient-to-r from-fuchsia-600 to-purple-600
         text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/20
         transition-all duration-200;
}

/* Preview toast */
.preview-toast {
  @apply fixed bottom-6 left-1/2 transform -translate-x-1/2
         bg-purple-900/80 backdrop-blur-md py-2 px-4 rounded-full
         flex items-center shadow-lg border border-purple-500/30;
}

.preview-waveform {
  @apply flex items-end gap-0.5 mr-3 h-6;
}

.waveform-bar {
  @apply bg-fuchsia-500 rounded-full w-1;
  height: 70%;
  animation: soundWave 0.8s ease-in-out infinite alternate;
  animation-delay: calc(var(--index, 0) * 0.1s);
}

.waveform-bar:nth-child(1) { --index: 1; }
.waveform-bar:nth-child(2) { --index: 2; }
.waveform-bar:nth-child(3) { --index: 3; }
.waveform-bar:nth-child(4) { --index: 4; }
.waveform-bar:nth-child(5) { --index: 5; }

@keyframes soundWave {
  0% { height: 30%; }
  100% { height: 100%; }
}

.preview-voice-name {
  @apply mr-4 text-white;
}

.stop-preview-btn {
  @apply p-1 rounded-full bg-purple-800/60 text-purple-300
         hover:bg-purple-700 hover:text-white transition-colors duration-200;
}

/* Toast animation */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
