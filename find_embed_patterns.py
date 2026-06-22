import urllib.request
import urllib.error
import ssl

sites = [
    'https://aniworld.to',
    'https://anihub.net',
    'https://animego.org',
    'https://animevost.org',
    'https://animevost.tv',
    'https://animego.org',
    'https://shikimori.one',
    'https://shikimori.me',
    'https://shiki.me',
]

ctx = ssl.create_default_context()
for url in sites:
    print('SITE', url)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
            html = resp.read(5000).decode('utf-8', 'ignore')
            lower = html.lower()
            print('  status', resp.getcode())
            print('  contains embed', 'embed' in lower)
            print('  contains iframe', 'iframe' in lower)
            print('  contains shikimori', 'shikimori' in lower)
            print('  contains player', 'player' in lower)
            for token in ['embed/shikimori', 'shikimori/', 'find?shikimori', 'player', 'iframe', 'cdn', 'watch', 'shiki']:
                if token in lower:
                    print('   token', token)
    except Exception as e:
        print('  ERR', e)
    print()