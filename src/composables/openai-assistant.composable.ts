// src/composables/useBookAssistant.ts
import { getBookById } from '@/constants/books'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import OpenAI from 'openai'
import { onMounted, onUnmounted, reactive, ref } from 'vue'

interface ChatMsg {
	id: number
	sender: 'user' | 'ai'
	text: string
	audioUrl?: string
}

/** Parse "X сағат Y мин" → seconds */
function parseDuration(dur: string): number {
	const h = +(dur.match(/(\d+)\s*сағат/)?.[1] || 0)
	const m = +(dur.match(/(\d+)\s*мин/)?.[1] || 0)
	return h * 3600 + m * 60
}

/**
 * @param rawBookId   – Book.id
 * @param getPosition – returns current playback time in seconds
 */
export function useBookAssistant(rawBookId: number, getPosition: () => number) {
	// 1) OpenAI clients
	const apiKey = import.meta.env.VITE_OPENAI_API_KEY ?? ''
	const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
	const chat = new ChatOpenAI({
		openAIApiKey: apiKey,
		modelName: 'gpt-4o-mini',
	})

	const book = getBookById(rawBookId)
	const totalSec = parseDuration(book.duration)
	const transcriptSegs = ref<string[]>([])

	// 2) State
	const messages = reactive<ChatMsg[]>([])
	const assistantState = ref<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
	const isRecording = ref(false)
	const error = ref<string | null>(null)
	let recorder: MediaRecorder | null = null
	let chunks: Blob[] = []
	let uid = 0

	// New: Abort controllers and audio instance for stopping
	let currentWhisperController: AbortController | null = null
	let currentChatController: AbortController | null = null
	let currentTTSController: AbortController | null = null
	let currentAudioPlayer: HTMLAudioElement | null = null

	// Function to stop all ongoing processes
	function stopAssistantProcess() {
		// Stop recording if active
		if (recorder && recorder.state === 'recording') {
			recorder.stop()
		}
		isRecording.value = false // Ensure recording state is reset

		// Abort any ongoing API calls
		currentWhisperController?.abort()
		currentChatController?.abort()
		currentTTSController?.abort()

		// Stop audio playback
		if (currentAudioPlayer) {
			currentAudioPlayer.pause()
			currentAudioPlayer.currentTime = 0
			currentAudioPlayer = null
		}

		// Reset state and error
		assistantState.value = 'idle'
		error.value = null // Clear error on explicit stop
	}

	onMounted(async () => {
		// load transcript if exists
		try {
			const resp = await fetch(`/transcripts/${rawBookId}.json`)
			transcriptSegs.value = await resp.json()
		} catch {
			transcriptSegs.value = []
		}

		// mic setup
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
			recorder.ondataavailable = e => chunks.push(e.data)
			recorder.onstop = handleRecordingStop
		} catch (e) {
			error.value = 'Microphone access denied or error.'
			assistantState.value = 'idle'
		}
	})

	onUnmounted(() => {
		recorder?.stream.getTracks().forEach(t => t.stop())
		stopAssistantProcess() // Ensure everything is stopped on unmount
	})

	function start() {
		error.value = null
		chunks = []
		if (recorder) {
			recorder.start()
			isRecording.value = true
			assistantState.value = 'listening'
		} else {
			error.value = 'Microphone not initialized.'
			assistantState.value = 'idle'
		}
	}

	function stopRecording() {
		if (recorder && recorder.state === 'recording') {
			recorder.stop()
		}
	}

	// pipeline
	async function handleRecordingStop() {
		isRecording.value = false
		assistantState.value = 'thinking'

		// 3-A) Whisper via SDK
		let userText: string
		currentWhisperController = new AbortController() // Create new controller
		try {
			const audioBlob = new Blob(chunks, { type: chunks[0].type })
			const file = new File([audioBlob], 'user.webm', {
				type: audioBlob.type,
				lastModified: Date.now(),
			})
			const resp = await openai.audio.transcriptions.create(
				{
					file,
					model: 'whisper-1',
					prompt: 'Өтінемін, тек қазақ тілінде транскрипциялаңыз.',
					response_format: 'json',
				},
				{ signal: currentWhisperController.signal },
			) // Pass signal
			userText = resp.text.trim()
			currentWhisperController = null // Clear controller on success
		} catch (e) {
			console.log('Whisper transcription aborted.')
			error.value = 'Транскрипция қатесі'

			assistantState.value = 'idle'
			currentWhisperController = null // Clear controller
			return
		}
		messages.push({ id: ++uid, sender: 'user', text: userText })

		// 3-B) context snippet
		const now = getPosition()
		let snippet = ''
		if (transcriptSegs.value.length && totalSec) {
			const idx = Math.floor((now / totalSec) * transcriptSegs.value.length)
			snippet = transcriptSegs.value[idx] || ''
		}

		// 3-C) Chat prompt
		let aiText: string
		currentChatController = new AbortController() // Create new controller
		try {
			const sys = new SystemMessage(
				`
Сіз аудиокітап көмекшісіз. Мына деректер – шынайы:
• Атау: ${book.title}
• Автор: ${book.author}
• Жанр: ${book.genre}
• Шыққан жылы: ${book.year}
• Ұзақтығы: ${book.duration}
Пайдаланушы аудионы ${Math.floor(now)} секундта тоқтатты.
Мәтін үзіндісі:
"${snippet}"
Сұрақ осы кітапқа немесе үзіндіге қатысты болуы тиіс.
Жауапты қазақша беріңіз.
        `.trim(),
			)
			// Langchain needs custom handling for abort signal with OpenAI SDK
			// Using .withCallbacks to pass the signal
			const res = await chat.invoke([sys, new HumanMessage(userText)], {
				signal: currentChatController.signal,
			})
			aiText = res.text.trim()
			currentChatController = null // Clear controller on success
		} catch (e) {
			console.log('Chat invocation aborted.')
			error.value = 'Чат қатесі'
			assistantState.value = 'idle'
			currentChatController = null // Clear controller
			return
		}

		// 3-D) TTS + push bubble together
		assistantState.value = 'speaking'
		currentTTSController = new AbortController() // Create new controller
		try {
			const speech = await openai.audio.speech.create(
				{
					model: 'tts-1',
					voice: 'shimmer',
					input: aiText,
				},
				{ signal: currentTTSController.signal },
			) // Pass signal
			const buf = await speech.arrayBuffer()
			const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }))

			messages.push({
				id: ++uid,
				sender: 'ai',
				text: aiText,
				audioUrl: url,
			})

			currentAudioPlayer = new Audio(url) // Store reference to audio player
			currentAudioPlayer.onended = () => {
				assistantState.value = 'idle'
				currentAudioPlayer = null // Clear player reference
				currentTTSController = null // Clear controller
			}
			await currentAudioPlayer.play()
		} catch (e) {
			console.log('TTS aborted.')
			error.value = 'TTS қатесі'

			assistantState.value = 'idle'
			currentAudioPlayer = null // Clear player reference
			currentTTSController = null // Clear controller
		}
	}

	return {
		messages,
		assistantState,
		isRecording,
		error,
		start,
		stopRecording,
		stopAssistantProcess,
	}
}
