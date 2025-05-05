<template>
	<div
		class="relative bg-gradient-to-br from-[#06000d] via-[#0b0018] to-[#15002a] min-h-screen overflow-hidden"
	>
		<!-- particles -->
		<div
			ref="particlesContainer"
			class="absolute inset-0 pointer-events-none"
		></div>

		<!-- subtle purple blobs -->
		<div
			class="top-1/4 left-1/4 absolute bg-fuchsia-700/20 blur-[220px] rounded-full w-[28rem] h-[28rem]"
		></div>
		<div
			class="right-1/4 bottom-1/4 absolute bg-violet-700/20 blur-[220px] rounded-full w-[28rem] h-[28rem]"
		></div>

		<!-- nav -->
		<nav class="top-4 z-50 sticky flex justify-center px-4">
			<div
				class="flex items-center gap-16 bg-[#15002a]/60 shadow backdrop-blur px-8 py-3 border border-purple-500/30 rounded-full"
			>
				<h1 class="logo">QTale</h1>
				<div class="hidden md:flex gap-6">
					<a
						v-for="l in links"
						:key="l"
						href="#"
						class="nav-link"
						>{{ l }}</a
					>
				</div>
				<button class="icon-btn"><Search class="w-5 h-5" /></button>
			</div>
		</nav>

		<!-- hero -->
		<section
			class="flex flex-col justify-center items-center mx-auto max-w-5xl h-[70vh] text-center"
		>
			<h1 class="hero-heading">
				Кітаптарды тыңдаңыз
				<span class="block font-medium text-purple-300">кез‑келген жерде</span>
			</h1>
			<p class="mb-12 text-purple-400 text-lg md:text-xl">
				Қазақстанның ең үздік аудиокітаптар қызметі. Жолда, үйде немесе кез‑келген жерде тыңдаңыз.
			</p>
			<div class="flex sm:flex-row flex-col justify-center gap-6">
				<button class="btn-primary">Бастау</button>
				<button class="btn-outline">Кітаптарды қарау</button>
			</div>
		</section>

		<!-- books -->
		<section class="py-16">
			<div class="mx-auto px-4 container">
				<div class="gap-6 grid grid-cols-12 grid-flow-dense auto-rows-[18rem]">
					<div
						v-for="(book,i) in featuredBooks"
						:key="i"
						:class="['fade-in cursor-pointer', bento(i)]"
						@click="$router.push(`/${book.title}`)"
					>
						<div class="group card">
							<img
								:src="book.coverImage"
								alt=""
								class="group-hover:scale-105 cover"
							/>
							<span class="shine"></span>

							<div class="z-20 relative px-6 py-4">
								<h3 class="title">{{ book.title }}</h3>
								<p class="author">{{ book.author }}</p>
							</div>

							<span class="badge">{{ book.duration }}</span>
							<button class="play-btn"><Play class="w-5 h-5" /></button>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { Play, Search } from 'lucide-vue-next'
import * as THREE from 'three'
import { onMounted, onUnmounted, ref } from 'vue'

const links = ['Басты бет','Кітаптар','Жанрлар','Жаңа қосылғандар']
const featuredBooks = [
  {
    title: 'Абай жолы',
    author: 'Мұхтар Әуезов',
    coverImage: 'https://abai.kz/content/uploads/2021/08/23159658a5a605d4153cf6c0279e28ac.jpeg',
    duration: '12 сағат 28 мин'
  },
  {
    title: 'Қыз Жібек',
    author: 'Халық аңызы',
    coverImage: 'https://istoriya-uspeha.kz/images/2021/history_uspeha/01/4.jpg',
    duration: '4 сағат 15 мин'
  },
  {
    title: 'Қобыланды батыр',
    author: 'Халық жыры',
    coverImage: 'https://cdn.nur.kz/images/1120/a1bc48611ff2b2b4.jpeg',
    duration: '3 сағат 45 мин'
  },
  {
    title: 'Ер Төстік',
    author: 'Қазақ ертегісі',
    coverImage: 'https://bilim-all.kz/uploads/images/2016/12/08/400x276/28f6b56ad1379accc4bb1dd6b783eb1d.jpg',
    duration: '1 сағат 20 мин'
  },
  {
    title: 'Қалың Мал',
    author: 'Спандияр Көбеев',
    coverImage: 'https://stan.kz/wp-content/uploads/2017/05/20170529190119_82249.jpg',
    duration: '6 сағат 42 мин'
  },
  {
    title: 'Айман-Шолпан',
    author: 'Халық аңызы',
    coverImage: 'https://simg.marwin.kz/media/catalog/product/8/2/uezov_m_aymansholpan.jpg',
    duration: '2 сағат 35 мин'
  },
  {
    title: 'Махаббат қызық мол жылдар',
    author: 'Әзілхан Нұршайықов',
    coverImage: 'https://zhas-zhanary.kz/wp-content/uploads/2023/02/ARD_2330-scaled.jpg',
    duration: '8 сағат 17 мин'
  },
  {
    title: 'Алдар көсе',
    author: 'Халық ертегісі',
    coverImage: 'https://imagesratel.kz/cdn/innermain/i/2020/November/12/ee36c935d5e92e4399bd9682825eee2a3a4abc46.png',
    duration: '1 сағат 10 мин'
  },
  {
    title: 'Көшпенділер',
    author: 'Ілияс Есенберлин',
    coverImage: 'https://sun9-80.userapi.com/impf/c831208/v831208287/123022/Cy9Lv-Mm0W0.jpg?size=550x311&quality=96&sign=1296e1b0ad55b402b27ca7eeadb610b9&type=album',
    duration: '14 сағат 50 мин'
  }
]


/* particles */
const particlesContainer = ref<HTMLElement|null>(null)
let scene:THREE.Scene,camera:THREE.PerspectiveCamera,renderer:THREE.WebGLRenderer,pts:THREE.Points,raf:number
function initParticles(){
  scene=new THREE.Scene()
  camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1000)
  camera.position.z=35
  renderer=new THREE.WebGLRenderer({alpha:true})
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(devicePixelRatio)
  renderer.domElement.style.mixBlendMode='screen'
  particlesContainer.value?.appendChild(renderer.domElement)

  const n=240,g=new THREE.BufferGeometry()
  const pos=new Float32Array(n*3),size=new Float32Array(n),col=new Float32Array(n*3)
  const palette = [
    new THREE.Color(0x8a00ff),
    new THREE.Color(0xbf00ff),
    new THREE.Color(0xde00ff)
  ];

  for(let i=0;i<n;i++){
    pos[i*3]=(Math.random()-0.5)*160
    pos[i*3+1]=(Math.random()-0.5)*160
    pos[i*3+2]=(Math.random()-0.5)*160
    size[i]=2+Math.random()*3
    const c=palette[Math.random()*palette.length|0];col.set([c.r,c.g,c.b],i*3)
  }
  g.setAttribute('position',new THREE.BufferAttribute(pos,3))
  g.setAttribute('size',new THREE.BufferAttribute(size,1))
  g.setAttribute('color',new THREE.BufferAttribute(col,3))
  const m=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute float size;attribute vec3 color;varying vec3 vColor;
      void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*(300./-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying vec3 vColor;void main(){float d=distance(gl_PointCoord,vec2(.5));if(d>.5)discard;gl_FragColor=vec4(vColor,1.-d*2.);}`
  })
  pts=new THREE.Points(g,m);scene.add(pts)
  const loop=()=>{raf=requestAnimationFrame(loop);pts.rotation.y+=0.0003;renderer.render(scene,camera)}
  loop()
}
const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
onMounted(()=>{initParticles();addEventListener('resize',resize)})
onUnmounted(()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);renderer.dispose()})

/* 3‑2 pattern (12‑col) */
const bento=(i:number)=>{
  const mod=i%5
  return mod<3 ? 'col-span-4' : 'col-span-6'
}
</script>

<style scoped>
/* nav */
.logo{ @apply bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 font-bold text-transparent text-2xl; }
.nav-link{ @apply relative text-purple-300 hover:text-white transition; }
.nav-link::after{ content:'';@apply absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-purple-400 to-fuchsia-500 scale-x-0 origin-left transition-transform; }
.nav-link:hover::after{ @apply scale-x-100; }
.icon-btn{ @apply p-2 rounded-full text-purple-300 hover:bg-purple-800/30 transition; }

/* hero */
.hero-heading{ @apply bg-clip-text bg-gradient-to-br from-purple-400 to-fuchsia-500 mb-6 font-extrabold text-transparent text-4xl md:text-6xl; }

/* buttons */
.btn-primary{ @apply bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 px-8 py-3 rounded-full font-semibold text-white transition; }
.btn-outline{ @apply border border-purple-400/40 text-purple-300 font-semibold px-8 py-3 rounded-full hover:bg-purple-800/20 transition; }

/* fade */
.fade-in{ opacity:0;animation:fade .6s ease forwards; }
@keyframes fade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

/* card */
.card{ @apply relative flex flex-col bg-[#1b0130] shadow-lg rounded-[32px] h-full overflow-hidden transition-transform duration-300; }
.card:hover{ @apply shadow-2xl -translate-y-1; }
.card::before{ content:'';position:absolute;inset:-2px;border-radius:inherit;background:conic-gradient(from var(--a,0deg),transparent 15%,rgba(168,85,247,.4),transparent 70%);opacity:0;transition:opacity .4s; }
.card:hover::before{ animation:spin 4s linear infinite;opacity:1; }
@keyframes spin{to{--a:360deg}}

/* left/top mask */
.card::after{ content:'';position:absolute;inset:0;pointer-events:none;z-index:1;
  background:linear-gradient(90deg,rgba(6,0,13,.9) 0%,rgba(6,0,13,.55) 35%,transparent 75%),
             linear-gradient(0deg,rgba(6,0,13,.8) 0%,transparent 60%); }

/* cover & shine */
.cover{ @apply absolute inset-0 w-full h-full object-cover transition-transform duration-500; }
.shine{ position:absolute;inset:0;z-index:2;background:linear-gradient(115deg,transparent 0%,rgba(255,255,255,.12) 45%,transparent 55%);
  background-size:200% 100%;transform:translateX(-100%);transition:transform .7s ease; }
.card:hover .shine{ transform:translateX(100%); }

/* badge & play */
.badge{ @apply bottom-4 left-6 z-20 absolute text-purple-300 text-base; }
.play-btn{ @apply absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-fuchsia-600/70 text-white opacity-0 group-hover:opacity-100 transition; }

/* meta */
.title{ @apply font-semibold text-white text-2xl truncate; }
.author{ @apply mt-1 text-purple-300 text-base truncate; }
</style>
