// Получает параметр из query string, например `id` из URL.
function qs(name) {
    return new URLSearchParams(location.search).get(name);
}

// Возвращает URL постера, проксированный через внешнюю службу изображений.
// Это уменьшает риск блокировки сторонних картинок и ускоряет загрузку.
function normalizePoster(anime) {
    if (!anime || !anime.image || !anime.image.original) return '';
    return `https://images.weserv.nl/?url=${encodeURIComponent('https://shikimori.one' + anime.image.original)}`;
}

// Извлекает год из даты релиза или даты начала показа.
function formatYear(anime) {
    return (anime.released_on || anime.aired_on || '').split('-')[0] || '—';
}

// Вычисляет количество эпизодов, обращаясь к разным вариантам полей.
function formatEpisodes(anime) {
    return anime.episodes || anime.episodes_aired || '—';
}

// Возвращает массив жанров для аниме, обращаясь к `genres` или `tags`.
function extractGenres(anime) {
    if (!anime) return [];
    if (Array.isArray(anime.genres) && anime.genres.length) return anime.genres.map(g => typeof g === 'string' ? g : g.name).filter(Boolean);
    if (Array.isArray(anime.tags) && anime.tags.length) return anime.tags.map(t => typeof t === 'string' ? t : t.name).filter(Boolean);
    return [];
}

// Создает блок комментариев на detail-странице. В демо использованы фиктивные отзывы.
function createCommentBlock(anime) {
    const count = anime.comments_count || Math.max(3, Math.min(12, Math.floor((anime.score || 6.5) * 1.3)));
    const comments = [
        'Сюжет держит в напряжении до самого финала. Отличная рекомендация!',
        'Атмосфера и дизайн персонажей просто сумасшедшие, очень красиво.',
        'Глубокая драматическая линия, которую хочется пересмотреть снова.'
    ];
    const commentItems = comments.map(text => `
        <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-4 text-sm text-zinc-300">
            <p class="text-zinc-200">${text}</p>
            <div class="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-accent">
                <span>Пользователь</span>
                <span>2 ч назад</span>
            </div>
        </div>
    `).join('');

    return `
        <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div class="text-xs uppercase tracking-[0.24em] text-accent">Комментарии</div>
                    <div class="text-xl font-semibold text-white">Отзывы зрителей</div>
                </div>
                <span class="rounded-full bg-indigo-500/15 px-3 py-1 text-sm text-indigo-200">${count} отзывов</span>
            </div>
            <div class="space-y-4">
                ${commentItems}
            </div>
            <button type="button" class="premium-button">Оставить отзыв</button>
        </div>
    `;
}

// Ключ localStorage для хранения избранного на клиенте.
const FAVORITES_KEY = 'anix_favorites';
let favoriteIds = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]').map(String));

// Сохраняет массив ID избранного обратно в localStorage.
function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteIds]));
}

// Проверяет, помечено ли текущее аниме как любимое.
function isFavorite(id) {
    return favoriteIds.has(String(id));
}

// Переключает состояние избранного для текущего аниме.
function toggleFavorite(id) {
    const idStr = String(id);
    if (favoriteIds.has(idStr)) favoriteIds.delete(idStr);
    else favoriteIds.add(idStr);
    saveFavorites();
}

// Формирует HTML-контент дамп-страницы с карточками, метриками и ссылками.
function createDetailHTML(anime) {
    const poster = normalizePoster(anime);
    const genres = extractGenres(anime).join(', ') || '—';
    const year = formatYear(anime);
    const episodes = formatEpisodes(anime);
    const status = anime.status ? anime.status.toUpperCase() : '—';
    const favoriteButtonText = isFavorite(anime.id) ? '★ Уже в избранном' : '☆ Добавить в избранное';
    return `
        <div class="grid gap-6 lg:grid-cols-[260px_1fr]">
            <div class="rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xl">
                <img src="${poster}" alt="${anime.russian || anime.name}" class="w-full h-full object-cover" loading="lazy">
            </div>
            <div class="space-y-5">
                <div class="space-y-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-accent">${anime.kind ? anime.kind.toUpperCase() : 'Аниме'}</p>
                    <h1 class="text-4xl font-extrabold leading-tight text-white">${anime.russian || anime.name}</h1>
                    <p class="text-sm text-soft">${anime.name || ''}</p>
                </div>
                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-4 text-sm">
                        <div class="text-zinc-500 uppercase text-[10px] tracking-[0.25em]">Год</div>
                        <div class="mt-2 text-white">${year}</div>
                    </div>
                    <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-4 text-sm">
                        <div class="text-zinc-500 uppercase text-[10px] tracking-[0.25em]">Эпизоды</div>
                        <div class="mt-2 text-white">${episodes}</div>
                    </div>
                    <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-4 text-sm">
                        <div class="text-zinc-500 uppercase text-[10px] tracking-[0.25em]">Статус</div>
                        <div class="mt-2 text-white">${status}</div>
                    </div>
                    <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-4 text-sm">
                        <div class="text-zinc-500 uppercase text-[10px] tracking-[0.25em]">Рейтинг</div>
                        <div class="mt-2 text-white">${anime.score || '—'}</div>
                    </div>
                </div>
                <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 text-sm space-y-3">
                    <div class="text-zinc-500 uppercase text-[10px] tracking-[0.25em]">Жанры</div>
                    <div class="text-white">${genres}</div>
                </div>
                <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 text-sm text-zinc-300">
                    ${anime.description ? anime.description : '<span class="text-zinc-500">Описание не доступно.</span>'}
                </div>
                <div class="flex flex-wrap gap-3">
                    <a id="play-link" href="#" class="premium-button">Перейти к просмотру</a>
                    <button id="favorite-detail" type="button" class="premium-button">${favoriteButtonText}</button>
                    <a id="shiki-link" href="#" class="rounded-2xl border border-zinc-700 px-6 py-3 text-sm text-zinc-200 hover:border-indigo-500 hover:text-white transition">Открыть на Shikimori</a>
                </div>
            </div>
        </div>
        <div class="mt-8">
            ${createCommentBlock(anime)}
        </div>
    `;
}

// Показывает сообщение об ошибке вместо контента на странице деталей.
function showError(message) {
    const container = document.getElementById('anime-details');
    if (container) container.innerHTML = `<div class="text-center text-red-500">${message}</div>`;
}

// Запрашивает подробные данные аниме по id через backend-прокси.
async function fetchDetail(id) {
    const resp = await fetch(`/api/shiki?id=${encodeURIComponent(id)}`);
    if (!resp.ok) throw new Error('Не удалось загрузить подробности');
    return resp.json();
}

// Инициализирует страницу детализации: извлекает id, загружает данные и вешает события.
async function init() {
    const id = qs('id');
    if (!id) return showError('ID аниме не указан.');
    const container = document.getElementById('anime-details');

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

    // Если данные не найдены в sessionStorage или не достаточно полны, подгружаем детальный запрос.
    if (!anime || !anime.genres || !anime.description) {
        if (container) container.innerHTML = '<div class="text-center text-zinc-500">Загрузка подробностей...</div>';
        try {
            const detail = await fetchDetail(id);
            anime = Array.isArray(detail) ? (detail[0] || anime) : { ...(anime || {}), ...detail };
        } catch (error) {
            console.error(error);
            if (!anime) return showError('Не удалось загрузить аниме.');
        }
    }

    if (!anime) return showError('Аниме не найдено.');
    if (container) container.innerHTML = createDetailHTML(anime);
    const playLink = document.getElementById('play-link');
    if (playLink) playLink.href = `watch.html?id=${encodeURIComponent(id)}`;
    const watchPageLink = document.getElementById('watch-page-link');
    if (watchPageLink) watchPageLink.href = `watch.html?id=${encodeURIComponent(id)}`;
    const shikiLink = document.getElementById('shiki-link');
    if (shikiLink) shikiLink.href = `https://shikimori.one${anime.url || ''}`;
    const favoriteDetail = document.getElementById('favorite-detail');
    if (favoriteDetail) {
        favoriteDetail.addEventListener('click', () => {
            toggleFavorite(anime.id);
            favoriteDetail.textContent = isFavorite(anime.id) ? '★ Уже в избранном' : '☆ Добавить в избранное';
        });
    }
}

window.addEventListener('DOMContentLoaded', init);
