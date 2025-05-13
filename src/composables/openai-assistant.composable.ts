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
	const apiKey = import.meta.env.VITE_OPENAI_API_KEY!
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
	let recorder: MediaRecorder
	let chunks: Blob[] = []
	let uid = 0

	onMounted(async () => {
		// load transcript if exists
		try {
			const resp = await fetch(`/transcripts/${rawBookId}.json`)
			transcriptSegs.value = await resp.json()
		} catch {
			transcriptSegs.value = []
		}

		// mic setup
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
		recorder.ondataavailable = e => chunks.push(e.data)
		recorder.onstop = handleRecordingStop
	})

	onUnmounted(() => recorder?.stream.getTracks().forEach(t => t.stop()))

	function start() {
		error.value = null
		chunks = []
		recorder.start()
		isRecording.value = true
		assistantState.value = 'listening'
	}
	function stop() {
		if (recorder.state === 'recording') recorder.stop()
	}

	// pipeline
	async function handleRecordingStop() {
		isRecording.value = false
		assistantState.value = 'thinking'

		// 3-A) Whisper via SDK
		let userText: string
		try {
			const audioBlob = new Blob(chunks, { type: chunks[0].type })
			const file = new File([audioBlob], 'user.webm', {
				type: audioBlob.type,
				lastModified: Date.now(),
			})
			const resp = await openai.audio.transcriptions.create({
				file,
				model: 'whisper-1',
				prompt: 'Өтінемін, тек қазақ тілінде транскрипциялаңыз.',
				response_format: 'json',
			})
			const text = resp.text
			userText = text.trim()
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			error.value = e.message || 'Транскрипция қатесі'
			assistantState.value = 'idle'
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
			const res = await chat.invoke([sys, new HumanMessage(userText)])
			aiText = res.text.trim()
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			error.value = e.message || 'Чат қатесі'
			assistantState.value = 'idle'
			return
		}

		// 3-D) TTS + push bubble together
		assistantState.value = 'speaking'
		try {
			const speech = await openai.audio.speech.create({
				model: 'tts-1',
				voice: 'shimmer',
				input: aiText,
			})
			const buf = await speech.arrayBuffer()
			const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }))

			messages.push({
				id: ++uid,
				sender: 'ai',
				text: aiText,
				audioUrl: url,
			})

			const p = new Audio(url)
			p.onended = () => (assistantState.value = 'idle')
			await p.play()
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			error.value = e.message || 'TTS қатесі'
			assistantState.value = 'idle'
		}
	}

	return { messages, assistantState, isRecording, error, start, stop }
}
