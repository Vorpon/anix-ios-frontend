const API_URL = 'https://anix-backend-eight.vercel.app/api/shiki';
const SHIKI_BASE = 'https://shikimori.one';

const animeListContainer = document.getElementById('anime-list');
const searchInput = document.getElementById('search-input');
const genreFilterList = document.getElementById('genre-filter-list');
const yearFilterList = document.getElementById('year-filter-list');
const topTagsContainer = document.getElementById('top-tags');
const featuredSection = document.getElementById('featured-section');
const modal = document.getElementById('player-modal');
const playerTitle = document.getElementById('player-title');
const closeBtn = document.getElementById('close-player');

let allAnime = [];
let selectedGenres = new Set();
let selectedYears = new Set();
const FAVORITES_KEY = 'anix_favorites';
let favoriteIds = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]').map(String));

// Скролл-переменные
let currentPage = 1;
const animePerPage = 30;
let isLoading = false;
let hasMoreAnime = true;
let currentSearchQuery = '';

function isFavorite(id) { return favoriteIds.has(String(id)); }

function renderSkeletons(clear = false) {
    if (clear) animeListContainer.innerHTML = '';
    let skeletonHtml = '';
    for (let i = 0; i < 12; i++) {
        skeletonHtml += `
            <div class="flex flex-col gap-3 animate-pulse">
                <div class="w-full aspect-[3/4] bg-zinc-900 rounded-2xl"></div>
                <div class="h-4 bg-zinc-900 rounded-md w-3/4"></div>
            </div>
        `;
    }
    animeListContainer.insertAdjacentHTML('beforeend', skeletonHtml);
}

async function fetchAnime(searchQuery = '', isNewSearch = false) {
    if (isLoading || (!hasMoreAnime && !isNewSearch)) return;
    isLoading = true;
    currentSearchQuery = searchQuery;

    if (isNewSearch) {
        currentPage = 1;
        hasMoreAnime = true;
        renderSkeletons(true);
    } else {
        renderSkeletons(false);
    }

    try {
        let url = `${API_URL}?limit=${animePerPage}&page=${currentPage}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка бэкенда');
        const newAnimeList = await response.json();

        const activePulseNodes = animeListContainer.querySelectorAll('.animate-pulse');
        activePulseNodes.forEach(n => n.remove());

        if (!newAnimeList || newAnimeList.length < animePerPage) {
            hasMoreAnime = false;
        }

        if (currentPage === 1) {
            allAnime = newAnimeList;
            populateFilters(allAnime);
            renderFeaturedSection(allAnime);
        } else {
            allAnime = [...allAnime, ...newAnimeList];
        }

        applyFilters();
        currentPage++;
    } catch (error) {
        console.error(error);
        const activePulseNodes = animeListContainer.querySelectorAll('.animate-pulse');
        activePulseNodes.forEach(n => n.remove());
        if (currentPage === 1) {
            animeListContainer.innerHTML = '<div class="col-span-full text-center text-red-400 py-20">Ошибка загрузки базы данных.</div>';
        }
    } finally {
        isLoading = false;
        const oldLoader = document.getElementById('scroll-loader');
        if (oldLoader) oldLoader.remove();
        if (hasMoreAnime) {
            animeListContainer.insertAdjacentHTML('beforeend', `<div id="scroll-loader" class="col-span-full text-center py-6 text-zinc-600 text-xs animate-pulse">Загрузка релизов...</div>`);
        }
    }
}

function createAnimeCard(anime, index) {
    const posterUrl = `https://images.weserv.nl/?url=${encodeURIComponent(SHIKI_BASE + anime.image.original)}&w=300&q=80`;
    const card = document.createElement('div');
    card.className = 'flex flex-col group cursor-pointer animate-fade-in relative';
    card.style.animationDelay = `${(index % 6) * 0.04}s`;
    
    card.innerHTML = `
        <div class="relative w-full aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800/60 shadow-lg group-hover:border-zinc-700 transition-all duration-300 group-hover:-translate-y-1.5 flex flex-col justify-end">
            <img src="${posterUrl}" alt="${anime.russian || anime.name}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-90"></div>
            <div class="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-lg border border-zinc-800">
                ★ ${anime.score}
            </div>
            <div class="p-3.5 z-10">
                <p class="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">${anime.kind.toUpperCase()}</p>
                <h3 class="font-bold text-zinc-100 text-sm leading-tight line-clamp-2">${anime.russian || anime.name}</h3>
            </div>
        </div>
    `;
    card.addEventListener('click', () => openPlayerModal(anime));
    animeListContainer.appendChild(card);
}

function renderFeaturedSection(list) {
    if (!featuredSection) return;
    const topAnime = list.find(a => parseFloat(a.score) >= 8.5);
    if (!topAnime) {
        featuredSection.classList.add('hidden');
        return;
    }
    featuredSection.classList.remove('hidden');
    const posterUrl = `https://images.weserv.nl/?url=${encodeURIComponent(SHIKI_BASE + topAnime.image.original)}`;
    
    featuredSection.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6 items-center p-2">
            <img src="${posterUrl}" class="w-32 h-44 object-cover rounded-xl border border-zinc-800 shadow-md shrink-0">
            <div class="flex-1 text-center md:text-left">
                <span class="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2.5 py-1 rounded-md border border-indigo-500/20 uppercase tracking-widest">Хит сезона</span>
                <h2 class="text-2xl font-black text-white mt-2">${topAnime.russian || topAnime.name}</h2>
                <p class="text-zinc-400 text-xs mt-1 line-clamp-3">Популярный релиз с высоким рейтингом зрителей (★ ${topAnime.score}). Нажмите кнопку ниже для мгновенного просмотра.</p>
                <button id="play-featured" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95">Смотреть сейчас</button>
            </div>
        </div>
    `;
    document.getElementById('play-featured').onclick = () => openPlayerModal(topAnime);
}

function populateFilters(list) {
    if (!genreFilterList || !yearFilterList || !topTagsContainer) return;
    const genres = new Set();
    const years = new Set();
    
    list.forEach(a => {
        if (a.genres) a.genres.forEach(g => genres.add(typeof g === 'string' ? g : g.name));
        if (a.aired_on) { const y = a.aired_on.split('-')[0]; if(y) years.add(y); }
    });

    // Отрендерим топ тегов (первые 6 жанров)
    topTagsContainer.innerHTML = '';
    Array.from(genres).slice(0, 6).forEach(g => {
        topTagsContainer.insertAdjacentHTML('beforeend', `<button class="filter-chip bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl text-xs font-medium hover:border-zinc-700 transition-all" data-type="genre" data-value="${g}">${g}</button>`);
    });
}

function applyFilters() {
    animeListContainer.innerHTML = '';
    allAnime.forEach((anime, index) => createAnimeCard(anime, index));
}

/**
 * Корректный запуск видеобалансера Kinobox
 */
function openPlayerModal(anime) {
    playerTitle.textContent = anime.russian || anime.name;
    
    // Очищаем контейнер плеера перед новым запуском
    const playerContainer = document.getElementById('kinobox-player');
    if (playerContainer) playerContainer.innerHTML = '';

    // Показываем модальное окно
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('.transform').classList.remove('scale-95');
        
        try {
            // Инициализируем Kinobox строго после того, как контейнер стал видимым
            new kBox('#kinobox-player', {
                search: { 
                    shikimori: String(anime.id) 
                },
                ui: { 
                    theme: 'dark' // Темная премиум-тема под наш дизайн
                },
                players: {
                    // Включаем все доступные пиратские базы данных для максимальной заполненности
                    kodik: { enable: true },
                    vibix: { enable: true },
                    alloha: { enable: true },
                    collaps: { enable: true },
                    tabus: { enable: true }
                }
            }).init();
        } catch (e) {
            console.error("Ошибка инициализации Kinobox:", e);
            // Резервный вариант, если скрипт Kinobox заблокирован или упал
            if (playerContainer) {
                playerContainer.innerHTML = `
                    <div class="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
                        <p class="text-red-400 font-bold text-sm">Внешний видеобалансер недоступен</p>
                        <p class="text-xs text-zinc-500 mt-1 max-w-md">Попробуйте открыть плеер напрямую через базу Kodik или отключите защитные расширения браузера (AdBlock).</p>
                        <a href="https://kodik.biz/find-player?shikimori=${anime.id}" target="_blank" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all">
                            Смотреть на зеркале донора
                        </a>
                    </div>
                `;
            }
        }
    }, 50);
    
    document.body.style.overflow = 'hidden';
}

/**
 * Закрытие плеера с полной очисткой потоков (чтобы звук не шел на фоне)
 */
function closePlayerModal() {
    modal.classList.add('opacity-0');
    modal.querySelector('.transform').classList.add('scale-95');
    
    setTimeout(() => {
        const playerContainer = document.getElementById('kinobox-player');
        if (playerContainer) playerContainer.innerHTML = ''; // Жестко глушим видеопоток
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}

if (closeBtn) closeBtn.addEventListener('click', closePlayerModal);
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closePlayerModal(); });

function handleScroll() {
    if (!hasMoreAnime || isLoading) return;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 400) {
        fetchAnime(currentSearchQuery, false);
    }
}

if (searchInput) {
    let timer = null;
    searchInput.addEventListener('input', e => {
        clearTimeout(timer);
        timer = setTimeout(() => fetchAnime(e.target.value.trim(), true), 400);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('scroll', handleScroll);
    fetchAnime('', true);
});