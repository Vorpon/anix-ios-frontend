import urllib.request, ssl, urllib.error

candidates = [
    'https://gogoanime.pe/search.html?keyword=one+piece',
    'https://animevibe.tv/search?keyword=one+piece',
    'https://animehub.ac/search?keyword=one+piece',
    'https://gogoanime.pe/watch/one-piece-episode-1',
    'https://animevibe.tv/watch/one-piece-episode-1',
    'https://animehub.ac/watch/one-piece-episode-1',
    'https://www.totalav.com',
]
ctx = ssl.create_default_context()

for url in candidates:
    print('URL:', url)
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    })
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
            print(' final_url:', r.geturl())
            print(' status:', r.getcode())
            print(' headers:', {k:v for k,v in r.headers.items() if k.lower() in ['content-type','x-frame-options','content-security-policy','location']})
            body = r.read(800).decode('utf-8', 'ignore')
            print(' snippet:', body.replace('\n',' ').replace('\r',' ')[:400])
    except urllib.error.HTTPError as e:
        print(' HTTPError:', e.code, e.reason)
        try:
            body = e.read(800).decode('utf-8', 'ignore')
            print(' snippet:', body.replace('\n',' ').replace('\r',' ')[:400])
        except Exception as ex:
            print(' body error:', ex)
    except Exception as e:
        print(' ERR:', e)
    print()