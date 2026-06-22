import urllib.request, ssl
urls = [
    'https://9anime.to/search?keyword=naruto',
    'https://9anime.to/watch/one-piece-episode-1',
    'https://9anime.to/watch/dragon-ball-z-episode-1',
    'https://9anime.to',
]
ctx = ssl.create_default_context()
for url in urls:
    print('URL', url)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
            print(' code', resp.getcode())
            data = resp.read(600).decode('utf-8', 'ignore')
            print(' snippet', data[:300].replace('\n',' ').replace('\r',' '))
            print(' XFO', resp.headers.get('X-Frame-Options'))
            print(' CSP', resp.headers.get('Content-Security-Policy'))
    except Exception as e:
        print(' ERR', e)
    print()