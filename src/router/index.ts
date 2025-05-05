import AudioDetails from '@/views/audio-details.vue'
import AudioPlayer from '@/views/audio-player.vue'
import HomeView from '@/views/home-view.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	scrollBehavior() {
		return { top: 0 }
	},

	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
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
