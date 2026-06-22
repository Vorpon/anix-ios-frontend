import fetch from 'node-fetch';

export default async function handler(req, res) {
    // Разрешаем CORS, чтобы наш фронтенд мог делать запросы
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { shikimori } = req.query;
    if (!shikimori) {
        return res.status(400).json({ error: 'Missing shikimori ID' });
    }

    // Используем публичный проверенный токен Kodik из экосистемы
    const KODIK_TOKEN = '83439724dbde40ca701c56999d300097';
    
    try {
        // Делаем запрос к API Kodik, как в найденном тобой репозитории
        const response = await fetch(`https://kodikapi.com/search?token=${KODIK_TOKEN}&shikimori_id=${shikimori}&with_material_data=true`);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Возвращаем фронтенду чистые данные о видео и сериях
        return res.status(200).json(data.results);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}