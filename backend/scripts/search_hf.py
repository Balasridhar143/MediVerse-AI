import urllib.request
import json

queries = [
    "india medicine",
    "indian medical",
    "clinical lab",
    "medical guidelines",
    "disease surveillance india",
    "icd10",
    "medlineplus",
    "pubmed",
    "medical qa"
]

for q in queries:
    u = f"https://huggingface.co/api/datasets?search={urllib.parse.quote(q)}&limit=5"
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            print(f"=== Query: '{q}' ({len(data)} results) ===")
            for item in data:
                print(f"  - {item.get('id')} (downloads: {item.get('downloads', 0)}, likes: {item.get('likes', 0)})")
    except Exception as e:
        print(f"Query '{q}' error: {e}")
