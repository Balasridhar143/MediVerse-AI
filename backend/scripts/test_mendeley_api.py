import urllib.request
import json

endpoints = [
    "https://data.mendeley.com/api/datasets/xxkd3kjfdd",
    "https://data.mendeley.com/api/datasets/xxkd3kjfdd/1",
    "https://data.mendeley.com/api/datasets/xxkd3kjfdd/1/files",
    "https://data.mendeley.com/public-api/datasets/xxkd3kjfdd/1",
    "https://api.mendeley.com/datasets/xxkd3kjfdd",
    "https://data.mendeley.com/datasets/xxkd3kjfdd/1/files",
    "https://prod-mendeley-data.s3.amazonaws.com"
]

for ep in endpoints:
    try:
        req = urllib.request.Request(ep, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json'
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"SUCCESS {ep}: Status {resp.status}, Content-Type: {resp.headers.get('Content-Type')}")
            content = resp.read(500)
            print("  First 200 bytes:", content[:200])
    except Exception as e:
        print(f"FAIL {ep}: {e}")
