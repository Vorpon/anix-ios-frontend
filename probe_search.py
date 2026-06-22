import ssl
import urllib.request
import urllib.parse
import re

ctx = ssl.create_default_context()
for site in ['https://animevost.org', 'https://aniworld.to']:
    for query in ['shingeki+no+kyojin', 'dr+stone', 'one+piece']:
        url = f"{site}/index.php?do=search&subaction=search&story={query}"
        print('SITE', site, 'QUERY', query)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
                html = resp.read(20000).decode('utf-8', 'ignore')
                print(' status', resp.getcode())
                links = re.findall(r'href=["\']([^"\']+)["\']', html)
                links = [l for l in links if 'anime' in l.lower() or 'stream' in l.lower() or 'watch' in l.lower() or 'episode' in l.lower()]
                print(' candidate links', len(links))
                for l in links[:20]:
                    print(' ', l)
        except Exception as e:
            print(' ERR', e)
        print()