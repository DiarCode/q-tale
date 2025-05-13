<template>
	<div
		class="relative bg-gradient-to-br from-[#05000d] via-[#0a0018] to-[#140023] min-h-screen overflow-hidden text-white"
	>
		<!-- BACKDROP -->
		<img
			:src="book.coverImage"
			alt=""
			class="fixed inset-0 opacity-20 blur-xl w-full h-full object-cover scale-110 pointer-events-none select-none"
		/>

		<!-- BACK BUTTON -->
		<nav class="top-6 left-6 z-30 absolute">
			<button
				@click="router.back()"
				class="flex items-center text-purple-300 hover:text-white transition"
			>
				<ChevronLeft class="mr-1 w-6 h-6" /> Қайту
			</button>
		</nav>

		<!-- MAIN CONTENT -->
		<div
			class="z-20 relative flex md:flex-row flex-col items-center md:items-start gap-16 mx-auto px-6 md:px-16 pt-32 pb-20 max-w-7xl"
		>
			<!-- COVER DISPLAY -->
			<div
				ref="coverContainer"
				@mousemove="tiltCover"
				@mouseleave="resetCover"
				class="relative w-64 md:w-80 lg:w-96 h-[28rem] perspective shrink-0 fade-in-up"
			>
				<div class="absolute inset-0 bg-purple-900/50 blur-2xl rounded-[36px] halo"></div>
				<img
					:src="book.coverImage"
					alt="cover"
					class="relative shadow-2xl rounded-[36px] w-full h-full object-cover transition-transform duration-500 book-cover"
				/>
			</div>

			<!-- DETAILS & ACTIONS -->
			<div class="flex flex-col flex-1 justify-center delay-200 fade-in-up">
				<h1 class="mb-4 font-extrabold text-4xl lg:text-5xl xl:text-6xl gradient-text">
					{{ book.title }}
				</h1>
				<h2 class="mb-8 text-purple-300 text-2xl">{{ book.author }}</h2>

				<ul class="gap-x-8 gap-y-4 grid grid-cols-2 lg:grid-cols-4 mb-10 text-purple-400 text-lg">
					<li class="flex flex-col"><span class="meta-label">Жанр</span> {{ book.genre }}</li>
					<li class="flex flex-col">
						<span class="meta-label">Бөлімдер</span> {{ book.chapters }}
					</li>
					<li class="flex flex-col">
						<span class="meta-label">Ұзақтығы</span> {{ book.duration }}
					</li>
					<li class="flex flex-col"><span class="meta-label">Шыққан жылы</span> {{ book.year }}</li>
				</ul>

				<p class="mb-12 max-w-prose text-purple-200 text-xl leading-relaxed">
					{{ book.description }}
				</p>

				<!-- VOICE SELECTOR & PLAY -->
				<div class="flex items-center gap-4">
					<button
						class="btn-play"
						:disabled="!book"
						@click="startPlayback"
					>
						<Play class="mr-4 w-5 h-5" /> Тыңдауды бастау
					</button>

					<div class="custom-select-container">
						<div
							class="custom-select"
							:class="{ active: isDropdownOpen }"
							@click="toggleDropdown"
							ref="selectButton"
						>
							<span class="voice-name">{{ selectedVoice.name }}</span>
							<ChevronDown
								class="ml-4 w-5 h-5 dropdown-icon"
								:class="{ rotated: isDropdownOpen }"
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
										class="voice-option"
										:class="{ selected: selectedVoice.id === voice.id }"
										@click="selectVoice(voice)"
									>
										<div class="voice-details">
											<span class="option-name">{{ voice.name }}</span>
											<span class="option-meta"> {{ voice.gender }} · {{ voice.language }} </span>
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
import { ChevronDown, ChevronLeft, Play } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getBookById, type Book, type Voice } from '@/constants/books'

// ——————————————————————————————————————————————
// ROUTER + CURRENT BOOK
// ——————————————————————————————————————————————
const route  = useRoute()
const router = useRouter()

// parse the :id param (e.g. /books/3)
const bookId = Number(route.params.id)
if (isNaN(bookId)) {
  router.replace('/')  // fallback if someone types bad URL
}

const book = reactive<Book>(getBookById(bookId))

// ——————————————————————————————————————————————
// VOICE SELECTION
// ——————————————————————————————————————————————
interface Narrator {
  id: string
  name: string
  gender: string  // 'Ер' | 'Әйел'
  language: string
  tag: Voice  // 'male' | 'female'
}

const voices = reactive<Narrator[]>([
  {
    id: 'aliya',
    name: 'Әлия',
    gender: 'Әйел',
    language: 'Қазақша',
    tag: 'female',
  },
  {
    id: 'kanat',
    name: 'Қанат',
    gender: 'Ер',
    language: 'Қазақша',
    tag: 'male',
  },
])

const selectedVoice  = ref<Narrator>(voices[0])
const isDropdownOpen = ref(false)
const dropdownMenu   = ref<HTMLElement|null>(null)
const selectButton   = ref<HTMLElement|null>(null)

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}
function selectVoice(v: Narrator) {
  selectedVoice.value = v
  isDropdownOpen.value = false
}

// close when clicking outside
function onClickOutside(e: MouseEvent) {
  if (!isDropdownOpen.value) return
  const path = e.composedPath()
  if (
    dropdownMenu.value && path.includes(dropdownMenu.value) ||
    selectButton.value && path.includes(selectButton.value)
  ) return
  isDropdownOpen.value = false
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

// ——————————————————————————————————————————————
// COVER TILT EFFECT
// ——————————————————————————————————————————————
const coverContainer = ref<HTMLElement|null>(null)
function tiltCover(e: MouseEvent) {
  if (!coverContainer.value) return
  const r = coverContainer.value.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width  - 0.5
  const y = (e.clientY - r.top)  / r.height - 0.5
  const img = coverContainer.value.querySelector<HTMLImageElement>('.book-cover')
  if (img) {
    img.style.transform = `rotateY(${x*12}deg) rotateX(${-y*12}deg) scale(1.05)`
  }
}
function resetCover() {
  const img = coverContainer.value?.querySelector<HTMLImageElement>('.book-cover')
  if (img) img.style.transform = 'rotateY(0) rotateX(0) scale(1)'
}

// ——————————————————————————————————————————————
// NAVIGATE TO PLAYER
// ——————————————————————————————————————————————
function startPlayback() {
  // e.g. /player/3/female
  router.push({ path: `/player/${book.id}/${selectedVoice.value.tag}` })
}
</script>

<style scoped>
/* gradient text */
.gradient-text {
  @apply bg-clip-text bg-gradient-to-br from-purple-500 to-pink-500 text-transparent;
}

/* halo pulse */
.halo {
  animation: pulseSlow 8s ease-in-out infinite;
}
@keyframes pulseSlow {
  0%,100% { transform: scale(1); opacity: 0.35; }
  50%     { transform: scale(1.08); opacity: 0.6; }
}

/* play button */
.btn-play {
  @apply inline-flex items-center bg-gradient-to-r from-fuchsia-600 to-purple-600
        px-8 py-4 rounded-full font-semibold text-white text-xl shadow-lg
        transition-transform duration-300 hover:scale-105;
}
.btn-play:hover { transform: scale(1.05); }

/* label styling */
.meta-label { font-weight: 600; color: #d8b4fe; }

/* fade-in up animation */
.fade-in-up {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeUp 0.9s cubic-bezier(.25,.8,.25,1) forwards;
}
@keyframes fadeUp { to { opacity:1; transform:translateY(0); } }

/* custom select */
.custom-select-container { position: relative; width: 12rem; }
.custom-select {
  display: flex; align-items:center; justify-content:space-between;
  background: rgba(76,29,149,0.3); border:1px solid rgba(168,85,247,0.3);
  padding: .75rem 1rem; border-radius:9999px; cursor:pointer;
  transition: background .3s, border-color .3s, box-shadow .3s;
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
.dropdown-icon.rotated { transform: rotate(180deg); }
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
.voice-option:hover { background:rgba(168,85,247,0.2); }
.voice-option.selected { background:rgba(168,85,247,0.3); }
.voice-details { flex:1; }
.option-name { font-weight:500; color:#fff; }
.option-meta { font-size:.75rem; color:#d8b4fe; }

/* dropdown animation */
.dropdown-enter-active, .dropdown-leave-active {
  transition: all .2s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0; transform: translateY(-10px);
}

/* perspective container */
.perspective { perspective:1200px; }
.book-cover { backface-visibility:hidden; }
</style>
