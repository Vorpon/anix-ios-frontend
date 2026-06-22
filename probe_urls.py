import urllib.request
import urllib.error
import ssl
import re

sites = [
    'https://aniworld.to',
    'https://animevost.org',
    'https://animego.org',
    'https://shikimori.one',
]
ctx = ssl.create_default_context()
for site in sites:
    print('SITE', site)
    req = urllib.request.Request(site, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
            html = resp.read(20000).decode('utf-8', 'ignore')
            print(' status', resp.getcode())
            urls = re.findall(r'(https?://[^"\'\s<>]+)', html)
            matches = [u for u in urls if any(k in u.lower() for k in ['embed', 'player', 'watch', 'anime', 'series', 'video', 'cdn', 'shikimori', 'shiki'])]
            print(' found', len(matches), 'candidate URLs')
            for u in matches[:80]:
                print('  ', u)
    except Exception as e:
        print(' ERR', e)
    print()