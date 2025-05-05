<template>
	<div
		class="relative bg-gradient-to-br from-[#05000d] via-[#0a0018] to-[#140023] min-h-screen overflow-hidden text-white"
	>
		<!-- blurred hero backdrop -->
		<img
			:src="book.coverImage"
			alt=""
			class="fixed inset-0 opacity-20 blur-xl w-full h-full object-cover scale-110 pointer-events-none select-none"
		/>

		<!-- Back button -->
		<nav class="top-6 left-6 z-30 absolute">
			<button
				@click="$router.back()"
				class="flex items-center text-purple-300 hover:text-white transition"
			>
				<ChevronLeft class="mr-1 w-6 h-6" /> Қайту
			</button>
		</nav>

		<!-- MAIN LAYOUT -->
		<div
			class="z-20 relative flex md:flex-row flex-col items-center md:items-start gap-16 mx-auto px-6 md:px-16 pt-32 pb-20 max-w-7xl"
		>
			<!-- Cover left -->
			<div
				ref="coverContainer"
				@mousemove="tiltCover"
				@mouseleave="resetCover"
				class="relative w-64 md:w-80 lg:w-96 h-[28rem] cover-container perspective shrink-0 fade-in-up"
			>
				<div class="absolute inset-0 bg-purple-900/50 blur-2xl rounded-[36px] halo"></div>
				<img
					:src="book.coverImage"
					alt="cover"
					class="relative shadow-2xl rounded-[36px] w-full h-full object-cover transition-transform duration-500 book-cover"
				/>
			</div>

			<!-- Details right -->
			<div class="flex flex-col flex-1 justify-center delay-200 fade-in-up">
				<h1 class="mb-4 font-extrabold text-4xl lg:text-5xl xl:text-6xl gradient-text">
					{{ book.title }}
				</h1>
				<h2 class="mb-8 text-purple-300 text-2xl">{{ book.author }}</h2>

				<ul class="gap-x-8 gap-y-4 grid grid-cols-2 lg:grid-cols-4 mb-10 text-purple-400 text-lg">
					<li class="flex flex-col items-start">
						<span class="meta-label">Жанр</span> {{ book.genre }}
					</li>
					<li class="flex flex-col items-start">
						<span class="meta-label">Бөлімдер</span> {{ book.chapters }}
					</li>
					<li class="flex flex-col items-start">
						<span class="meta-label">Ұзақтығы</span> {{ book.duration }}
					</li>
					<li class="flex flex-col items-start">
						<span class="meta-label">Шыққан жылы</span> {{ book.releaseDate }}
					</li>
				</ul>

				<p class="mb-12 max-w-prose text-purple-200 text-xl leading-relaxed">
					{{ book.description }}
				</p>

				<button
					class="self-start btn-play"
					@click="$router.push(`/${book.title}/play`)"
				>
					<Play class="mr-2 w-6 h-6" /> Тыңдауды бастау
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ChevronLeft, Play } from 'lucide-vue-next'
import { reactive, ref } from 'vue'

/* book stub */
const book = reactive({
  title: 'Абай жолы',
  author: 'Мұхтар Әуезов',
  coverImage:
    'https://imbb.org.kz/wp-content/uploads/2020/02/b24fc64e6b2af76a016add3383cd9939.jpg',
  genre: 'Роман-эпопея',
  chapters: 12,
  duration: '12 сағат 28 мин',
  releaseDate: '1942',
  description:
    '«Абай жолы» – Мұхтар Әуезовтің қазақ әдебиетіндегі ең алып эпосы. Роман XIX ғасырдағы қазақ өмірін, рухани дүниесін терең әрі шынайы бейнелейді.'
})

/* 3-D tilt */
const coverContainer = ref<HTMLElement | null>(null)
function tiltCover(e: MouseEvent) {
  if (!coverContainer.value) return
  const rect = coverContainer.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  const img = coverContainer.value.querySelector<HTMLImageElement>('.book-cover')!
  img.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.05)`
}
function resetCover() {
  coverContainer.value
    ?.querySelector<HTMLImageElement>('.book-cover')
    ?.style.setProperty('transform', 'rotateY(0) rotateX(0) scale(1)')
}
</script>

<style scoped>
/* gradient text */
.gradient-text {
  @apply bg-clip-text bg-gradient-to-br from-purple-500 to-pink-500 text-transparent;
}

/* halo */
.halo {
  animation: pulseSlow 8s ease-in-out infinite;
}
@keyframes pulseSlow {
  0%,100% { transform: scale(1); opacity: 0.35; }
  50%    { transform: scale(1.08); opacity: 0.6; }
}

/* play btn */
.btn-play {
  @apply inline-flex items-center bg-gradient-to-r from-fuchsia-600 to-purple-600
        px-8 py-4 rounded-full font-semibold text-white text-xl shadow-lg
        transition-transform duration-300;
}


/* label */
.meta-label {
  @apply font-semibold text-purple-300;
}

/* fade-in */
.fade-in-up {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeUp 0.9s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
}
@keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
/* delay utility */
.delay-200 { animation-delay: 0.2s; }

/* perspective */
.perspective { perspective: 1200px; }
</style>
