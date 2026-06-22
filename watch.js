// Возвращает значение параметра query string из URL страницы.
function qs(name) {
    return new URLSearchParams(location.search).get(name);
}

// URL API-прокси и базовый URL shikimori для формирования изображений.
const API_URL = 'https://anix-backend-eight.vercel.app/api/shiki';
const SHIKI_BASE = 'https://shikimori.one';

// Основные элементы страницы просмотра видео.
const videoPlayer = document.getElementById('video-player');
const videoLoading = document.getElementById('video-loading');
const sourceButtonsContainer = document.getElementById('source-buttons');
const detailLink = document.getElementById('detail-link');
const animeSummary = document.getElementById('anime-summary');

// Демо-источники видео. В реальном проекте сюда подставляются рабочие HLS/MP4 URL.
const SOURCES = [
    { name: 'Demo источник 1', url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4' },
    { name: 'Demo источник 2', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { name: 'Demo источник 3', url: 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4' }
];

// Возвращает проксированный URL постера для безопасной загрузки изображений.
function normalizePoster(anime) {
    if (!anime || !anime.image || !anime.image.original) return '';
    return `https://images.weserv.nl/?url=${encodeURIComponent(SHIKI_BASE + anime.image.original)}`;
}

// Извлекает год выпуска из данных аниме.
function formatYear(anime) {
    return (anime.released_on || anime.aired_on || '').split('-')[0] || '—';
}

// Возвращает количество доступных эпизодов, если оно задано.
function formatEpisodes(anime) {
    return anime.episodes || anime.episodes_aired || '—';
}

// Рендерит карточку с краткой информацией о текущем аниме на странице просмотра.
function showSummary(anime) {
    if (!animeSummary) return;
    const poster = normalizePoster(anime);
    const year = formatYear(anime);
    const episodes = formatEpisodes(anime);
    const score = anime.score || '—';
    const status = anime.status ? anime.status.toUpperCase() : '—';

    animeSummary.innerHTML = `
        <div class="grid gap-4 md:grid-cols-[140px_1fr]">
            <div class="rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <img src="${poster}" alt="${anime.russian || anime.name}" class="w-full h-full object-cover" />
            </div>
            <div class="space-y-3">
                <div class="space-y-2">
                    <p class="text-xs uppercase tracking-[0.2em] text-indigo-400">${anime.kind ? anime.kind.toUpperCase() : 'Аниме'}</p>
                    <h2 class="text-2xl font-semibold text-white">${anime.russian || anime.name}</h2>
                    <p class="text-sm text-zinc-400">${anime.name || ''}</p>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                    <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-3 text-sm">
                        <div class="text-zinc-500 uppercase text-[10px] tracking-[0.25em]">Год</div>
                        <div class="mt-2 text-white">${year}</div>
                    </div>
                    <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-3 text-sm">
                        <div class="text-zinc-500 uppercase text-[10px] tracking-[0.25em]">Эпизоды</div>
                        <div class="mt-2 text-white">${episodes}</div>
                    </div>
                    <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-3 text-sm">
                        <div class="text-zinc-500 uppercase text-[10px] tracking-[0.25em]">Рейтинг</div>
                        <div class="mt-2 text-white">${score}</div>
                    </div>
                    <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-3 text-sm">
                        <div class="text-zinc-500 uppercase text-[10px] tracking-[0.25em]">Статус</div>
                        <div class="mt-2 text-white">${status}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Создает кнопки выбора источника и назначает им воспроизведение.
function createSourceButtons() {
    if (!sourceButtonsContainer) return;
    sourceButtonsContainer.innerHTML = '';
    SOURCES.forEach((source, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = source.name;
        button.className = 'premium-button';
        button.addEventListener('click', () => playSource(source.url));
        sourceButtonsContainer.appendChild(button);
    });
}

// Включает/выключает индикатор загрузки видео.
function setLoading(visible) {
    if (!videoLoading) return;
    videoLoading.classList.toggle('hidden', !visible);
}

// Запускает воспроизведение выбранного источника.
// HLS поддерживается через библиотеку hls.js, иначе загружается обычный mp4.
function playSource(url) {
    if (!videoPlayer) return;
    setLoading(true);
    if (window.Hls && window.Hls.isSupported() && url.endsWith('.m3u8')) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(videoPlayer);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            videoPlayer.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, () => setLoading(false));
    } else {
        videoPlayer.src = url;
        videoPlayer.load();
        videoPlayer.play().catch(() => {});
        videoPlayer.onloadeddata = () => setLoading(false);
        videoPlayer.onerror = () => setLoading(false);
    }
}

// Загружает детальные данные аниме по id через серверный прокси.
async function fetchDetail(id) {
    const resp = await fetch(`/api/shiki?id=${encodeURIComponent(id)}`);
    if (!resp.ok) throw new Error('Ошибка загрузки данных');
    return resp.json();
}

// Показывает сообщение об ошибке в секции с описанием аниме.
function showError(message) {
    if (!animeSummary) return;
    animeSummary.innerHTML = `<div class="text-red-500">${message}</div>`;
}

// Инициализация страницы просмотра: находит id, загружает данные и рендерит интерфейс.
async function init() {
    const id = qs('id');
    if (!id) return showError('ID аниме не указан.');

    let anime = null;
    try {
        const stored = sessionStorage.getItem('anix_allAnime');
        if (stored) {
            const list = JSON.parse(stored);
            anime = list.find(item => String(item.id) === String(id));
        }
    } catch {
        anime = null;
    }

    // Если аниме не найдено в кэше, запрашиваем детали по API.
    if (!anime) {
        try {
            const detail = await fetchDetail(id);
            anime = Array.isArray(detail) ? detail[0] : detail;
        } catch (error) {
            console.error(error);
            return showError('Не удалось загрузить данные аниме.');
        }
    }

    showSummary(anime);
    if (detailLink) detailLink.href = `anime.html?id=${encodeURIComponent(id)}`;
    createSourceButtons();
}

window.addEventListener('DOMContentLoaded', init);
