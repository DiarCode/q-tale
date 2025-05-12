<template>
	<div class="stage">
		<!-- Back nav -->
		<nav
			class="nav-back"
			@click="goBack"
		>
			<ChevronLeft class="w-5 h-5" /> Қайту
		</nav>

		<!-- Ambient blobs & galaxy -->
		<div class="blob b1" />
		<div class="blob b2" />
		<div class="blob b3" />
		<div class="blob b4" />
		<div class="blob b5" />
		<canvas
			ref="galaxyCanvas"
			class="galaxy"
		/>

		<!-- Audio player -->
		<div class="player-card">
			<img
				:src="track.cover"
				class="cover"
				alt="cover"
			/>
			<div class="info">
				<h4 class="title">{{ track.title }}</h4>
				<p class="author">{{ track.author }}</p>
			</div>

			<audio
				ref="audio"
				:src="track.src"
				@timeupdate="updateTime"
				@loadedmetadata="updateTime"
			/>

			<div class="controls">
				<button
					class="play-btn"
					@click="togglePlay"
				>
					<Play
						v-if="!playing"
						class="w-6 h-6"
					/>
					<Pause
						v-else
						class="w-6 h-6"
					/>
				</button>

				<div
					class="progress"
					@click="scrub"
				>
					<div
						class="progress__filled"
						:style="progStyle"
					/>
				</div>
				<div class="time">{{ fmt(current) }} / {{ fmt(duration) }}</div>
			</div>
		</div>

		<!-- Open sheet -->
		<button
			class="assistant-btn"
			v-show="!sheetOpen"
			@click="toggleSheet"
		>
			<Bot class="w-7 h-7" />
		</button>

		<!-- Sheet -->
		<transition name="slide-sheet">
			<aside
				v-show="sheetOpen"
				class="assistant-sheet"
			>
				<header class="sheet-head">
					<h3>AI Assistant</h3>
					<button
						aria-label="Close"
						@click="toggleSheet"
					>
						&times;
					</button>
				</header>

				<!-- orb container with cross-fade -->
				<div class="orb-wrapper">
					<div
						v-for="s in ['idle','listening','thinking','speaking']"
						:key="s"
						:ref="el => orbRefs[s] = el as HTMLDivElement"
						class="lottie-orb"
						:class="{show : assistantState===s}"
					/>
				</div>

				<p class="state-text">{{ stateText }}</p>

				<div
					ref="chatScroll"
					class="chat-scroll"
				>
					<template
						v-for="m in messages"
						:key="m.id"
					>
						<div :class="['bubble', m.sender]">{{ m.text }}</div>
					</template>
					<!-- interim -->
					<div
						v-if="isListening && result && !isFinal"
						class="bubble user dim"
					>
						{{ result }}
					</div>
				</div>
			</aside>
		</transition>
	</div>
</template>

<script setup lang="ts">
/* ░░ Imports ░░ */
import {
  useEventListener,
  useSpeechRecognition,
  useSpeechSynthesis,
  useToggle
} from '@vueuse/core'
import type { AnimationItem } from 'lottie-web'
import lottie from 'lottie-web'
import {
  Bot,
  ChevronLeft,
  Pause,
  Play
} from 'lucide-vue-next'
import * as THREE from 'three'
import {
  computed, nextTick, onMounted,
  onUnmounted, reactive, ref, watch
} from 'vue'
import { useRouter } from 'vue-router'

/* ░░ Lottie JSONs ░░ */
import idleAnim from '@/assets/ai_idle.json'
import listenAnim from '@/assets/ai_listen.json'
import speakAnim from '@/assets/ai_speak.json'
import thinkAnim from '@/assets/ai_think.json'; // subtle dots / spinner

/* ░░ Back nav ░░ */
const router = useRouter()
const goBack = () => { router.back?.() ?? history.back() }

/* ░░ Demo track ░░ */
const track = {
  title: 'Абай жолы • 1-бөлім',
  author: 'Мұхтар Әуезов',
  src: 'https://cdn.pixabay.com/audio/2022/03/15/audio_9b578c4d8b.mp3',
  cover: 'https://imbb.org.kz/wp-content/uploads/2020/02/b24fc64e6b2af76a016add3383cd9939.jpg'
}

/* ░░ Audio ░░ */
const audio = ref<HTMLAudioElement|null>(null)
const playing = ref(false)
const current = ref(0)
const duration = computed(() => audio.value?.duration ?? 0)
const progStyle = computed(() =>
  duration.value ? { width:`${(current.value/duration.value)*100}%` } : { width:'0%' }
)
function togglePlay(){
  if(!audio.value) return
  if(audio.value.paused){ void audio.value.play(); playing.value=true }
  else { audio.value.pause(); playing.value=false }
}
const updateTime = () => { if(audio.value) current.value = audio.value.currentTime }
const scrub = (e:MouseEvent)=>{
  if(!audio.value) return
  const {left,width} = (e.currentTarget as HTMLElement).getBoundingClientRect()
  audio.value.currentTime = ((e.clientX-left)/width)*duration.value
}
const fmt=(s=0)=>{const h=~~(s/3600),m=~~((s%3600)/60),sec=~~(s%60);return h?`${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`:`${m}:${sec.toString().padStart(2,'0')}`}

/* ░░ Assistant sheet ░░ */
const [sheetOpen,_toggleSheet]=useToggle(false)
const toggleSheet=()=>_toggleSheet()

/* ░░ Speech ░░ */
const { isSupported:recSupported,isListening,isFinal,result,start,stop } = useSpeechRecognition({
  lang:'kk-KZ',interimResults:true
})
const ttsText=ref('')
const { isSupported:synthSupported,speak, isPlaying:isSpeaking } = useSpeechSynthesis(ttsText,{lang:'kk-KZ'})

/* ░░ Chat (single-turn only) ░░ */
interface Msg { id:number; sender:'user'|'ai'; text:string }
const messages = reactive<Msg[]>([])
let mid=0
const resetChat = ()=>{ messages.splice(0) }
const push=(s:Msg['sender'],t:string)=>messages.push({id:++mid,sender:s,text:t})

/* ░░ Assistant state ░░ */
const assistantState = ref<'idle'|'listening'|'thinking'|'speaking'>('idle')
const stateText = computed(()=>{
  switch(assistantState.value){
    case 'listening':  return 'Тыңдалып тұр...'
    case 'thinking':   return 'Ойлануда...'
    case 'speaking':   return 'Жауап берілуде...'
    default:           return recSupported.value ? 'Тыңдау үшін түртіңіз / M' : 'Speech API қолдау таппады'
  }
})

/* ░░ Handle STT results ░░ */
watch(
  () => ({ txt:result.value, final:isFinal.value }),
  async ({txt,final})=>{
    if(!txt.trim()) return
    if(final){
      resetChat()
      push('user',txt.trim())
      await askAssistant(txt.trim())
    }
  }
)

/* ░░ Sync animation state ░░ */
watch([isListening,isSpeaking],()=>{
  assistantState.value = isListening.value ? 'listening'
    : isSpeaking.value  ? 'speaking'
    : assistantState.value==='thinking' ? 'thinking'
    : 'idle'
})

/* ░░ Backend call ░░ */
async function askAssistant(q:string){
  assistantState.value='thinking'
  push('ai','…')
  const idx=messages.length-1
  try{
    const res=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text:q,bookId:track.title,position:audio.value?.currentTime??0})})
    const {answer} = (await res.json()) as {answer:string}
    messages[idx].text=''
    typewriter(answer,idx)
    if(synthSupported.value){ ttsText.value=answer; speak() }
  }catch{
    messages[idx].text='Қате шықты.'
  }finally{
    assistantState.value='idle'
  }
}

/* ░░ Typewriter ░░ */
function typewriter(full:string,idx:number){
  let i=0
  const step=()=>{ if(i<=full.length){ messages[idx].text=full.slice(0,i++); setTimeout(step,15+Math.random()*20);
    nextTick(()=>chatScroll.value?.scrollTo({top:chatScroll.value.scrollHeight})) } }
  step()
}

/* ░░ Lottie orbs (cross-fade) ░░ */
const orbRefs:Record<string,HTMLDivElement|null>={idle:null,listening:null,thinking:null,speaking:null}
const anims:Record<string,AnimationItem|null>={idle:null,listening:null,thinking:null,speaking:null}
function loadOrb(name:'idle'|'listening'|'thinking'|'speaking',data:unknown){
  const container=orbRefs[name]
  if(!container) return
  anims[name]?.destroy()
  anims[name]=lottie.loadAnimation({container,renderer:'svg',loop:true,autoplay:true,animationData:data as any})
}
onMounted(()=>{
  loadOrb('idle',idleAnim)
  loadOrb('listening',listenAnim)
  loadOrb('thinking',thinkAnim)
  loadOrb('speaking',speakAnim)
})
onUnmounted(()=>Object.values(anims).forEach(a=>a?.destroy()))

/* ░░ Galaxy ░░ */
const galaxyCanvas=ref<HTMLCanvasElement|null>(null)
let scene:THREE.Scene,camera:THREE.PerspectiveCamera,renderer:THREE.WebGLRenderer,stars:THREE.Points,raf=0
function initGalaxy(){
  scene=new THREE.Scene()
  camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,1,4000)
  camera.position.z=1000
  const g=new THREE.BufferGeometry(),v:number[]=[]
  for(let i=0;i<8000;i++)v.push(THREE.MathUtils.randFloatSpread(2e3),THREE.MathUtils.randFloatSpread(2e3),THREE.MathUtils.randFloatSpread(2e3))
  g.setAttribute('position', new THREE.Float32BufferAttribute(v,3))
  stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1}))
  scene.add(stars)
  renderer=new THREE.WebGLRenderer({canvas:galaxyCanvas.value!,alpha:true})
  renderer.setPixelRatio(devicePixelRatio);renderer.setSize(innerWidth,innerHeight)
  const loop=()=>{raf=requestAnimationFrame(loop);stars.rotation.x+=.0003;stars.rotation.y+=.0002;renderer.render(scene,camera)}
  loop()
  const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
  addEventListener('resize',resize); onUnmounted(()=>removeEventListener('resize',resize))
}
const disposeGalaxy=()=>{cancelAnimationFrame(raf);stars.geometry.dispose();(stars.material as THREE.Material).dispose();renderer.dispose()}

/* ░░ Shortcuts ░░ */
useEventListener(window,'keydown',e=>{
  if(e.key==='m'){isListening.value?stop():start()}
  if(e.key==='a')toggleSheet()
  if(e.key==='Escape'&&sheetOpen.value)toggleSheet()
})

/* ░░ Chat scroll ref & lifecycle ░░ */
const chatScroll=ref<HTMLDivElement|null>(null)
onMounted(()=>{ initGalaxy() })
onUnmounted(()=>{ Object.values(anims).forEach(a=>a?.destroy()); disposeGalaxy() })
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/npm/tailwindcss@^3/src/css/preflight.css'); /* ensure Tailwind base */

.stage{@apply relative min-h-screen text-white overflow-hidden bg-gradient-to-br from-[#05000d] via-[#0a0018] to-[#140023]}
.nav-back{@apply absolute top-5 left-5 z-50 flex items-center gap-1 cursor-pointer text-purple-200 hover:text-white}

.blob{position:absolute;border-radius:50%;filter:blur(100px);opacity:.5}
.blob.b1{@apply w-[220px] h-[220px];background:#7328d9;top:8%;left:12%}
.blob.b2{@apply w-[320px] h-[320px];background:#a644e6;top:18%;right:8%}
.blob.b3{@apply w-[260px] h-[260px];background:#612df9;bottom:12%;left:18%}
.blob.b4{@apply w-[380px] h-[380px];background:#8e34f7;bottom:14%;right:14%}
.blob.b5{@apply w-[160px] h-[160px];background:#9933ff;bottom:42%;left:58%}
.galaxy{position:absolute;inset:0}

.player-card{@apply absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-8 p-10 rounded-[30px] bg-gray-900/60 backdrop-blur-lg shadow-2xl}
.cover{@apply w-52 h-52 rounded-2xl shadow-2xl}
.info{@apply text-center}
.title{@apply text-3xl font-semibold}
.author{@apply text-purple-300}
.controls{@apply w-full flex flex-col items-center gap-4}
.play-btn{@apply w-20 h-20 rounded-full flex items-center justify-center bg-purple-600 hover:bg-purple-500 transition-colors}
.progress{@apply relative w-full h-4 rounded-full cursor-pointer bg-purple-800}
.progress__filled{@apply absolute inset-y-0 left-0 bg-purple-500 rounded-full}
.time{@apply text-base text-purple-200}

.assistant-btn{@apply fixed bottom-6 right-6 z-40 w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white shadow-xl transition-transform hover:scale-110}

.slide-sheet-enter-from,.slide-sheet-leave-to{transform:translateX(110%)}
.slide-sheet-enter-active,.slide-sheet-leave-active{transition:transform .38s cubic-bezier(.33,1,.68,1)}
.assistant-sheet{@apply fixed top-0 right-0 z-50 h-screen w-[420px] flex flex-col bg-[rgba(12,9,24,0.9)] backdrop-blur-xl p-8 shadow-2xl}
.sheet-head{@apply flex items-center justify-between}
.sheet-head h3{@apply text-2xl font-semibold text-[#dcd7ff]}
.sheet-head button{@apply text-[2.2rem] leading-none text-[#a78bfa]}
.orb-wrapper{@apply relative mx-auto mt-4 h-64 w-64}
.lottie-orb{position:absolute;inset:0;opacity:0;transition:opacity .25s ease}
.lottie-orb.show{opacity:1}
.state-text{@apply text-center text-lg mt-2 text-[#a78bfa]}
.chat-scroll{@apply flex-1 overflow-y-auto mt-6 pr-1}
.chat-scroll::-webkit-scrollbar{width:6px}
.chat-scroll::-webkit-scrollbar-thumb{@apply rounded bg-[rgba(126,34,206,0.46)]}
.bubble{@apply mb-3 rounded-[18px] px-4 py-3 text-base leading-tight whitespace-pre-line break-words animate-[fadeIn_.25s_ease_forwards]}
.bubble.user{@apply self-end bg-purple-700 text-white}
.bubble.ai{@apply bg-white/10 text-purple-50}
.bubble.dim{opacity:.6}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
</style>
