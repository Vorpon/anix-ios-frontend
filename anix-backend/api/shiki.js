export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { search, page = 1, limit = 30 } = req.query;
    
    // Стабильные ноды Shikimori
    const targets = [
        'https://shikimori.me/api/animes',
        'https://shiki.me/api/animes',
        'https://shikimori.one/api/animes'
    ];

    // Динамически и безопасно собираем query-параметры
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('page', page);
    
    // Если поиск пустой, сортируем по популярности. 
    // ВАЖНО: Сам Shikimori рекомендует НЕ передавать order=popularity одновременно с поисковым запросом search, иначе поиск работает некорректно.
    if (search && search.trim() !== '') {
        params.append('search', search.trim());
    } else {
        params.append('order', 'popularity');
    }

    for (const baseApi of targets) {
        try {
            // Формируем финальный чистый URL
            const finalUrl = `${baseApi}?${params.toString()}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4500);

            const response = await fetch(finalUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    return res.status(200).json(data);
                }
            }
        } catch (error) {
            console.error(`Ошибка на зеркале ${baseApi}:`, error.message);
        }
    }

    // Если все зеркала промолчали, отдаем пустой массив, чтобы фронтенд не зависал в состоянии загрузки
    return res.status(200).json([]);
}