// types.ts

export type Voice = 'male' | 'female'

export interface Book {
	/** Кітаптың бірегей сандық идентификаторы */
	id: number
	/** Атауы */
	title: string
	/** Автор(лар) */
	author: string
	/** Қақап суретінің URL-мекені */
	coverImage: string
	/** Категория (жанрлық бөліну) */
	category: string
	/** Толық жанр сипаттамасы */
	genre: string
	/** Бөлімдер саны (томдар немесе басты тараулар) */
	chapters: number
	/** Ойнату жалпы ұзақтығы (сағат/минут) */
	duration: string
	/** Шығарылған жылы (немесе ауқымы) */
	year: number | string
	/** Қызықты мазмұндық сипаттама қазақ тілінде */
	description: string
	/** Екі дауыстық нұсқаға (ер/әйел) сілтемелер */
	audioSources: Record<Voice, string>
}

export const BOOK_CATEGORIES = [
	'Барлық кітаптар',
	'Классикалық әдебиет',
	'Тарихи романдар',
] as const

export const BOOKS: Book[] = [
	{
		id: 1,
		title: 'Абай жолы',
		author: 'Мұхтар Әуезов',
		coverImage: 'https://abai.kz/content/uploads/2021/08/23159658a5a605d4153cf6c0279e28ac.jpeg',
		category: 'Классикалық әдебиет',
		genre: 'Роман-эпопея',
		chapters: 4,
		duration: '12 сағат 28 мин',
		year: 1942,
		description:
			'Мұхтар Әуезовтің ұлы эпопеясы – қазақ интеллигенциясының қалыптасуын, Абай Құнанбаевтың өмірі мен идеясын кең көлемде бейнелейді.',
		audioSources: {
			male: 'https://audioqor.fra1.cdn.digitaloceanspaces.com/aqzhaik_1.mp3',
			female: 'https://audioqor.fra1.cdn.digitaloceanspaces.com/aqzhaik_1.mp3',
		},
	},
	{
		id: 2,
		title: 'Қан мен тер',
		author: 'Әбдіжәміл Нұрпейісов',
		coverImage: 'https://cdn.kitap.kz/storage/book/dfa5bc4cbe6133665c3325a373d6ff36.jpg',
		category: 'Классикалық әдебиет',
		genre: 'Социалистік-реалистік роман',
		chapters: 3,
		duration: '4 сағат 15 мин',
		year: 1961,
		description:
			'Әбдіжәміл Нұрпейісов қазақ даласының әлеуметтік өзгерістерін, еңбекшілердің тағдырын трилогиялық форматта суреттейді.',
		audioSources: {
			male: 'https://audioqor.fra1.cdn.digitaloceanspaces.com/aqzhaik_1.mp3',
			female: 'https://audioqor.fra1.cdn.digitaloceanspaces.com/aqzhaik_1.mp3',
		},
	},
	{
		id: 3,
		title: 'Ай мен Айша',
		author: 'Шерхан Мұртаза',
		coverImage: 'https://cdn.kitap.kz/storage/book/938bd333c1eb706801a0a46b7260252d.jpg',
		category: 'Классикалық әдебиет',
		genre: 'Роман-диалогия',
		chapters: 2,
		duration: '3 сағат 45 мин',
		year: 1968,
		description:
			'Шерхан Мұртазаның бала мен ана арасындағы мөндетті, сырлы қарым-қатынасын шынайы диалог түрінде жеткізетін романы.',
		audioSources: {
			male: 'https://audioqor.fra1.cdn.digitaloceanspaces.com/aqzhaik_1.mp3',
			female: 'https://audioqor.fra1.cdn.digitaloceanspaces.com/aqzhaik_1.mp3',
		},
	},
	{
		id: 4,
		title: 'Ақ Жайық',
		author: 'Хамза Есенжанов',
		coverImage:
			'https://egemen.kz/wp-content/uploads/2015/08/%D1%84%D0%BE%D1%82%D0%BE-%D0%A0%D0%B0%D1%84%D1%85%D0%B0%D1%82%D0%B0-%D0%A5%D0%B0%D0%BB%D0%B5%D0%BB%D0%BE%D0%B2%D0%B0-1-126.jpg',
		category: 'Тарихи романдар',
		genre: 'Тарихи роман',
		chapters: 3,
		duration: '1 сағат 20 мин',
		year: 1957,
		description:
			'20 ғасырдың басындағы Ақ Жайық өңіріндегі халықтың азапты тағдырын және азаттық үшін күресті суреттейтін тарихи роман.',
		audioSources: {
			male: 'https://audioqor.fra1.cdn.digitaloceanspaces.com/aqzhaik_1.mp3',
			female: 'https://audioqor.fra1.cdn.digitaloceanspaces.com/aqzhaik_1.mp3',
		},
	},
	{
		id: 5,
		title: 'Үркер',
		author: 'Әбіш Кекілбаев',
		coverImage: 'https://cdn.kitap.kz/storage/book/1324630bdaebd3f7a9cf9008a89f574d.jpg',
		category: 'Тарихи романдар',
		genre: 'Тарихи роман',
		chapters: 4,
		duration: '2 сағат 35 мин',
		year: 1981,
		description:
			'Әбіш Кекілбаевтың кіші жүз руларының Ресей империясына қосылу кезеңін нақты тарихи деректерге сүйеніп суреттейтін көлемді шығарма.',
		audioSources: {
			male: 'https://audioqor.fra1.cdn.digitaloceanspaces.com/aqzhaik_1.mp3',
			female: 'https://audioqor.fra1.cdn.digitaloceanspaces.com/aqzhaik_1.mp3',
		},
	},
]

/** Барлық кітаптарды қайтарады */
export function getBooks(): Book[] {
	return BOOKS
}

/**
 * Таңдалған кітаптың дауыстық файлына жолын қайтарады
 * @param bookId – кітаптың id
 * @param voice – 'male' немесе 'female'
 */
export function getBookAudio(bookId: number, voice: Voice): string {
	const book = BOOKS.find(b => b.id === bookId)
	if (!book) throw new Error('Кітап табылмады')
	return book.audioSources[voice]
}

/**
 * Белгілі бір идентификаторға сәйкес кітапты қайтарады.
 * @param bookId – сандық идентификатор (Book.id)
 * @throws {Error} егер кітап табылмаса
 */
export function getBookById(bookId: number): Book {
	const book = BOOKS.find(b => b.id === bookId)
	if (!book) {
		throw new Error(`Кітап табылмады (id=${bookId})`)
	}
	return book
}
