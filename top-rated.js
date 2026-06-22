// DOM-элементы списка топовых аниме и фильтров.
const TOP_RATED_CONTAINER = document.getElementById('top-rated-list');
const GENRE_FILTER_LIST = document.getElementById('genre-filter-list');
const SEASON_FILTER_LIST = document.getElementById('season-filter-list');
const TOP_RATED_SUMMARY = document.getElementById('top-rated-summary');
// Прокси backend для запросов Shikimori.
const API_URL = 'https://anix-backend-eight.vercel.app/api/shiki';
const SHIKI_BASE = 'https://shikimori.one';

// Список всех загруженных топовых аниме и выбранные фильтры.
let allTopRated = [];
let selectedGenre = '';
let selectedSeason = '';

// Формирует URL постера для карточки аниме.
function normalizePoster(anime) {
    if (!anime || !anime.image || !anime.image.original) return '';
    return `https://images.weserv.nl/?url=${encodeURIComponent(SHIKI_BASE + anime.image.original)}`;
}

// Извлекает год выпуска аниме.
function formatYear(anime) {
    return (anime.released_on || anime.aired_on || '').split('-')[0] || '—';
}

// Возвращает список жанров из `genres` или `tags`.
function getGenres(anime) {
    if (!anime) return [];
    const genres = Array.isArray(anime.genres) ? anime.genres : anime.tags;
    return Array.isArray(genres) ? genres.map(g => typeof g === 'string' ? g : g.name).filter(Boolean) : [];
}

// Форматирует жанры в строку для показа на карточке.
function formatGenres(anime) {
    const genres = getGenres(anime);
    return genres.length ? genres.slice(0, 2).join(', ') : '—';
}

// Определяет сезон по месяцу первой даты выхода аниме.
function getAnimeSeason(anime) {
    const date = anime.aired_on || anime.released_on || '';
    const month = parseInt(date.split('-')[1], 10);
    if (!month) return 'Неизвестно';
    if (month >= 1 && month <= 3) return 'Зима';
    if (month >= 4 && month <= 6) return 'Весна';
    if (month >= 7 && month <= 9) return 'Лето';
    return 'Осень';
}

// Создает HTML-карточку для одной позиции топа.
function createTopRatedCard(anime) {
    const posterUrl = normalizePoster(anime);
    const year = formatYear(anime);
    const genres = formatGenres(anime);
    return `
        <article class="glass-card rounded-[1.8rem] overflow-hidden border border-zinc-800 shadow-2xl transition hover:-translate-y-1 hover:border-indigo-500">
            <a href="anime.html?id=${encodeURIComponent(anime.id)}" class="block">
                <div class="relative aspect-[3/4] bg-zinc-900 overflow-hidden">
                    <img src="${posterUrl}" alt="${anime.russian || anime.name}" class="w-full h-full object-cover" loading="lazy">
                </div>
                <div class="p-4 space-y-3">
                    <div class="flex items-center justify-between gap-3">
                        <span class="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-indigo-200">${anime.score || '—'}</span>
                        <span class="text-[11px] uppercase tracking-[0.15em] text-zinc-500">${year}</span>
                    </div>
                    <h3 class="text-lg font-semibold text-white line-clamp-2">${anime.russian || anime.name}</h3>
                    <p class="text-[11px] text-zinc-400 uppercase tracking-[0.15em]">${genres}</p>
                </div>
            </a>
        </article>`;
}

// Рендерит набор карточек топовых аниме.
function renderTopRated(animeList) {
    if (!TOP_RATED_CONTAINER) return;
    if (!animeList || !animeList.length) {
        TOP_RATED_CONTAINER.innerHTML = '<div class="col-span-full text-center text-zinc-500 py-20">Нет данных для топа.</div>';
        updateTopRatedSummary(0, allTopRated.length);
        return;
    }
    TOP_RATED_CONTAINER.innerHTML = animeList.map(createTopRatedCard).join('');
    updateTopRatedSummary(animeList.length, allTopRated.length);
}

// Обновляет текст статистики отображенных элементов и активных фильтров.
function updateTopRatedSummary(count, total) {
    if (!TOP_RATED_SUMMARY) return;
    const filters = [];
    if (selectedGenre) filters.push(`жанр «${selectedGenre}»`);
    if (selectedSeason) filters.push(`сезон ${selectedSeason}`);
    TOP_RATED_SUMMARY.textContent = filters.length
        ? `Показано ${count} из ${total} лучших аниме по фильтрам: ${filters.join(', ')}.`
        : `Показано ${count} из ${total} лучших аниме.`;
}

// Генерирует HTML-кнопку фильтра с визуальным состоянием active.
function createFilterButton(value, label, active) {
    return `
        <button type="button" data-filter-value="${value}" class="rounded-full px-3 py-2 text-sm transition ${active ? 'bg-indigo-500 text-white border border-indigo-400' : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800'}">
            ${label}
        </button>`;
}

// Заполняет фильтры жанров и сезонов по загруженному списку аниме.
function populateFilters(list) {
    if (!GENRE_FILTER_LIST || !SEASON_FILTER_LIST) return;
    const genres = new Set();
    const seasons = new Set();
    list.forEach(anime => {
        getGenres(anime).forEach(g => genres.add(g));
        seasons.add(getAnimeSeason(anime));
    });
    const sortedGenres = [...genres].sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    const seasonOrder = ['Все сезоны', 'Зима', 'Весна', 'Лето', 'Осень', 'Неизвестно'];

    GENRE_FILTER_LIST.innerHTML = [
        createFilterButton('', 'Все жанры', selectedGenre === ''),
        ...sortedGenres.map(genre => createFilterButton(genre, genre, selectedGenre === genre))
    ].join('');

    SEASON_FILTER_LIST.innerHTML = seasonOrder
        .filter(season => season === 'Все сезоны' || seasons.has(season))
        .map(season => {
            const value = season === 'Все сезоны' ? '' : season;
            const active = season === 'Все сезоны' ? selectedSeason === '' : selectedSeason === season;
            return createFilterButton(value, season, active);
        })
        .join('');
}

// Обрабатывает клики по фильтрам и перерендеривает список.
function handleFilterClick(event) {
    const button = event.target.closest('button[data-filter-value]');
    if (!button) return;
    const value = button.dataset.filterValue;
    if (button.parentElement === GENRE_FILTER_LIST) {
        selectedGenre = value;
    } else if (button.parentElement === SEASON_FILTER_LIST) {
        selectedSeason = value;
    }
    populateFilters(allTopRated);
    applyFilters();
}

// Применяет выбранные жанр и сезон к списку топовых аниме.
function applyFilters() {
    let filtered = [...allTopRated];
    if (selectedGenre) {
        const genreLower = selectedGenre.toLowerCase();
        filtered = filtered.filter(anime => getGenres(anime).some(g => g.toLowerCase() === genreLower));
    }
    if (selectedSeason) {
        filtered = filtered.filter(anime => getAnimeSeason(anime) === selectedSeason);
    }
    renderTopRated(filtered.slice(0, 12));
}

// Загружает топовые аниме с backend-прокси и стартует рендер.
async function fetchTopRated() {
    TOP_RATED_CONTAINER.innerHTML = '<div class="col-span-full text-center text-zinc-500 py-20">Загрузка...</div>';
    try {
        const response = await fetch(`${API_URL}?limit=50&order=ranked`);
        if (!response.ok) throw new Error('Ошибка загрузки');
        const data = await response.json();
        allTopRated = Array.isArray(data) ? data.slice().sort((a,b) => parseFloat(b.score || 0) - parseFloat(a.score || 0)) : [];
        populateFilters(allTopRated);
        applyFilters();
    } catch (error) {
        console.error(error);
        TOP_RATED_CONTAINER.innerHTML = '<div class="col-span-full text-center text-red-500 py-20">Не удалось загрузить топ.</div>';
        updateTopRatedSummary(0, 0);
    }
}

// Инициализация страницы топ-рейтинга: привязка слушателей и загрузка данных.
function init() {
    if (GENRE_FILTER_LIST) GENRE_FILTER_LIST.addEventListener('click', handleFilterClick);
    if (SEASON_FILTER_LIST) SEASON_FILTER_LIST.addEventListener('click', handleFilterClick);
    fetchTopRated();
}

window.addEventListener('DOMContentLoaded', init);
