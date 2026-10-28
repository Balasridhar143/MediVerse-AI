import urllib.request
import json

url = "https://data.humdata.org/api/3/action/package_search?q=health+india&rows=20"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        d = json.loads(resp.read())
        results = d.get('result', {}).get('results', [])
        print(f"Found {d.get('result', {}).get('count')} datasets on HDX for 'health india':")
        for pkg in results[:15]:
            print(f"- {pkg.get('name')}: {pkg.get('title')} (Resources: {len(pkg.get('resources', []))})")
            for r in pkg.get('resources', [])[:3]:
                print(f"    * {r.get('name')} [{r.get('format')}]: {r.get('url')}")
except Exception as e:
    print(f"Error: {e}")
