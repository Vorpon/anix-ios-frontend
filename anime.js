const API_URL = 'https://shikimori.one/api/animes';
const SHIKI_BASE = 'https://shikimori.one';

async function fetchDetail(id) {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error('Ошибка сети Shikimori');
    return res.json();
}

function renderDetail(anime) {
    const titleRu = document.getElementById('anime-title-ru');
    const titleOrig = document.getElementById('anime-title-orig');
    const animeYear = document.getElementById('anime-year');
    const animeEpisodes = document.getElementById('anime-episodes');
    const animeGenres = document.getElementById('anime-genres');
    const animePoster = document.getElementById('anime-poster');
    const animeScore = document.getElementById('anime-score');

    if (titleRu) titleRu.textContent = anime.russian || anime.name;
    if (titleOrig) titleOrig.textContent = anime.name;
    if (animeYear) animeYear.textContent = anime.aired_on ? anime.aired_on.split('-')[0] : 'Неизвестно';
    if (animeEpisodes) animeEpisodes.textContent = anime.episodes ? `${anime.episodes} сер.` : 'Вонгоинг';
    if (animeScore) animeScore.textContent = `★ ${anime.score || '0.0'}`;

    if (animePoster && anime.image) {
        animePoster.src = `https://images.weserv.nl/?url=${encodeURIComponent(SHIKI_BASE + anime.image.original)}&w=400&q=85`;
    }

    if (animeGenres && anime.genres) {
        animeGenres.innerHTML = anime.genres.map(g => 
            `<span class="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-2.5 py-1 rounded-md font-medium">${g.russian}</span>`
        ).join('');
    }

    // МУЛЬТИПЛЕЕР С ЗЕРКАЛАМИ KODIK И KINOBOX
    const playerContainer = document.getElementById('kinobox-player');
    if (playerContainer) {
        playerContainer.innerHTML = `
            <div class="w-full h-full flex flex-col gap-3">
                <div class="flex flex-wrap gap-2 mb-1">
                    <button id="btn-kodik" class="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-500 shadow-md transition-all">Плеер #1 (Kodik Зеркало)</button>
                    <button id="btn-kinobox" class="bg-zinc-900 text-zinc-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all">Плеер #2 (Kinobox-Агрегатор)</button>
                    <button id="btn-collaps" class="bg-zinc-900 text-zinc-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all">Плеер #3 (Collaps)</button>
                </div>
                <div class="w-full flex-1 aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800">
                    <iframe 
                        id="universal-player"
                        src="https://skif.co/find-player?shikimori=${anime.id}" 
                        width="100%" 
                        height="100%" 
                        frameborder="0" 
                        allowfullscreen 
                        allow="autoplay; encrypted-media"
                        class="w-full h-full"
                        style="background: #000;"
                    ></iframe>
                </div>
            </div>
        `;

        const playerFrame = document.getElementById('universal-player');
        const btnKodik = document.getElementById('btn-kodik');
        const btnKinobox = document.getElementById('btn-kinobox');
        const btnCollaps = document.getElementById('btn-collaps');

        const resetButtons = () => {
            [btnKodik, btnKinobox, btnCollaps].forEach(btn => {
                if (btn) btn.className = "bg-zinc-900 text-zinc-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all";
            });
        };

        if (playerFrame) {
            if (btnKodik) {
                btnKodik.onclick = () => {
                    resetButtons();
                    playerFrame.src = `https://skif.co/find-player?shikimori=${anime.id}`;
                    btnKodik.className = "bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-500 shadow-md transition-all";
                };
            }

            if (btnKinobox) {
                btnKinobox.onclick = () => {
                    resetButtons();
                    playerFrame.src = `https://kinobox.tv/player?shikimori=${anime.id}`;
                    btnKinobox.className = "bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-500 shadow-md transition-all";
                };
            }

            if (btnCollaps) {
                btnCollaps.onclick = () => {
                    resetButtons();
                    playerFrame.src = `https://api.collaps.org/embed/shikimori/${anime.id}`;
                    btnCollaps.className = "bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-500 shadow-md transition-all";
                };
            }
        }
    }
} // Вот эта закрывающая скобка для функции renderDetail терялась!

async function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        alert('ID аниме не найден в URL');
        return;
    }

    try {
        const anime = await fetchDetail(id);
        renderDetail(anime);
    } catch (err) {
        console.error(err);
        const detailContainer = document.getElementById('detail-container');
        if (detailContainer) {
            detailContainer.innerHTML = '<div class="text-center text-red-400 py-20">Ошибка загрузки информации о релизе.</div>';
        }
    }
}

document.addEventListener('DOMContentLoaded', init);