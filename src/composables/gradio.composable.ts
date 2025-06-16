import { Client } from '@gradio/client'
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

export function useGradioService() {
	return { submitToGradio, isServiceProcessing }
}
