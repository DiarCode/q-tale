<template>
	<button
		v-show="!sheetOpen"
		class="assistant-btn"
		@click="sheetOpen = true"
	>
		<Bot class="w-7 h-7" />
	</button>

	<transition name="slide-sheet">
		<aside
			v-if="sheetOpen"
			class="assistant-sheet"
		>
			<header class="sheet-head">
				<h3>Кітап көмекшісі</h3>
				<button
					aria-label="Жабу"
					@click="closeAssistant"
				>
					&times;
				</button>
			</header>

			<div
				class="orb-wrapper"
				@click="handleOrbClick"
			>
				<LottieOrb
					v-for="o in orbs"
					:key="o.mode"
					:animation="o.anim"
					:visible="assistantState === o.mode"
				/>
			</div>
			<p class="state-text">{{ stateText }}</p>

			<div
				ref="chatScroll"
				class="chat-scroll"
			>
				<template
					v-for="msg in visibleMessages"
					:key="msg.id"
				>
					<div
						v-if="msg.sender === 'ai'"
						:class="['bubble', msg.sender]"
					>
						{{ msg.text }}
					</div>
				</template>
			</div>

			<button
				v-if="assistantState === 'thinking' || assistantState === 'speaking'"
				class="stop-button"
				@click="stopAssistantProcess"
			>
				Тоқтату
			</button>
		</aside>
	</transition>
</template>

<script setup lang="ts">
import LottieOrb from '@/components/lottie-orb.vue'
import { Bot } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'

import idleAnim from '@/assets/ai_idle.json'
import listenAnim from '@/assets/ai_listen.json'
import speakAnim from '@/assets/ai_speak.json'
import thinkAnim from '@/assets/ai_think.json'
import { useBookAssistant } from '@/composables/openai-assistant.composable'

interface Props { bookId: number; timestamp: number }
const props = defineProps<Props>()

const {
  messages,
  assistantState,
  isRecording,
  error,
  start,
  stopRecording, // Renamed from 'stop'
  stopAssistantProcess // New function to stop everything
} = useBookAssistant(props.bookId, () => props.timestamp)

const sheetOpen = ref(false)

// Unified handler for orb click
function handleOrbClick() {
  error.value = null // Clear any previous error on interaction

  if (assistantState.value === 'idle') {
    start() // Start listening
  } else if (assistantState.value === 'listening') {
    stopRecording() // Stop recording
  } else if (assistantState.value === 'thinking' || assistantState.value === 'speaking') {
    // If the assistant is thinking or speaking, clicking the orb will stop it.
    stopAssistantProcess()
  }
}

// Function to close the assistant sheet and stop all processes
function closeAssistant() {
  stopAssistantProcess();
  sheetOpen.value = false;
}

// last two messages
const visibleMessages = computed(() => messages.slice(-2))

// auto-scroll
const chatScroll = ref<HTMLElement|null>(null)
watch(visibleMessages, () => {
  nextTick(() => {
    chatScroll.value?.scrollTo({ top: chatScroll.value.scrollHeight })
  })
})

// status text (including errors)
const stateText = computed(() => {
  if (error.value) return `Қате: ${error.value}`
  switch (assistantState.value) {
    case 'idle':
      return isRecording.value
        ? 'Жазу аяқталғаннан кейін батырманы қайта басыңыз'
        : 'Сұрақ қою үшін батырманы басыңыз'
    case 'listening': return 'Жазылып тұр…'
    case 'thinking':  return 'Жауап дайындап жатыр…'
    case 'speaking':  return 'Жауап берілуде…'
    default: return ''
  }
})

const orbs = [
  { mode: 'idle',      anim: idleAnim   },
  { mode: 'listening', anim: listenAnim },
  { mode: 'thinking',  anim: thinkAnim  },
  { mode: 'speaking',  anim: speakAnim  },
] as const
</script>

<style scoped>
/* Existing styles */
.assistant-btn {
  @apply fixed bottom-6 right-6 z-40 w-20 h-20 rounded-full
         flex items-center justify-center bg-gradient-to-br
         from-purple-600 to-fuchsia-700 text-white shadow-xl
         transition-transform hover:scale-110;
}

.slide-sheet-enter-from,
.slide-sheet-leave-to { transform: translateX(110%); }
.slide-sheet-enter-active,
.slide-sheet-leave-active {
  transition: transform .38s cubic-bezier(.33,1,.68,1);
}

.assistant-sheet {
  @apply fixed top-0 right-0 z-50 h-screen w-[360px] flex flex-col
         bg-white/10 backdrop-blur-lg border-l border-white/20 p-6;
}
.sheet-head {
  @apply flex justify-between items-center mb-4;
}
.sheet-head h3 { @apply font-bold text-white text-2xl; }
.sheet-head button { @apply text-white hover:text-purple-300 text-3xl; }

.orb-wrapper {
  @apply relative mx-auto my-4 w-48 h-48 cursor-pointer;
}
.state-text { @apply text-center text-white/80 mb-4; }

.chat-scroll {
  @apply flex-1 space-y-3 overflow-y-auto;
}
.chat-scroll::-webkit-scrollbar { width: 6px; }
.chat-scroll::-webkit-scrollbar-thumb { @apply rounded bg-white/30; }

/* full-width bubbles */
.bubble {
  @apply w-full p-3 rounded-xl bg-white/10 backdrop-blur-sm
         text-sm leading-snug;
}
.bubble.user { @apply self-end border-purple-400 border-l-4; }
.bubble.ai   { @apply self-start border-indigo-400 border-l-4; }

/* New: Stop button styles */
.stop-button {
  @apply mt-4 px-6 py-3 bg-red-600 text-white rounded-full
         hover:bg-red-700 transition-colors self-center;
}
</style>
