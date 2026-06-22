import urllib.request, ssl, re

sites = {
    'animehub': 'https://animehub.ac',
    'animevibe': 'https://animevibe.tv',
    '9anime': 'https://9anime.to',
}
ctx = ssl.create_default_context()
for name, url in sites.items():
    print('SITE', name, url)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
            html = r.read(20000).decode('utf-8', 'ignore')
            print(' status', r.getcode())
            forms = re.findall(r'(<form.*?>.*?</form>)', html, re.S | re.I)
            print(' forms', len(forms))
            for i, form in enumerate(forms[:10], 1):
                action = re.search(r'action=["\']([^"\']+)["\']', form, re.I)
                method = re.search(r'method=["\']([^"\']+)["\']', form, re.I)
                print(' form', i, 'action', action.group(1) if action else None, 'method', method.group(1) if method else None)
                names = re.findall(r'name=["\']([^"\']+)["\']', form, re.I)
                print('  inputs', names)
                if 'search' in form.lower() or 'keyword' in form.lower():
                    print('  snippet', form[:200].replace('\n',' ').replace('\r',' '))
            print(' ----')
            if name == 'animehub':
                m = re.search(r'var search_url\s*=\s*["\']([^"\']+)["\']', html)
                if m: print(' js search_url', m.group(1))
            print(' contains search.js', 'search' in html.lower())
    except Exception as e:
        print(' ERR', e)
    print()
