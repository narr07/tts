import { createClient } from '@libsql/client'
import path from 'node:path'
import { generateCrossword } from '../app/utils/crossword'

const dbPath = path.resolve('.data/db/sqlite.db')
const client = createClient({
	url: `file:${dbPath}`
})

interface PuzzleDef {
	id: string
	title: string
	description: string
	grade: number
	subject: string
	orderIndex: number
	icon: string
	words: { clue: string; answer: string }[]
}

const puzzlesToSeed: PuzzleDef[] = [
	// KELAS 1
	{
		id: 'puz_k1_1',
		title: 'Mengenal Hewan Peliharaan',
		description: 'Ayo tebak nama hewan-hewan lucu yang ada di sekitar rumah kita!',
		grade: 1,
		subject: 'Bahasa Indonesia',
		orderIndex: 1,
		icon: 'i-lucide-cat',
		words: [
			{ clue: 'Hewan berkaki empat bersuara meong', answer: 'KUCING' },
			{ clue: 'Hewan yang bisa berkokok di pagi hari', answer: 'AYAM' },
			{ clue: 'Hewan air yang berenang dengan sirip', answer: 'IKAN' },
			{ clue: 'Hewan setia menjaga rumah bersuara guk', answer: 'ANJING' },
			{ clue: 'Hewan berkaki empat suka makan rumput dan menghasilkan susu', answer: 'SAPI' }
		]
	},
	{
		id: 'puz_k1_2',
		title: 'Buah-Buahan Manis & Sehat',
		description: 'Kenali aneka buah segar kaya vitamin yang baik untuk tubuh.',
		grade: 1,
		subject: 'IPAS',
		orderIndex: 2,
		icon: 'i-lucide-apple',
		words: [
			{ clue: 'Buah bulat berwarna merah atau hijau renyah', answer: 'APEL' },
			{ clue: 'Buah kuning kesukaan monyet kaya kalium', answer: 'PISANG' },
			{ clue: 'Buah bulat kaya vitamin C berasa asam manis', answer: 'JERUK' },
			{ clue: 'Buah berdaging manis harum ada mangga arumanis', answer: 'MANGGA' }
		]
	},

	// KELAS 2
	{
		id: 'puz_k2_1',
		title: 'Benda di Ruang Belajar',
		description: 'Peralatan sekolah dan perlengkapan kelas yang kita gunakan setiap hari.',
		grade: 2,
		subject: 'Bahasa Indonesia',
		orderIndex: 1,
		icon: 'i-lucide-pencil',
		words: [
			{ clue: 'Alat tulis berujung runcing dari grafit', answer: 'PENSIL' },
			{ clue: 'Tempat guru menulis di depan kelas', answer: 'PAPAN' },
			{ clue: 'Perabot berkaki empat tempat menaruh tas dan buku', answer: 'MEJA' },
			{ clue: 'Tempat duduk siswa di kelas', answer: 'KURSI' },
			{ clue: 'Lembaran kertas dijilid untuk membaca atau menulis', answer: 'BUKU' }
		]
	},
	{
		id: 'puz_k2_2',
		title: 'Sikap Baik & Hidup Rukun',
		description: 'Perilaku terpuji yang harus kita amalkan di rumah dan di sekolah.',
		grade: 2,
		subject: 'PPKn',
		orderIndex: 2,
		icon: 'i-lucide-heart-handshake',
		words: [
			{ clue: 'Sikap tidak berbohong dan berkata apa adanya', answer: 'JUJUR' },
			{ clue: 'Hidup damai tanpa pertengkaran saling menyayangi', answer: 'RUKUN' },
			{ clue: 'Berbicara dan bertindak dengan santun kepada yang lebih tua', answer: 'SOPAN' },
			{ clue: 'Rekan bermain dan belajar bersama di kelas', answer: 'TEMAN' },
			{ clue: 'Ucapan yang kita sampaikan saat bertemu guru atau teman', answer: 'SALAM' }
		]
	},

	// KELAS 3
	{
		id: 'puz_k3_1',
		title: 'Lambang Garuda Pancasila',
		description: 'Mengenal simbol-simbol lima sila pada perisai burung Garuda.',
		grade: 3,
		subject: 'PPKn',
		orderIndex: 1,
		icon: 'i-lucide-shield-check',
		words: [
			{ clue: 'Simbol sila pertama: Ketuhanan Yang Maha Esa', answer: 'BINTANG' },
			{ clue: 'Simbol sila kedua: Kemanusiaan yang Adil dan Beradab', answer: 'RANTAI' },
			{ clue: 'Pohon rimbun simbol persatuan sila ketiga', answer: 'BERINGIN' },
			{ clue: 'Hewan bertanduk kuat simbol musyawarah sila keempat', answer: 'BANTENG' },
			{ clue: 'Tumbuhan penghasil beras simbol kemakmuran sila kelima', answer: 'PADI' }
		]
	},
	{
		id: 'puz_k3_2',
		title: 'Cuaca dan Musim di Alam',
		description: 'Perubahan keadaan udara dan musim yang ada di bumi pertiwi.',
		grade: 3,
		subject: 'IPAS',
		orderIndex: 2,
		icon: 'i-lucide-cloud-sun',
		words: [
			{ clue: 'Titik-titik air yang turun dari langit ke bumi', answer: 'HUJAN' },
			{ clue: 'Musim kering di Indonesia saat panas terik', answer: 'KEMARAU' },
			{ clue: 'Kondisi langit gelap tertutup awan tebal', answer: 'MENDUNG' },
			{ clue: 'Gumpalan uap air putih atau abu-abu di langit', answer: 'AWAN' }
		]
	},

	// KELAS 4
	{
		id: 'puz_k4_1',
		title: 'Tumbuhan & Fotosintesis',
		description: 'Organ tanaman dan proses menakjubkan memasak makanan dengan sinar mentari.',
		grade: 4,
		subject: 'IPAS',
		orderIndex: 1,
		icon: 'i-lucide-sprout',
		words: [
			{ clue: 'Bagian tumbuhan di dalam tanah penyerap air dan zat hara', answer: 'AKAR' },
			{ clue: 'Bagian tumbuhan penopang dahan ranting dan daun', answer: 'BATANG' },
			{ clue: 'Tempat berlangsungnya proses fotosintesis', answer: 'DAUN' },
			{ clue: 'Bagian tumbuhan yang indah sebagai alat perkembangbiakan', answer: 'BUNGA' },
			{ clue: 'Zat hijau daun penyerap energi cahaya matahari', answer: 'KLOROFIL' }
		]
	},
	{
		id: 'puz_k4_2',
		title: 'Cerita Rakyat & Legenda',
		description: 'Kisah-kisah turun temurun sarat pesan moral dari berbagai pelosok Nusantara.',
		grade: 4,
		subject: 'Bahasa Indonesia',
		orderIndex: 2,
		icon: 'i-lucide-sparkles',
		words: [
			{ clue: 'Hewan cerdik dalam dongeng fabel Nusantara', answer: 'KANCIL' },
			{ clue: 'Anak durhaka yang dikutuk menjadi batu di Minangkabau', answer: 'MALIN' },
			{ clue: 'Legenda asal mula danau terbesar di Sumatra', answer: 'TOBA' },
			{ clue: 'Legenda perahu tertelungkup Gunung Tangkuban Parahu', answer: 'SANGKURIANG' }
		]
	},

	// KELAS 5
	{
		id: 'puz_k5_1',
		title: 'Organ Pernapasan Manusia',
		description: 'Sistem respirasi tubuh yang mengalirkan udara segar ke seluruh tubuh.',
		grade: 5,
		subject: 'IPAS',
		orderIndex: 1,
		icon: 'i-lucide-activity',
		words: [
			{ clue: 'Organ utama pertukaran oksigen dan karbon dioksida', answer: 'PARU' },
			{ clue: 'Organ pemompa darah berdetak siang dan malam', answer: 'JANTUNG' },
			{ clue: 'Organ tempat pertama kali udara masuk dilengkapi bulu halus', answer: 'HIDUNG' },
			{ clue: 'Gas kehidupan yang dihirup saat bernapas', answer: 'OKSIGEN' }
		]
	},
	{
		id: 'puz_k5_2',
		title: 'Pahlawan Bangsa Indonesia',
		description: 'Tokoh-tokoh pejuang yang memperjuangkan kemerdekaan dan martabat bangsa.',
		grade: 5,
		subject: 'IPAS',
		orderIndex: 2,
		icon: 'i-lucide-award',
		words: [
			{ clue: 'Pahlawan emansipasi wanita dengan buku Habis Gelap Terbitlah Terang', answer: 'KARTINI' },
			{ clue: 'Presiden pertama Republik Indonesia sang Proklamator', answer: 'SOEKARNO' },
			{ clue: 'Wakil Presiden pertama yang juga Bapak Koperasi Indonesia', answer: 'HATTA' },
			{ clue: 'Jenderal Besar pemimpin perang gerilya pantang menyerah', answer: 'SUDIRMAN' }
		]
	},

	// KELAS 6
	{
		id: 'puz_k6_1',
		title: 'Misteri Tata Surya & Alam Semesta',
		description: 'Matahari, planet-planet mengitari orbit, dan keajaiban langit malam.',
		grade: 6,
		subject: 'IPAS',
		orderIndex: 1,
		icon: 'i-lucide-orbit',
		words: [
			{ clue: 'Pusat tata surya yang memancarkan cahaya dan panas', answer: 'MATAHARI' },
			{ clue: 'Planet terdekat dari matahari', answer: 'MERKURIUS' },
			{ clue: 'Planet tempat tinggal manusia memiliki atmosfer dan air', answer: 'BUMI' },
			{ clue: 'Planet merah yang memiliki dua satelit Phobos dan Deimos', answer: 'MARS' },
			{ clue: 'Planet terbesar dalam tata surya kita', answer: 'JUPITER' },
			{ clue: 'Planet indah yang memiliki cincin spektakuler', answer: 'SATURNUS' }
		]
	},
	{
		id: 'puz_k6_2',
		title: 'Pesona Budaya & Geografi Indonesia',
		description: 'Uji wawasan kekayaan alam, budaya, dan sejarah agung Nusantara!',
		grade: 6,
		subject: 'IPAS',
		orderIndex: 2,
		icon: 'i-lucide-landmark',
		words: [
			{ clue: 'Ibu kota negara Indonesia', answer: 'NUSANTARA' },
			{ clue: 'Gunung tertinggi di pulau Jawa', answer: 'SEMERU' },
			{ clue: 'Kain tradisional khas Nusantara dengan teknik malam', answer: 'BATIK' },
			{ clue: 'Danau vulkanik terbesar di Asia Tenggara', answer: 'TOBA' },
			{ clue: 'Alat musik tradisional bambu dari Jawa Barat', answer: 'ANGKLUNG' },
			{ clue: 'Candi Buddha terbesar di dunia di Magelang', answer: 'BOROBUDUR' },
			{ clue: 'Senjata tradisional khas suku Jawa dengan bilah berlekuk', answer: 'KERIS' },
			{ clue: 'Rumah adat khas Minangkabau dengan atap gonjong', answer: 'GADANG' }
		]
	}
]

async function run() {
	const now = Date.now()

	for (const p of puzzlesToSeed) {
		console.log(`Generating layout for: [Kelas ${p.grade}] ${p.title}...`)
		const layout = generateCrossword(p.words)
		if (layout.unplaced.length > 0) {
			console.warn(`  ⚠ ${layout.unplaced.length} kata tidak muat di grid: ${layout.unplaced.map(w => w.answer).join(', ')}`)
		}

		await client.execute({
			sql: `INSERT OR REPLACE INTO puzzles (id, title, description, grade, subject, order_index, icon, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [p.id, p.title, p.description, p.grade, p.subject, p.orderIndex, p.icon, now, now]
		})

		// Delete old questions for this puzzle if any
		await client.execute({
			sql: `DELETE FROM questions WHERE puzzle_id = ?`,
			args: [p.id]
		})

		for (let i = 0; i < layout.placed.length; i++) {
			const pw = layout.placed[i]
			const qId = `q_${p.id}_${i}`
			await client.execute({
				sql: `INSERT INTO questions (id, puzzle_id, clue, answer, direction, row, col, number)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				args: [qId, p.id, pw.clue, pw.answer, pw.direction, pw.row, pw.col, pw.number]
			})
		}
	}

	console.log('🎉 Sukses men-seed semua teka-teki silang Level 1 - 6 untuk anak SD!')
}

run()
