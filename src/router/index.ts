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
		},
		{
			path: '/books',
			name: 'books',
			component: BooksList,
		},
		{
			path: '/generate',
			name: 'generate',
			component: AudioGenerate,
		},
		{
			path: '/:id',
			name: 'details',
			component: AudioDetails,
		},
		{
			path: '/:id/play',
			name: 'player',
			component: AudioPlayer,
		},
	],
})

export default router
