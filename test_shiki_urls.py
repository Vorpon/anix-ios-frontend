import urllib.request, ssl
urls = [
    'https://shiki.me',
    'https://shiki.me/animes/1',
    'https://shiki.me/anime/1',
    'https://shiki.me/animes/61316-...'
]
ctx = ssl.create_default_context()
for url in urls:
    print('URL', url)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
            print(' code', r.getcode())
            print(' first200', r.read(200).decode('utf-8','ignore').replace('\n',' ').replace('\r',' '))
    except Exception as e:
        print(' ERR', e)
    print()