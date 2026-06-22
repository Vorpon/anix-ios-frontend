const API_URL = 'https://anix-backend-eight.vercel.app/api/shiki';
const SHIKI_BASE = 'https://shikimori.one';

const animeListContainer = document.getElementById('anime-list');
const searchInput = document.getElementById('search-input');
const genreFilterList = document.getElementById('genre-filter-list');
const topTagsContainer = document.getElementById('top-tags');
const featuredSection = document.getElementById('featured-section');

// Новые фильтры (добавляем безопасную инициализацию)
const sortFilter = document.getElementById('sort-filter');
const groupBySelect = document.getElementById('group-by');
const ratingMinInput = document.getElementById('rating-min');
const ratingMaxInput = document.getElementById('rating-max');

let allAnime = []; 
let searchResults = [];
let isSearchingMode = false;

let currentPage = 1;
const animePerPage = 30;
let isLoading = false;
let hasMoreAnime = true;
let currentSearchQuery = '';

function renderSkeletons(clear = false) {
    if (!animeListContainer) return;
    if (clear) animeListContainer.innerHTML = '';
    let skeletonHtml = '';
    for (let i = 0; i < 12; i++) {
        skeletonHtml += `
            <div class="flex flex-col gap-3 animate-pulse">
                <div class="w-full aspect-[3/4] bg-zinc-900/60 rounded-2xl"></div>
                <div class="h-4 bg-zinc-900/40 rounded-md w-3/4"></div>
            </div>
        `;
    }
    animeListContainer.insertAdjacentHTML('beforeend', skeletonHtml);
}

async function fetchAnime(searchQuery = '', isNewSearch = false) {
    if (!animeListContainer) return;
    if (isLoading || (!hasMoreAnime && !isNewSearch)) return;
    isLoading = true;
    currentSearchQuery = searchQuery;

    isSearchingMode = searchQuery.trim() !== '';

    if (isNewSearch) {
        currentPage = 1;
        hasMoreAnime = true;
        renderSkeletons(true);
    } else {
        renderSkeletons(false);
    }

    try {
        let url = `${API_URL}?limit=${animePerPage}&page=${currentPage}`;
        if (isSearchingMode) url += `&search=${encodeURIComponent(searchQuery)}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка бэкенда');
        const newAnimeList = await response.json();

        const activePulseNodes = animeListContainer.querySelectorAll('.animate-pulse');
        activePulseNodes.forEach(n => n.remove());

        if (!newAnimeList || newAnimeList.length < animePerPage) {
            hasMoreAnime = false;
        }

        if (isSearchingMode) {
            if (currentPage === 1) searchResults = newAnimeList;
            else searchResults = [...searchResults, ...newAnimeList];
        } else {
            if (currentPage === 1) {
                allAnime = newAnimeList;
                sessionStorage.setItem('anix_allAnime', JSON.stringify(allAnime));
                populateFilters(allAnime);
                renderFeaturedSection(allAnime);
            } else {
                allAnime = [...allAnime, ...newAnimeList];
            }
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
            animeListContainer.insertAdjacentHTML('beforeend', `<div id="scroll-loader" class="col-span-full text-center py-6 text-zinc-600 text-xs animate-pulse font-medium">Загрузка релизов...</div>`);
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
                <p class="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">${anime.kind ? anime.kind.toUpperCase() : 'TV'}</p>
                <h3 class="font-bold text-zinc-100 text-sm leading-tight line-clamp-2">${anime.russian || anime.name}</h3>
            </div>
        </div>
    `;
    card.addEventListener('click', () => {
        location.href = `anime.html?id=${anime.id}`;
    });
    animeListContainer.appendChild(card);
}

function renderFeaturedSection(list) {
    if (!featuredSection || !list.length) return;
    const topAnime = list.find(a => parseFloat(a.score) >= 8.0) || list[0];
    if (!topAnime) return;
    
    const posterUrl = `https://images.weserv.nl/?url=${encodeURIComponent(SHIKI_BASE + topAnime.image.original)}`;
    
    featuredSection.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6 items-center p-2">
            <img src="${posterUrl}" class="w-28 h-40 object-cover rounded-xl border border-zinc-800 shadow-md shrink-0">
            <div class="flex-1 text-center md:text-left">
                <span class="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2.5 py-1 rounded-md border border-indigo-500/20 uppercase tracking-widest">Рекомендация</span>
                <h2 class="text-xl font-black text-white mt-2">${topAnime.russian || topAnime.name}</h2>
                <p class="text-zinc-400 text-xs mt-1 line-clamp-2">Популярный релиз с высоким рейтингом зрителей (★ ${topAnime.score}). Доступен для просмотра прямо сейчас.</p>
                <button id="play-featured" class="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95">Смотреть</button>
            </div>
        </div>
    `;
    document.getElementById('play-featured').onclick = () => {
        location.href = `anime.html?id=${topAnime.id}`;
    };
}

function populateFilters(list) {
    if (!topTagsContainer || !list.length) return;
    const genres = new Set();
    list.forEach(a => {
        if (a.genres) a.genres.forEach(g => genres.add(typeof g === 'string' ? g : g.name));
    });
    topTagsContainer.innerHTML = '';
    Array.from(genres).slice(0, 8).forEach(g => {
        topTagsContainer.insertAdjacentHTML('beforeend', `<button class="filter-chip bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl text-xs font-medium hover:border-zinc-700 transition-all" data-value="${g}">${g}</button>`);
    });
}

function applyFilters() {
    if (!animeListContainer) return;
    animeListContainer.innerHTML = '';
    const listToRender = isSearchingMode ? searchResults : allAnime;
    
    if (listToRender.length === 0 && isSearchingMode) {
        animeListContainer.innerHTML = `<div class="col-span-full text-center py-20 text-zinc-500 text-sm">Ничего не найдено по запросу "${currentSearchQuery}"</div>`;
        return;
    }
    listToRender.forEach((anime, index) => createAnimeCard(anime, index));
}

function handleScroll() {
    if (!hasMoreAnime || isLoading) return;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 400) {
        fetchAnime(currentSearchQuery, false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (searchInput) {
        let timer = null;
        searchInput.addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => fetchAnime(e.target.value.trim(), true), 400);
        });
    }
    window.addEventListener('scroll', handleScroll);

    // БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ: Добавляем слушатели только если элементы реально существуют в HTML
    [sortFilter, groupBySelect, ratingMinInput, ratingMaxInput].forEach(el => {
        if (el) {
            el.addEventListener('change', applyFilters);
            el.addEventListener('input', applyFilters);
        }
    });

    fetchAnime('', true);
});