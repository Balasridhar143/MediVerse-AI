import urllib.request

candidates = [
    "https://data.mendeley.com/datasets/xxkd3kjfdd/1/download",
    "https://data.mendeley.com/datasets/xxkd3kjfdd/1/files?format=zip",
    "https://data.mendeley.com/public-files/datasets/xxkd3kjfdd/1",
    "https://data.mendeley.com/download/xxkd3kjfdd/1",
    "https://data.mendeley.com/datasets/xxkd3kjfdd/1"
]

for url in candidates:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"[{url}] -> Status: {resp.status}, Content-Type: {resp.headers.get('Content-Type')}, Length: {resp.headers.get('Content-Length')}")
    except Exception as e:
        print(f"[{url}] -> Failed: {e}")
