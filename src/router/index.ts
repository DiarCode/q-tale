import HomeView from '@/views/home-view.vue'
import { createRouter, createWebHistory } from 'vue-router'

const BooksList = () => import('@/views/books-list-view.vue')
const AudioPlayer = () => import('@/views/audio-player-view.vue')
const AudioDetails = () => import('@/views/audio-details-view.vue')
const AudioGenerate = () => import('@/views/audio-generate-view.vue')

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	scrollBehavior: to => {
		if (to.hash) {
			return {
				el: to.hash,
				behavior: 'smooth',
			}
		}

		return { top: 0 }
	},

	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
			meta: {
				title: 'Басты бет | Audioqor',
				description:
					'Audioqor-дың басты бетіне қош келдіңіз! Аудиокітаптарды зерттеңіз, дыбысты өңдеңіз және шығармашылық әлеміне еніңіз | Audioqor',
			},
		},
		{
			path: '/books',
			name: 'books',
			component: BooksList,
			meta: {
				title: 'Аудиокітаптар тізімі | Audioqor',
				description:
					'Біздің аудиокітаптар топтамасын шолыңыз. Сүйікті шығармаларыңызды тыңдаңыз және жаңа әдеби әлемдерді ашыңыз | Audioqor',
			},
		},
		{
			path: '/generate',
			name: 'generate',
			component: AudioGenerate,
			meta: {
				title: 'Аудио генерациялау | Audioqor',
				description:
					'Дыбысыңызды жазыңыз немесе жүктеңіз және Audioqor-мен бірегей аудио шығармалар жасаңыз | Audioqor',
			},
		},
		{
			path: '/:id',
			name: 'details',
			component: AudioDetails,
			meta: {
				title: 'Аудио мәліметтері | Audioqor',
				description:
					'Таңдалған аудиокітап немесе аудио шығарма туралы толық ақпаратты қараңыз | Audioqor',
			},
		},
		{
			path: '/player/:id/:voice',
			name: 'player',
			component: AudioPlayer,
			meta: {
				title: 'Аудио ойнатқыш | Audioqor',
				description:
					'Audioqor ойнатқышымен аудиокітаптарды немесе өңделген аудионы тыңдаңыз | Audioqor',
			},
		},
	],
})

router.beforeEach(to => {
	const { title, description } = to.meta as { title?: string; description?: string }
	const defaultTitle = 'Audioqor'
	const defaultDescription = 'Audioqor'

	document.title = title || defaultTitle

	const descriptionElement = document.querySelector('head meta[name="description"]')
	descriptionElement?.setAttribute('content', description || defaultDescription)
})

export default router
