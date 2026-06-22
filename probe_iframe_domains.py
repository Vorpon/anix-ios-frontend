import urllib.request
import urllib.error
import ssl

domains = [
    'https://zoro.to',
    'https://gogoanime.pe',
    'https://yugen.to',
    'https://9anime.to',
    'https://animevibe.tv',
    'https://animixplay.to',
    'https://gogoanime.gratis',
    'https://animepahe.com',
    'https://gogoplay.io',
    'https://animehub.ac',
    'https://kissanime.nz',
    'https://animekisa.tv',
    'https://mangakisa.net',
    'https://aniworld.to',
    'https://animevost.org',
    'https://shiki.me',
    'https://shikimori.one',
]
ctx = ssl.create_default_context()
for domain in domains:
    for path in ['', '/search?keyword=naruto', '/search?keyword=dr+stone', '/search?keyword=one+piece', '/watch/one-piece-episode-1']:
        url = domain + path
        print('URL', url)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
                code = resp.getcode()
                xfo = resp.headers.get('X-Frame-Options')
                csp = resp.headers.get('Content-Security-Policy')
                print(' code', code, 'XFO', xfo, 'CSP', bool(csp))
        except urllib.error.HTTPError as e:
            print(' HTTP', e.code, e.reason)
        except Exception as e:
            print(' ERR', e)
    print()