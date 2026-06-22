import urllib.request, ssl
urls = [
    'https://shikimori.one/animes/16498-shingeki-no-kyojin',
    'https://aniworld.to/anime/stream/dr-stone/staffel-4',
    'https://animevost.org/',
    'https://shiki.me',
    'https://shikimori.one',
]
ctx = ssl.create_default_context()
for url in urls:
    print('URL', url)
    req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            print(' code', resp.getcode())
            print(' X-Frame-Options', resp.headers.get('X-Frame-Options'))
            print(' Content-Security-Policy', resp.headers.get('Content-Security-Policy'))
            print(' server', resp.headers.get('Server'))
    except Exception as e:
        print(' ERR', e)
    print()