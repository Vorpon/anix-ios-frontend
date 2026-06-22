// Ключ localStorage для списка избранного.
const FAVORITES_KEY = 'anix_favorites';
// Основные DOM-селекторы для страницы избранного.
const favoritesList = document.getElementById('favorites-list');
const clearFavoritesButton = document.getElementById('clear-favorites');
// Базовый URL Shikimori для загрузки постеров.
const SHIKI_BASE = 'https://shikimori.one';

// Загрузка набора избранных id из localStorage.
let favoriteIds = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]').map(String));

function normalizePoster(anime) {
    if (!anime || !anime.image || !anime.image.original) return '';
    return `https://images.weserv.nl/?url=${encodeURIComponent(SHIKI_BASE + anime.image.original)}`;
}

function formatYear(anime) {
    return (anime.released_on || anime.aired_on || '').split('-')[0] || '—';
}

function formatEpisodes(anime) {
    return anime.episodes || anime.episodes_aired || '—';
}

function extractGenres(anime) {
    if (!anime) return [];
    if (Array.isArray(anime.genres) && anime.genres.length) return anime.genres.map(g => typeof g === 'string' ? g : g.name).filter(Boolean);
    if (Array.isArray(anime.tags) && anime.tags.length) return anime.tags.map(t => typeof t === 'string' ? t : t.name).filter(Boolean);
    return [];
}

// Загружает данные одного избранного аниме по id через прокси API.
async function fetchFavoriteAnime(id) {
    try {
        const resp = await fetch(`/api/shiki?id=${encodeURIComponent(id)}`);
        if (!resp.ok) throw new Error('Ошибка загрузки');
        const data = await resp.json();
        return Array.isArray(data) ? data[0] : data;
    } catch (error) {
        console.error('Не удалось загрузить аниме по id', id, error);
        return null;
    }
}

// Возвращает полный список объектов избранного аниме.
// Сначала пытается взять cached данные из sessionStorage, затем подгружает недостающие.
async function getFavoriteAnimeList() {
    const storedAnime = [];
    try {
        const stored = sessionStorage.getItem('anix_allAnime');
        if (stored) storedAnime.push(...JSON.parse(stored));
    } catch {
        // ignore parse errors
    }

    const animeById = new Map(storedAnime.map(item => [String(item.id), item]));
    const favoriteList = [];

    for (const id of favoriteIds) {
        const cached = animeById.get(String(id));
        if (cached) {
            favoriteList.push(cached);
            continue;
        }
        const fetched = await fetchFavoriteAnime(id);
        if (fetched) favoriteList.push(fetched);
    }

    return favoriteList;
}

// Создает карточку избранного аниме с кнопкой удаления и ссылкой на detail.
function createFavoriteCard(anime) {
    const poster = normalizePoster(anime);
    const year = formatYear(anime);
    const episodes = formatEpisodes(anime);
    const status = anime.status ? anime.status.toUpperCase() : '—';
    const genres = extractGenres(anime).slice(0, 2).join(', ') || '—';

    const card = document.createElement('article');
    card.className = 'glass-card rounded-[1.8rem] overflow-hidden border border-zinc-800 shadow-2xl';
    card.innerHTML = `
        <div class="relative aspect-[3/4] bg-zinc-900 overflow-hidden">
            <img src="${poster}" alt="${anime.russian || anime.name}" class="w-full h-full object-cover" loading="lazy">
            <div class="absolute inset-x-0 top-0 flex justify-between p-3">
                <span class="bg-indigo-500/90 text-[11px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded">${anime.score || '—'}</span>
                <span class="bg-black/70 text-[10px] text-zinc-200 px-2 py-1 rounded">${status}</span>
            </div>
        </div>
        <div class="p-4 space-y-3">
            <div>
                <h3 class="text-sm font-semibold leading-tight text-white line-clamp-2">${anime.russian || anime.name}</h3>
                <p class="text-[11px] uppercase tracking-[0.15em] text-zinc-400 mt-1">${anime.name || ''}</p>
            </div>
            <div class="grid grid-cols-2 gap-3 text-[11px] text-zinc-400">
                <div class="space-y-1">
                    <div class="font-semibold text-zinc-200">Год</div>
                    <div>${year}</div>
                </div>
                <div class="space-y-1">
                    <div class="font-semibold text-zinc-200">Эп.</div>
                    <div>${episodes}</div>
                </div>
                <div class="space-y-1">
                    <div class="font-semibold text-zinc-200">Жанр</div>
                    <div>${genres}</div>
                </div>
                <div class="space-y-1">
                    <div class="font-semibold text-zinc-200">Статус</div>
                    <div>${anime.kind ? anime.kind.toUpperCase() : '—'}</div>
                </div>
            </div>
            <div class="flex items-center justify-between gap-3">
                <a href="anime.html?id=${encodeURIComponent(anime.id)}" class="inline-flex items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200 hover:bg-indigo-500/20 transition">Подробнее</a>
                <button type="button" class="remove-favorite rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10 transition">Удалить</button>
            </div>
        </div>
    `;

    const removeButton = card.querySelector('.remove-favorite');
    if (removeButton) {
        removeButton.addEventListener('click', () => {
            favoriteIds.delete(String(anime.id));
            localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteIds]));
            renderFavorites();
        });
    }

    return card;
}

// Рендерит страницу избранного: либо показываем карточки, либо пустой state.
async function renderFavorites() {
    favoritesList.innerHTML = '';
    if (!favoriteIds.size) {
        favoritesList.innerHTML = `
            <div class="col-span-full text-center text-zinc-500 py-20">
                Список избранного пуст. Вернитесь в каталог и добавьте лучшие аниме.
            </div>`;
        return;
    }

    const favoriteList = await getFavoriteAnimeList();

    if (!favoriteList.length) {
        favoritesList.innerHTML = `
            <div class="col-span-full text-center text-zinc-500 py-20">
                Избранные аниме не найдены. Откройте каталог, чтобы восстановить список.
            </div>`;
        return;
    }

    favoriteList.forEach(anime => favoritesList.appendChild(createFavoriteCard(anime)));
}

// Инициализация страницы избранного и настройка кнопки очистки.
async function init() {
    if (clearFavoritesButton) {
        clearFavoritesButton.addEventListener('click', async () => {
            favoriteIds.clear();
            localStorage.setItem(FAVORITES_KEY, JSON.stringify([]));
            await renderFavorites();
        });
    }
    await renderFavorites();
}

window.addEventListener('DOMContentLoaded', init);
