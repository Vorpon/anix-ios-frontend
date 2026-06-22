// Получает параметр из query string, например `id` из URL.
function qs(name) {
    return new URLSearchParams(location.search).get(name);
}

// Возвращает URL постера, проксированный через внешнюю службу изображений.
function normalizePoster(anime) {
    if (!anime || !anime.image || !anime.image.original) return '';
    return `https://images.weserv.nl/?url=${encodeURIComponent('https://shikimori.one' + anime.image.original)}&w=400&q=85`;
}

// Извлекает год из даты релиза
function formatYear(anime) {
    return (anime.released_on || anime.aired_on || '').split('-')[0] || '—';
}

// Вычисляет количество эпизодов
function formatEpisodes(anime) {
    return anime.episodes || anime.episodes_aired || '—';
}

// Возвращает массив жанров
function extractGenres(anime) {
    if (!anime) return [];
    if (Array.isArray(anime.genres) && anime.genres.length) return anime.genres.map(g => typeof g === 'string' ? g : g.name).filter(Boolean);
    if (Array.isArray(anime.tags) && anime.tags.length) return anime.tags.map(t => typeof t === 'string' ? t : t.name).filter(Boolean);
    return [];
}

// Проверка и управление избранным
const FAVORITES_KEY = 'anix_favorites';
let favoriteIds = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]').map(String));
function isFavorite(id) { return favoriteIds.has(String(id)); }
function toggleFavorite(id) {
    const s = String(id);
    if (favoriteIds.has(s)) favoriteIds.delete(s);
    else favoriteIds.add(s);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteIds]));
}

// Запрос деталей аниме с нашего бэкенда
async function fetchDetail(id) {
    const API_URL = 'https://anix-backend-eight.vercel.app/api/shiki';
    const res = await fetch(`${API_URL}?search=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Ошибка сети бэкенда');
    return res.json();
}

function showError(msg) {
    const container = document.getElementById('anime-detail-container');
    if (container) {
        container.innerHTML = `<div class="text-center text-red-400 py-12 font-medium">${msg}</div>`;
    }
}

// Генерация красивого HTML-описания тайтла
function createDetailHTML(anime) {
    const poster = normalizePoster(anime);
    const year = formatYear(anime);
    const eps = formatEpisodes(anime);
    const genres = extractGenres(anime);
    const score = anime.score || '0.0';

    return `
    <div class="flex flex-col md:flex-row gap-8 items-start bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 md:p-8 shadow-xl">
        <div class="w-full md:w-64 shrink-0 relative group mx-auto md:mx-0">
            <img src="${poster}" class="w-full aspect-[3/4] object-cover rounded-2xl border border-zinc-800 shadow-md transition-transform duration-500 group-hover:scale-[1.02]" alt="${anime.russian || anime.name}">
            <div class="absolute top-3 left-3 bg-indigo-600 text-white font-black text-xs px-2.5 py-1 rounded-lg border border-indigo-500 shadow-md">
                ★ ${score}
            </div>
        </div>

        <div class="flex-1 space-y-6">
            <div>
                <h1 class="text-3xl md:text-4xl font-black text-white leading-tight">${anime.russian || anime.name}</h1>
                <p class="text-sm text-zinc-500 font-medium tracking-wide mt-1">${anime.name}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 max-w-sm text-sm border-t border-b border-zinc-900 py-4">
                <div>
                    <span class="text-zinc-500 block text-xs uppercase tracking-wider">Год релиза</span>
                    <span class="text-zinc-200 font-bold mt-0.5 inline-block">${year}</span>
                </div>
                <div>
                    <span class="text-zinc-500 block text-xs uppercase tracking-wider">Эпизоды</span>
                    <span class="text-zinc-200 font-bold mt-0.5 inline-block">${eps} сер.</span>
                </div>
            </div>

            <div>
                <span class="text-zinc-500 block text-xs uppercase tracking-wider mb-2">Жанры</span>
                <div class="flex flex-wrap gap-2">
                    ${genres.map(g => `<span class="bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1 rounded-xl text-xs font-medium">${g}</span>`).join('')}
                </div>
            </div>

            <div class="pt-2">
                <button id="favorite-detail" class="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-xs font-bold px-5 py-3 rounded-xl transition-all active:scale-95">
                    ${isFavorite(anime.id) ? '★ В избранном' : '☆ Добавить в избранное'}
                </button>
            </div>
        </div>
    </div>
    `;
}

/**
 * Инициализация страницы и встраивание плеера
 */
async function init() {
    const id = qs('id');
    if (!id) return showError('Идентификатор аниме не задан.');

    const container = document.getElementById('anime-detail-container');
    let anime = null;

    // Пытаемся восстановить кэш из sessionStorage
    try {
        const cached = sessionStorage.getItem('anix_allAnime');
        if (cached) {
            const list = JSON.parse(cached);
            anime = list.find(a => String(a.id) === String(id));
        }
    } catch (e) { console.error(e); }

    // Если в кэше нет, качаем с бэкенда
    if (!anime) {
        if (container) container.innerHTML = '<div class="text-center text-zinc-500 py-12 animate-pulse">Синхронизация с базой данных...</div>';
        try {
            const detail = await fetchDetail(id);
            anime = Array.isArray(detail) ? detail[0] : detail;
        } catch (error) {
            console.error(error);
            return showError('Не удалось загрузить аниме с сервера.');
        }
    }

    if (!anime) return showError('Аниме не найдено.');
    
    // Рендерим описание
    if (container) container.innerHTML = createDetailHTML(anime);

    // УЛЬТИМАТИВНЫЙ И КРАСИВЫЙ ПЛЕЕР:
    // Мы генерируем защищенный iframe, использующий глобальную базу доноров Kodik. 
    // Он работает напрямую без подгрузки внешних скриптов и не боится блокировки домена kinobox.
   // ИНТЕГРАЦИЯ НА ОСНОВЕ НАЙДЕННОГО РЕПОЗИТОРИЯ
    // УМНЫЙ МУЛЬТИПЛЕЕР (Kodik + Автопереключение на Collaps при ошибке 451)
    const playerContainer = document.getElementById('kinobox-player');
    if (playerContainer) {
        playerContainer.innerHTML = '<div class="text-center text-zinc-500 py-12 animate-pulse">Поиск доступных видеопотоков...</div>';

        try {
            // 1. Пробуем получить ссылку на Kodik через наш бэкенд
            const res = await fetch(`https://anix-backend-eight.vercel.app/api/video?shikimori=${anime.id}`);
            
            if (!res.ok) throw new Error('Kodik не ответил');
            
            const videoData = await res.json();
            const targetVideo = videoData[0];
            
            // Если ссылка содержит признаки блокировки или пустая, кидаем ошибку для перехода на резерв
            if (!targetVideo || !targetVideo.link) {
                throw new Error('Блокировка правообладателя');
            }

            // Если всё ок, встраиваем Kodik
            playerContainer.innerHTML = `
                <iframe 
                    src="${targetVideo.link}" 
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    allowfullscreen 
                    class="w-full h-full rounded-2xl"
                    style="background: #000;"
                ></iframe>
            `;

        } catch (err) {
            console.warn("Kodik недоступен или заблокирован (451). Включаем резервный балансер Collaps...", err);
            
            // 2. РЕЗЕРВНЫЙ ПЛАН: Если Kodik выдал 451 или упал, мгновенно включаем базу Collaps,
            // которая плевать хотела на эти блокировки и выдаст серии без VPN.
            playerContainer.innerHTML = `
                <iframe 
                    src="https://api.collaps.org/embed/shikimori/${anime.id}" 
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    allowfullscreen 
                    class="w-full h-full rounded-2xl"
                    style="background: #000;"
                ></iframe>
            `;
        }
    }

    // Обработчик для кнопки избранного
    const favoriteDetail = document.getElementById('favorite-detail');
    if (favoriteDetail) {
        favoriteDetail.addEventListener('click', () => {
            toggleFavorite(anime.id);
            favoriteDetail.textContent = isFavorite(anime.id) ? '★ В избранном' : '☆ Добавить в избранное';
        });
    }
}

window.addEventListener('DOMContentLoaded', init);