<template>
	<div
		class="relative grid lg:grid-cols-2 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#1e1b4b] min-h-screen text-slate-50"
	>
		<!-- ── LEFT PANE ── -->
		<section class="flex flex-col gap-6 p-8 lg:p-10 border-white/10 border-r">
			<!-- Header -->
			<header>
				<h2 class="font-semibold text-2xl">Аудио енгізу</h2>
				<p class="text-slate-400 text-sm">Дыбысты жазыңыз немесе файл жүктеңіз</p>
			</header>

			<!-- Tabs -->
			<div class="flex gap-2">
				<button
					v-for="tab in tabs"
					:key="tab.id"
					class="flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm transition"
					:class="
            activeTab === tab.id
              ? 'bg-violet-700 text-white'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          "
				>
					<component
						:is="tab.icon"
						class="w-4 h-4"
					/>
					<span>{{ tab.label }}</span>
				</button>
			</div>

			<!-- Input card -->
			<div class="bg-slate-800/60 shadow-inner p-6 rounded-3xl">
				<!-- === Recording interface === -->
				<template v-if="activeTab === 'record'">
					<div class="flex flex-col gap-6">
						<!-- Record / stop button -->
						<button
							@click="toggleRecording"
							class="flex flex-col justify-center items-center gap-3 p-6 rounded-3xl w-full transition"
							:class="{
                'bg-violet-700 text-white': recordingState === 'idle',
                'bg-red-500  text-white': recordingState === 'recording',
                'bg-emerald-500 text-white': recordingState === 'recorded'
              }"
						>
							<div class="flex items-center gap-3">
								<component
									:is="recordingIcon"
									class="w-6 h-6"
								/>
								<span class="font-medium text-base">
									{{ recordingButtonText }}
								</span>
							</div>

							<!-- Live indicator -->
							<div
								v-if="recordingState === 'recording'"
								class="flex items-center gap-2 text-sm"
							>
								<span class="relative flex w-3 h-3">
									<span
										class="inline-flex absolute bg-white opacity-75 rounded-full w-full h-full animate-ping"
									></span>
									<span class="inline-flex relative bg-white rounded-full w-3 h-3"></span>
								</span>
								<span>Жазылуда…</span>
							</div>
						</button>

						<!-- Live bars + duration -->
						<div
							v-if="audioDuration"
							class="flex flex-col gap-3"
						>
							<div class="flex items-end gap-1 bg-black/20 p-2 rounded-3xl w-full h-20">
								<div
									v-for="(bar, i) in visualizationBars"
									:key="i"
									:style="{ height: `${bar}%` }"
									class="flex-1 bg-violet-500 rounded-[2px] transition-[height] duration-100"
								></div>
							</div>
							<span class="text-slate-400 text-sm text-right">
								{{ formatDuration(audioDuration) }}
							</span>
						</div>
					</div>
				</template>

				<!-- === Upload interface === -->
				<template v-else>
					<div class="flex flex-col gap-4">
						<label
							class="flex flex-col justify-center items-center gap-3 p-8 border-2 border-dashed rounded-3xl text-center transition cursor-pointer"
							:class="
                audioFile
                  ? 'border-violet-700 bg-violet-700/10'
                  : 'border-white/10 hover:border-violet-500/80 hover:bg-violet-500/5'
              "
						>
							<input
								type="file"
								accept="audio/*"
								class="hidden"
								@change="handleFileUpload"
							/>
							<Upload class="w-8 h-8 text-violet-500" />
							<span
								v-if="!audioFile"
								class="font-medium text-base"
							>
								Аудио файлды таңдаңыз
							</span>
							<span
								v-else
								class="font-medium text-base break-all"
							>
								{{ audioFile.name }}
							</span>
							<span
								v-if="!audioFile"
								class="text-slate-400 text-sm"
							>
								немесе файлды осы жерге апарыңыз
							</span>
						</label>

						<div
							v-if="audioFile"
							class="flex justify-between items-center text-slate-400 text-sm"
						>
							<span>{{ formatFileSize(audioFile.size) }}</span>
							<span>{{ getFileType(audioFile.name) }}</span>
							<button
								@click="clearFile"
								class="hover:bg-white/10 p-1 rounded-full transition"
							>
								<X class="w-4 h-4" />
							</button>
						</div>
					</div>
				</template>
			</div>

			<!-- Notes -->
			<div class="flex flex-col gap-4">
				<label class="font-medium text-slate-200 text-sm"> Қосымша ескертпелер </label>
				<textarea
					v-model="userNotes"
					maxlength="120"
					placeholder="Қысқаша ескертпе қалдырыңыз (макс. 120 таңба)…"
					class="bg-white/5 p-4 border border-white/10 focus:border-violet-500 rounded-3xl focus:ring-2 focus:ring-violet-500/30 w-full min-h-[100px] placeholder:text-slate-400 resize-none"
				/>
				<span class="text-slate-400 text-xs text-right"> {{ userNotes.length }}/120 </span>
			</div>

			<!-- Process -->
			<button
				@click="processAudio"
				:disabled="!hasAudioInput || isProcessing"
				class="flex justify-center items-center gap-3 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 mt-auto p-4 rounded-3xl font-medium text-white text-lg transition disabled:cursor-not-allowed"
			>
				<Loader2
					v-if="isProcessing"
					class="w-5 h-5 animate-spin"
				/>
				<span>{{ isProcessing ? 'Өңделуде…' : 'Өңдеуді бастау' }}</span>
			</button>
		</section>

		<!-- ── RIGHT PANE ── -->
		<section class="flex flex-col gap-6 p-8 lg:p-10">
			<!-- Header -->
			<header>
				<h2 class="font-semibold text-white text-2xl">Нәтижелер</h2>
				<p class="text-slate-400 text-sm">Өңделген аудио нәтижелері</p>
			</header>

			<!-- Results container -->
			<div class="flex flex-col flex-1 justify-center">
				<!-- Empty -->
				<div
					v-if="resultState === 'empty'"
					class="flex flex-col justify-center items-center gap-4 bg-white/5 p-8 border border-white/10 border-dashed rounded-3xl text-center"
				>
					<Image class="w-12 h-12 text-slate-400/80" />
					<h3 class="font-semibold text-xl">Нәтижелер жоқ</h3>
					<p class="max-w-xs text-slate-400 text-sm">
						Аудионы өңдеу үшін сол жақтағы параметрлерді орнатыңыз
					</p>
				</div>

				<!-- Processing -->
				<div
					v-if="resultState === 'processing'"
					class="flex flex-col justify-center items-center gap-6 p-8 text-center"
				>
					<Loader2 class="w-12 h-12 text-violet-700 animate-spin" />
					<h3 class="font-semibold text-xl">Аудио өңделуде</h3>
					<p class="text-slate-400 text-sm">Біраз уақыт қажет болады…</p>
					<div class="bg-white/10 rounded w-full max-w-xs h-1 overflow-hidden">
						<div
							:style="{ width: processingProgress + '%' }"
							class="bg-violet-700 h-full transition-[width] duration-300"
						></div>
					</div>
					<span class="font-medium text-violet-700 text-sm"> {{ processingProgress }}% </span>
				</div>

				<!-- Ready -->
				<div
					v-if="resultState === 'ready'"
					class="flex flex-col gap-6"
				>
					<div class="bg-black/20 rounded-3xl w-full h-[120px] overflow-hidden">
						<div
							ref="waveformElement"
							class="w-full h-full"
						></div>
					</div>

					<div class="flex items-center gap-4">
						<button
							@click="togglePlayback"
							class="flex justify-center items-center bg-violet-700 hover:bg-violet-800 rounded-full w-12 h-12 text-white transition"
						>
							<component
								:is="playbackIcon"
								class="w-6 h-6"
							/>
						</button>

						<div class="flex items-center gap-1 min-w-[80px] text-slate-400 text-sm">
							<span>{{ formatTime(currentTime) }}</span>
							<span>/</span>
							<span>{{ formatTime(totalDuration) }}</span>
						</div>

						<input
							type="range"
							:value="currentTime"
							:max="totalDuration"
							@input="handleSeek"
							class="flex-1 bg-white/10 [&::-webkit-slider-thumb]:bg-violet-700 rounded [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:w-3 h-1 [&::-webkit-slider-thumb]:h-3 appearance-none [&::-webkit-slider-thumb]:appearance-none"
						/>

						<button
							@click="downloadResult"
							class="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-3xl font-medium text-slate-50 text-sm transition"
						>
							<Download class="w-4 h-4" />
							<span>Жүктеп алу</span>
						</button>
					</div>

					<div class="flex gap-4">
						<button
							@click="saveResult"
							class="flex flex-1 justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-5 py-3 rounded-3xl font-medium text-white transition"
						>
							<Save class="w-4 h-4" />
							<span>Сақтау</span>
						</button>
						<button
							@click="processAgain"
							class="flex flex-1 justify-center items-center gap-2 bg-white/5 hover:bg-white/10 px-5 py-3 rounded-3xl font-medium text-slate-50 transition"
						>
							<RefreshCw class="w-4 h-4" />
							<span>Қайта өңдеу</span>
						</button>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import {
  Download,
  Image,
  Loader2, Mic, Pause, Play,
  RefreshCw,
  Save,
  Square, Upload, X
} from 'lucide-vue-next'
import { computed, onUnmounted, ref } from 'vue'
import WaveSurfer from 'wavesurfer.js'

// Constants
const FILE_TYPES = {
  'mp3': 'MP3 Audio',
  'wav': 'WAV Audio',
  'ogg': 'OGG Audio',
  'm4a': 'AAC Audio',
  'webm': 'WebM Audio'
}

// Tab Management
const tabs = [
  { id: 'record', label: 'Жазу', icon: Mic },
  { id: 'file', label: 'Файл', icon: Upload }
]
const activeTab = ref<'record' | 'file'>('record')

// Recording State
const recordingState = ref<'idle' | 'recording' | 'recorded'>('idle')
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<BlobPart[]>([])
const audioBlob = ref<Blob | null>(null)
const audioDuration = ref<number>(0)
const audioContext = ref<AudioContext | null>(null)
const analyser = ref<AnalyserNode | null>(null)
const visualizationBars = ref<number[]>(Array(20).fill(10))

// File Upload State
const audioFile = ref<File | null>(null)

// Notes State
const userNotes = ref<string>('')

// Processing State
const isProcessing = ref<boolean>(false)
const processingProgress = ref<number>(0)
const hasAudioInput = computed(() => audioBlob.value || audioFile.value)

// Results State
const resultState = ref<'empty' | 'processing' | 'ready'>('empty')
const resultBlob = ref<Blob | null>(null)
const waveformElement = ref<HTMLElement | null>(null)
const wavesurfer = ref<WaveSurfer | null>(null)
const isPlaying = ref<boolean>(false)
const currentTime = ref<number>(0)
const totalDuration = ref<number>(0)

// Computed Properties
const recordingButtonText = computed(() => {
  switch (recordingState.value) {
    case 'idle': return 'Жазуды бастау'
    case 'recording': return 'Жазуды тоқтату'
    case 'recorded': return 'Қайта жазу'
    default: return 'Жазу'
  }
})

const recordingIcon = computed(() => {
  return recordingState.value === 'recording' ? Square : Mic
})

const playbackIcon = computed(() => {
  return isPlaying.value ? Pause : Play
})

// Methods
const toggleRecording = async () => {
  if (recordingState.value === 'idle') {
    await startRecording()
  } else if (recordingState.value === 'recording') {
    stopRecording()
  } else {
    resetRecording()
  }
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioContext.value = new AudioContext()
    const source = audioContext.value.createMediaStreamSource(stream)

    analyser.value = audioContext.value.createAnalyser()
    analyser.value.fftSize = 32
    source.connect(analyser.value)

    mediaRecorder.value = new MediaRecorder(stream)
    audioChunks.value = []

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data)
    }

    mediaRecorder.value.onstop = () => {
      audioBlob.value = new Blob(audioChunks.value, { type: 'audio/webm' })
      calculateDuration(audioBlob.value)
    }

    mediaRecorder.value.start(100)
    recordingState.value = 'recording'
    startVisualization()
  } catch (error) {
    console.error('Recording error:', error)
    alert('Микрофонға рұқсат берілмеген немесе қолжетімсіз')
  }
}

const stopRecording = () => {
  if (mediaRecorder.value) {
    mediaRecorder.value.stop()
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
    recordingState.value = 'recorded'
    stopVisualization()
  }
}

const resetRecording = () => {
  audioBlob.value = null
  recordingState.value = 'idle'
  audioDuration.value = 0
}

const calculateDuration = (blob: Blob) => {
  const audio = new Audio()
  audio.src = URL.createObjectURL(blob)
  audio.onloadedmetadata = () => {
    audioDuration.value = audio.duration
    URL.revokeObjectURL(audio.src)
  }
}

const startVisualization = () => {
  if (!analyser.value) return

  const bufferLength = analyser.value.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const updateVisualization = () => {
    if (recordingState.value !== 'recording') return

    analyser.value!.getByteFrequencyData(dataArray)

    const bars = []
    for (let i = 0; i < 20; i++) {
      const value = dataArray[i] || 0
      bars.push(Math.min(100, Math.max(5, value / 2.55)))
    }

    visualizationBars.value = bars
    requestAnimationFrame(updateVisualization)
  }

  updateVisualization()
}

const stopVisualization = () => {
  visualizationBars.value = Array(20).fill(10)
}

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    audioFile.value = input.files[0]
    audioBlob.value = null
    recordingState.value = 'idle'

    // Calculate duration for uploaded file
    const audio = new Audio()
    audio.src = URL.createObjectURL(audioFile.value)
    audio.onloadedmetadata = () => {
      audioDuration.value = audio.duration
      URL.revokeObjectURL(audio.src)
    }
  }
}

const clearFile = () => {
  audioFile.value = null
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

const getFileType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  return FILE_TYPES[extension as keyof typeof FILE_TYPES] || 'Аудио файл'
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

const processAudio = async () => {
  if (!hasAudioInput.value) return

  resultState.value = 'processing'
  isProcessing.value = true

  // Simulate processing with progress updates
  const interval = setInterval(() => {
    processingProgress.value += Math.random() * 10
    if (processingProgress.value >= 100) {
      processingProgress.value = 100
      clearInterval(interval)
      finishProcessing()
    }
  }, 300)
}

const finishProcessing = () => {
  setTimeout(() => {
    // In a real app, this would be the actual processed audio
    resultBlob.value = audioBlob.value || new Blob([audioFile.value!])
    initWaveform()
    resultState.value = 'ready'
    isProcessing.value = false
    processingProgress.value = 0
  }, 500)
}

const initWaveform = () => {
  if (!waveformElement.value || !resultBlob.value) return

  wavesurfer.value?.destroy()

  wavesurfer.value = WaveSurfer.create({
    container: waveformElement.value,
    waveColor: '#8b5cf6',
    progressColor: '#4c1d95',
    cursorColor: '#4c1d95',
    barWidth: 2,
    barRadius: 3,
    barGap: 2,
    height: 120,
    normalize: true
  })

  wavesurfer.value.loadBlob(resultBlob.value)

  wavesurfer.value.on('ready', () => {
    totalDuration.value = wavesurfer.value?.getDuration() || 0
  })

  wavesurfer.value.on('audioprocess', () => {
    currentTime.value = wavesurfer.value?.getCurrentTime() || 0
  })

  wavesurfer.value.on('play', () => {
    isPlaying.value = true
  })

  wavesurfer.value.on('pause', () => {
    isPlaying.value = false
  })

  wavesurfer.value.on('finish', () => {
    isPlaying.value = false
  })
}

const togglePlayback = () => {
  if (wavesurfer.value) {
    wavesurfer.value.playPause()
  }
}

const handleSeek = (event: Event) => {
  const target = event.target as HTMLInputElement
  const seekTime = parseFloat(target.value)
  wavesurfer.value?.seekTo(seekTime / totalDuration.value)
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

const downloadResult = () => {
  if (!resultBlob.value) return

  const url = URL.createObjectURL(resultBlob.value)
  const a = document.createElement('a')
  a.href = url
  a.download = `processed_audio_${new Date().toISOString().slice(0, 10)}.webm`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const saveResult = () => {
  // In a real app, this would save to a database or server
  alert('Аудио сақталды (бұл демо)')
}

const processAgain = () => {
  resultState.value = 'empty'
  resultBlob.value = null
  wavesurfer.value?.destroy()
  wavesurfer.value = null
}

// Cleanup
onUnmounted(() => {
  if (mediaRecorder.value) {
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
  }
  wavesurfer.value?.destroy()
  if (audioBlob.value) {
    URL.revokeObjectURL(URL.createObjectURL(audioBlob.value))
  }
  if (resultBlob.value) {
    URL.revokeObjectURL(URL.createObjectURL(resultBlob.value))
  }
})
</script>
