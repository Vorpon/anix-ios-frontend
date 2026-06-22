import urllib.request, ssl, re
urls = [
    'https://9anime.to/search?keyword=naruto',
    'https://9anime.to/watch/one-piece-episode-1',
    'https://aniwatch.me/search?keyword=naruto',
    'https://aniwatch.me/watch/one-piece-episode-1',
    'https://animehub.ac/search?keyword=naruto',
    'https://animehub.ac/watch/one-piece-episode-1',
]
ctx = ssl.create_default_context()
for url in urls:
    print('URL', url)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
            print(' code', r.getcode())
            print(' final', r.geturl())
            print(' XFO', r.headers.get('X-Frame-Options'))
            print(' CSP', r.headers.get('Content-Security-Policy'))
            html = r.read(1000).decode('utf-8', 'ignore')
            print(' snippet', html[:400].replace('\n',' ').replace('\r',' '))
            m = re.search(r'<iframe[^>]+>', html, re.I)
            print(' iframe tag found', bool(m))
    except Exception as e:
        print(' ERR', e)
    print()