import { Client } from '@gradio/client'
import axios, { type AxiosResponse } from 'axios'
import { ref } from 'vue'

interface GradioInputs {
	url: string
	ref_audio_file: Blob | File
	ref_text: string
	gen_text: string
}

interface GradioFileData {
	is_stream: boolean
	meta: {
		_type: 'gradio.FileData'
	}
	mime_type: string | null
	orig_name: string
	path: string
	size: number | null
	url: string
}

const cached = ref<Client | null>(null)
const isServiceProcessing = ref(false)

async function getClient(url: string) {
	if (!cached.value) {
		try {
			cached.value = await Client.connect(url)
			console.log('Gradio client connected successfully')
		} catch (err) {
			console.error('Failed to connect to Gradio:', err)
			throw new Error('Gradio connection failed')
		}
	}
	return cached.value
}

async function submitToGradio({
	ref_audio_file,
	ref_text,
	gen_text,
	url,
}: GradioInputs): Promise<string> {
	isServiceProcessing.value = true
	console.log('Submitting to Gradio:', { ref_text, gen_text, audio_size: ref_audio_file.size })

	try {
		const client = await getClient(url)
		const { data } = (await client.predict('/predict', {
			ref_audio_file,
			ref_text,
			gen_text,
			language: 'kz',
		})) as { data: GradioFileData[] }

		if (!data || !Array.isArray(data) || data.length === 0) {
			console.error('Gradio response is empty or not an array:', data)
			throw new Error('Gradio response is empty or invalid')
		}

		const fileData = data[0] // Assuming the first item contains the result
		if (!fileData.url) {
			console.error('Gradio response missing url:', fileData)
			throw new Error('Gradio response missing url')
		}

		console.log('Gradio response received:', fileData.url)
		return fileData.url
	} catch (err) {
		console.error('Gradio submission failed:', err)
		throw err
	} finally {
		isServiceProcessing.value = false
	}
}

interface AtlantiAudioResponse {
	audio_base64: string
	error?: string
}

/**
 * Decodes a base64 audio string and converts it into a Blob object suitable for playback.
 * @param {string} base64String The base64 encoded audio data.
 * @returns {Blob} A Blob object representing the audio file.
 */
function base64ToBlob(base64String: string, mimeType: string = 'audio/wav'): Blob {
	// Convert base64 to a binary string
	const binaryString = atob(base64String)
	// Create a Uint8Array from the binary string
	const len = binaryString.length
	const bytes = new Uint8Array(len)
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i)
	}
	// Create and return the Blob
	return new Blob([bytes], { type: mimeType })
}

function blobToAudioUrl(blob: Blob | File): string {
	// We can use a Blob URL for efficient local playback in the browser
	return URL.createObjectURL(blob)
}

async function submitToAtlanti({
	url,
	ref_audio_file,
	ref_text,
	gen_text,
}: GradioInputs): Promise<string> {
	isServiceProcessing.value = true
	console.log('Submitting to Atlanti (File Upload Endpoint):', {
		gen_text,
		ref_text,
		audio_size: ref_audio_file.size,
	})

	try {
		// Create FormData object for the file upload
		const formData = new FormData()
		formData.append('gen_text', gen_text)
		formData.append('ref_text', ref_text)
		// Append the file (Blob or File object) with the field name 'ref_audio' as per documentation
		formData.append('ref_audio', ref_audio_file)

		// Make the POST request
		const response: AxiosResponse<AtlantiAudioResponse | AtlantiAudioResponse[]> = await axios.post(
			url,
			formData,
		)

		// Process the response data
		let responseData: AtlantiAudioResponse
		if (Array.isArray(response.data)) {
			// Handle the case where the response is an array (as seen in the documentation example)
			responseData = response.data[0]
		} else {
			responseData = response.data
		}

		if (responseData.error) {
			throw new Error(`Atlanti API Error: ${responseData.error}`)
		}

		if (!responseData.audio_base64) {
			throw new Error("Atlanti response did not contain 'audio_base64' key.")
		}

		// Decode the base64 audio and create a Blob
		const audioBlob = base64ToBlob(responseData.audio_base64)

		// Convert the Blob to a playable URL and return it
		const audioUrl = blobToAudioUrl(audioBlob)
		console.log('Atlanti response successfully processed. Audio URL generated.')
		return audioUrl
	} catch (err) {
		console.error('Atlanti submission failed:', err)
		// Determine if the error is an Axios error or a custom error
		if (axios.isAxiosError(err) && err.response) {
			console.error(`HTTP Status: ${err.response.status}, Data:`, err.response.data)
		}
		throw err
	} finally {
		isServiceProcessing.value = false
	}
}

export function useGenerateAudioService() {
	return { submitToGradio, submitToAtlanti, isServiceProcessing }
}
