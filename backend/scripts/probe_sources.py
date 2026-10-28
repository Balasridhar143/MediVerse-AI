import urllib.request
import json
import ssl
import sys

ctx = ssl.create_default_context()

urls = [
    ("Healthsites API", "https://healthsites.io/api/v2/facilities/?format=json&country=India&page=1"),
    ("Mendeley API MCLD", "https://data.mendeley.com/public-api/datasets/xxkd3kjfdd/1"),
    ("HuggingFace Datasets API", "https://huggingface.co/api/datasets?search=india+health"),
    ("HuggingFace Medical Datasets API", "https://huggingface.co/api/datasets?search=medical"),
    ("OpenStreetMap Overpass Count", "https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%5Btimeout%3A15%5D%3Barea%5B%22ISO3166-1%22%3D%22IN%22%5D%5Badmin_level%3D2%5D-%3E.searchArea%3B(node%5B%22amenity%22%3D%22hospital%22%5D(area.searchArea)%3B)%3Bout%20count%3B"),
    ("Data.gov.in Hospital Directory Resource", "https://api.data.gov.in/resource/719d5506-e78a-4c8d-b387-91104e138802?api-key=test&format=json"),
    ("GitHub LabQAR", "https://raw.githubusercontent.com/balubhasuran/LabQAR/master/data/sample_lab_tests.csv")
]

for name, u in urls:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
            data = resp.read(2048)
            print(f"[{name}] HTTP {resp.status} - First 120 bytes: {data[:120]}")
    except Exception as e:
        print(f"[{name}] Failed: {e}")
