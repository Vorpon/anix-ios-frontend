import urllib.request
import urllib.error
import ssl

urls = [
    'https://aniworld.to/embed/shikimori/1',
    'https://anihub.net/embed/shikimori/1',
    'https://animego.org/embed/shikimori/1',
    'https://animevost.org/embed/shikimori/1',
    'https://voidboost.cc/embed/1',
    'https://vbshik.com/embed/shikimori/1',
    'https://kodik.link/find?shikimori_id=1',
    'https://shikimori.one',
    'https://shikimori.me',
    'https://shiki.me',
]
ctx = ssl.create_default_context()
for url in urls:
    print('URL:', url)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            print('  code:', resp.getcode())
            data = resp.read(800).decode('utf-8', 'ignore')
            print('  snippet:', data[:300].replace('\n', ' ').replace('\r', ' '))
    except urllib.error.HTTPError as e:
        print('  HTTP:', e.code, e.reason)
        try:
            body = e.read(300).decode('utf-8', 'ignore')
            print('  body:', body.replace('\n', ' ').replace('\r', ' '))
        except Exception as ex:
            print('   body-error:', ex)
    except Exception as e:
        print('  ERR:', e)
    print()