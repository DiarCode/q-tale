<template>
	<div
		class="relative flex justify-center items-center bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#1e1b4b] p-4 min-h-screen text-slate-50"
	>
		<button
			class="top-6 left-6 fixed flex items-center"
			@click="$router.back()"
		>
			<ChevronLeft class="w-5 h-5" /> Қайту
		</button>

		<div
			class="bg-slate-900/50 shadow-xl backdrop-blur-sm rounded-3xl w-full max-w-5xl overflow-hidden"
		>
			<div class="grid lg:grid-cols-2">
				<!-- LEFT PANE -->
				<section class="flex flex-col gap-6 p-8 lg:p-10 border-white/10 lg:border-r">
					<header>
						<h2 class="font-semibold text-2xl">Аудио енгізу</h2>
						<p class="text-slate-400 text-sm">Дыбысты жазып немесе файл жүктеңіз</p>
					</header>

					<!-- Tabs -->
					<div class="flex gap-2">
						<button
							v-for="tab in tabs"
							:key="tab.id"
							class="flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm transition"
							:class="activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'"
							@click="activeTab = tab.id"
						>
							<component
								:is="tab.icon"
								class="w-4 h-4"
							/>
							<span>{{ tab.label }}</span>
						</button>
					</div>

					<!-- Tale Badges -->
					<div class="flex flex-wrap gap-2">
						<button
							v-for="tale in tales"
							:key="tale.id"
							class="px-4 py-2 rounded-full font-medium text-sm transition"
							:class="selectedTale === tale.id
                ? 'bg-violet-600 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'"
							@click="selectTale(tale)"
						>
							{{ tale.name }}
						</button>
					</div>

					<!-- Input card -->
					<div class="bg-slate-800/60 shadow-inner p-6 rounded-2xl">
						<!-- Recording -->
						<template v-if="activeTab === 'record'">
							<div class="flex flex-col gap-6">
								<button
									@click="toggleRecording"
									class="flex flex-col justify-center items-center gap-3 p-6 rounded-3xl w-full transition"
									:class="{
                    'bg-violet-600 text-white hover:bg-violet-700': recordingState === 'idle',
                    'bg-red-500 text-white hover:bg-red-600': recordingState === 'recording',
                    'bg-emerald-500 text-white hover:bg-emerald-600': recordingState === 'recorded'
                  }"
								>
									<div class="flex items-center gap-3">
										<component
											:is="recordingIcon"
											class="w-6 h-6"
										/>
										<span class="font-medium text-base">{{ recordingButtonText }}</span>
									</div>
									<div
										v-if="recordingState === 'recording'"
										class="flex items-center gap-2 text-sm"
									>
										<span class="relative flex w-3 h-3">
											<span
												class="absolute bg-white opacity-75 rounded-full w-full h-full animate-ping"
											></span>
											<span class="relative bg-white rounded-full w-3 h-3"></span>
										</span>
										<span>Жазылуда…</span>
									</div>
								</button>

								<div
									v-if="recordingState === 'recorded' && recordedUrl"
									class="w-full"
								>
									<AudioPlayer :url="recordedUrl" />
								</div>
							</div>
						</template>

						<!-- File Upload -->
						<template v-else>
							<div class="flex flex-col gap-4">
								<label
									class="flex flex-col justify-center items-center gap-3 p-8 border-2 border-dashed rounded-2xl text-center transition cursor-pointer"
									:class="audioFile
                    ? 'border-violet-600 bg-violet-600/10'
                    : 'border-white/10 hover:border-violet-500/80 hover:bg-violet-500/5'"
								>
									<input
										type="file"
										accept="audio/wav"
										class="hidden"
										@change="handleFileUpload"
									/>
									<UploadIcon class="w-8 h-8 text-violet-500" />
									<span
										v-if="!audioFile"
										class="font-medium text-base"
										>WAV файл таңдаңыз</span
									>
									<span
										v-else
										class="font-medium text-base break-all"
										>{{ audioFile.name }}</span
									>
								</label>
								<div
									v-if="audioFile && fileUrl"
									class="w-full"
								>
									<AudioPlayer :url="fileUrl" />
								</div>
							</div>
						</template>
					</div>

					<!-- Text areas -->
					<div class="flex flex-col gap-2">
						<label class="font-medium text-slate-200 text-sm">Референс мәтін</label>
						<textarea
							v-model="refText"
							placeholder="Мәтінді өзгертуге болады..."
							class="bg-white/5 p-4 border border-white/10 rounded-2xl min-h-[200px] max-h-[300px]"
						/>
					</div>

					<div class="flex flex-col gap-2">
						<label class="font-medium text-slate-200 text-sm">Генерация мәтіні</label>
						<textarea
							v-model="genText"
							placeholder="Генерацияланатын мәтін..."
							class="bg-white/5 p-4 border border-white/10 rounded-2xl min-h-[200px] max-h-[300px]"
						/>
					</div>

					<!-- Process button -->
					<button
						@click="processAudio"
						:disabled="!hasAudioInput || isProcessing"
						class="flex justify-center items-center gap-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 mt-auto p-4 rounded-3xl font-medium text-white text-lg transition"
					>
						<LoaderIcon
							v-if="isProcessing"
							class="w-5 h-5 animate-spin"
						/>
						<span>{{ isProcessing ? 'Өңделуде…' : 'Өңдеуді бастау' }}</span>
					</button>
				</section>

				<!-- RIGHT PANE -->
				<section class="flex flex-col gap-6 bg-slate-900/30 p-8 lg:p-10">
					<header>
						<h2 class="font-semibold text-white text-2xl">Нәтижелер</h2>
						<p class="text-slate-400 text-sm">Өңделген аудио</p>
					</header>

					<div class="flex flex-col gap-6">
						<!-- Empty -->
						<div
							v-if="resultState === 'empty'"
							class="flex flex-col justify-center items-center gap-4 bg-white/5 p-8 border border-white/10 rounded-2xl text-center"
						>
							<MusicIcon class="w-12 h-12 text-slate-400/80" />
							<h3 class="font-semibold text-xl">Нәтиже жоқ</h3>
							<p class="text-slate-400 text-sm">Өңдеуді бастаңыз</p>
						</div>

						<!-- Processing -->
						<div
							v-if="resultState === 'processing'"
							class="flex flex-col justify-center items-center gap-6 p-8 text-center"
						>
							<LoaderIcon class="w-12 h-12 text-violet-600 animate-spin" />
							<h3 class="font-semibold text-xl">Өңделуде…</h3>
						</div>

						<!-- Ready -->
						<div
							v-if="resultState === 'ready' && resultUrl"
							class="flex flex-col gap-4 w-full"
						>
							<div class="p-4 border border-violet-600/20 rounded-2xl">
								<AudioPlayer :url="resultUrl" />
							</div>

							<div class="flex gap-4">
								<button
									@click="downloadResult"
									class="flex flex-1 justify-center items-center gap-2 bg-white/5 hover:bg-white/10 px-5 py-3 rounded-3xl font-medium text-slate-50"
								>
									<DownloadIcon class="w-4 h-4" />
									<span>Жүктеу</span>
								</button>
								<button
									@click="processAgain"
									class="flex flex-1 justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-5 py-3 rounded-3xl font-medium text-white"
								>
									<RefreshCwIcon class="w-4 h-4" />
									<span>Қайта өңдеу</span>
								</button>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import AudioPlayer from '@/components/generate/audio-player.vue'
import { useGradioService } from '@/composables/gradio.composable'
import { useRecorder, type ResultState, type TabId } from '@/composables/recorder.composable'
import { tales, type Tale } from '@/constants/literature'
import {
  ChevronLeft,
  DownloadIcon,
  LoaderIcon,
  MicIcon,
  MusicIcon,
  RefreshCwIcon,
  UploadIcon,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

// — Tabs —
const tabs = [
  { id: 'record' as TabId, label: 'Жазу', icon: MicIcon },
  { id: 'file' as TabId, label: 'Файл', icon: UploadIcon },
]
const activeTab = ref<TabId>('record')

// — Recorder / File Upload —
const {
  recordingState,
  recordedBlob,
  recordedUrl,
  recordingButtonText,
  recordingIcon,
  toggleRecording,
} = useRecorder()

const audioFile = ref<File|null>(null)
const fileUrl = computed<string|undefined>(
  () => audioFile.value ? URL.createObjectURL(audioFile.value) : undefined
)
watch(fileUrl, (old, prev) => prev && URL.revokeObjectURL(prev))
function handleFileUpload(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f && f.type === 'audio/wav') audioFile.value = f
  else alert('Тек WAV формат!')
}

// — Tale selection —
const selectedTale = ref<string|null>(null)
const refText = ref('Әдепкі референс мәтін...')
const genText = ref('Әдепкі генерация мәтіні...')
function selectTale(t: Tale) {
  selectedTale.value = t.id
  refText.value = t.ref
  genText.value = t.gen
}

// — Gradio processing —
const { submitToGradio, isServiceProcessing } = useGradioService()
const isProcessing = computed(() => isServiceProcessing.value)
const hasAudioInput = computed(() => !!recordedBlob.value || !!audioFile.value)
const resultState = ref<ResultState>('empty')
const resultUrl = ref<string|null>(null)

async function processAudio() {
  if (!hasAudioInput.value) return
  resultState.value = 'processing'
  try {
    const audio = recordedBlob.value || audioFile.value!
    resultUrl.value = await submitToGradio({
      ref_audio_file: audio,
      ref_text: refText.value,
      gen_text: genText.value,
    })
    resultState.value = 'ready'
  } catch {
    alert('Қате орын алды')
    resultState.value = 'empty'
  }
}
function downloadResult() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = `voice_clone_${new Date().toISOString().slice(0,10)}.wav`
  a.click()
}
function processAgain() {
  resultState.value = 'empty'
  resultUrl.value = null
}
</script>

<style scoped>
textarea {
  resize: vertical;
}
</style>
