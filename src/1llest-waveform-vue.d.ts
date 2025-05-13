declare module '1llest-waveform-vue' {
	import { DefineComponent } from 'vue'

	export interface IllestWaveformProps {
		url?: string
		waveColor?: string
		progressColor?: string
		cursorColor?: string
		barWidth?: number
		barGap?: number
		barRadius?: number
		height?: number
		normalize?: boolean
		hideScrollbar?: boolean
		dragToSeek?: boolean
		mediaControls?: boolean
		interact?: boolean
		fade?: boolean
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export const IllestWaveform: DefineComponent<any>

	export default IllestWaveform
}
