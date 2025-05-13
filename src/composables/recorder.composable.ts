export type RecordingState = 'idle' | 'recording' | 'recorded'
export type ResultState = 'empty' | 'processing' | 'ready'
export type TabId = 'record' | 'file'

import { Mic, Square } from 'lucide-vue-next'
import RecordRTC, { StereoAudioRecorder } from 'recordrtc'
import { computed, ref } from 'vue'

export function useRecorder() {
	const recordingState = ref<RecordingState>('idle')
	const recorder = ref<RecordRTC | null>(null)
	const micStream = ref<MediaStream | null>(null)
	const recordedBlob = ref<Blob | null>(null)

	const recordedUrl = computed<string | undefined>(() =>
		recordedBlob.value ? URL.createObjectURL(recordedBlob.value) : undefined,
	)

	const recordingButtonText = computed(
		() =>
			({
				idle: 'Жазуды бастау',
				recording: 'Тоқтату',
				recorded: 'Қайта жазу',
			})[recordingState.value],
	)

	const recordingIcon = computed(() => (recordingState.value === 'recording' ? Square : Mic))

	async function startRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			micStream.value = stream
			recorder.value = new RecordRTC(stream, {
				type: 'audio',
				mimeType: 'audio/wav',
				recorderType: StereoAudioRecorder,
			})
			recorder.value.startRecording()
			recordingState.value = 'recording'
		} catch (err) {
			console.error('Recording error:', err)
			alert('Микрофонға қолжетімділік жоқ')
		}
	}

	function stopRecording() {
		if (!recorder.value) return
		recorder.value.stopRecording(() => {
			const blob = recorder.value!.getBlob()
			recordedBlob.value = blob
			recordingState.value = 'recorded'
		})
		micStream.value?.getTracks().forEach(t => t.stop())
	}

	function resetRecording() {
		recordedBlob.value = null
		recordingState.value = 'idle'
	}

	function toggleRecording() {
		if (recordingState.value === 'idle') return startRecording()
		if (recordingState.value === 'recording') return stopRecording()
		resetRecording()
	}

	return {
		recordingState,
		recordedBlob,
		recordedUrl,
		recordingButtonText,
		recordingIcon,
		toggleRecording,
	}
}
