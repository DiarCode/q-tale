<template>
	<div
		class="relative bg-gradient-to-br from-[#06000d] via-[#0b0018] to-[#15002a] min-h-screen overflow-hidden"
	>
		<!-- particles container -->
		<div
			ref="particlesContainer"
			class="absolute inset-0 pointer-events-none z-0"
		></div>

		<!-- purple blobs -->
		<div
			class="top-1/4 left-1/4 absolute bg-fuchsia-700/20 blur-[220px] rounded-full w-[28rem] h-[28rem] z-0 pointer-events-none"
		></div>
		<div
			class="right-1/4 bottom-1/4 absolute bg-violet-700/20 blur-[220px] rounded-full w-[28rem] h-[28rem] z-0  pointer-events-none"
		></div>

		<!-- header -->
		<HomeHeader />

		<!-- hero -->
		<section
			id="hero"
			class="flex flex-col justify-center items-center mx-auto max-w-5xl h-[70vh] text-center"
		>
			<h1 class="hero-heading">Қазақ әдебиетінің аудиоқоры</h1>
			<p class="mb-12 text-purple-400 text-lg md:text-xl">
				Сүйікті кітабыңызды тыңдаңыз. Қазақ тіліндегі кітаптар кез келген кезде қолжетімді
			</p>
			<div class="flex sm:flex-row flex-col justify-center gap-6">
				<button
					class="btn-primary cursor-pointer"
					@click="scrollToBooks"
				>
					Бастау
				</button>
				<button
					class="btn-outline cursor-pointer"
					@click="goToBooksPage"
				>
					Аудио өңдеу
				</button>
			</div>
		</section>

		<!-- books -->
		<section
			id="books"
			class="py-16"
		>
			<HomeBooks />
		</section>
	</div>
</template>

<script setup lang="ts">
import HomeBooks from '@/components/home/home-books.vue'
import HomeHeader from '@/components/home/home-header.vue'
import * as THREE from 'three'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function scrollToBooks() {
  router.push({name: 'home', hash: '#books'})
}

function goToBooksPage() {
  router.push('/generate')
}

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
</script>

<style scoped>


/* hero */
.hero-heading{ @apply bg-clip-text bg-gradient-to-br from-purple-400 to-fuchsia-500 mb-6 font-extrabold text-transparent text-4xl md:text-6xl; }

/* buttons */
.btn-primary{ @apply bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 px-8 py-3 rounded-full font-semibold text-white transition; }
.btn-outline{ @apply border border-purple-400/40 text-purple-300 font-semibold px-8 py-3 rounded-full hover:bg-purple-800/20 transition; }

/* fade */
.fade-in{ opacity:0;animation:fade .6s ease forwards; }
@keyframes fade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
</style>
