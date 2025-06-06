<template>
	<div class="mx-auto px-4 container">
		<div class="gap-6 grid grid-cols-12 grid-flow-dense auto-rows-[18rem]">
			<div
				v-for="(book, i) in BOOKS"
				:key="i"
				:class="['fade-in cursor-pointer', bento(i)]"
				@click="goToBook(book.id)"
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
					<button class="play-btn">
						<Play class="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { BOOKS } from '@/constants/books'
import { Play } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

function goToBook(id: number) {
  router.push(`/${id}`)
}

/* bento layout helper */
const bento = (i: number) => {
  const mod = i % 5
  return mod < 3 ? 'col-span-4' : 'col-span-6'
}
</script>

<style scoped>
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
