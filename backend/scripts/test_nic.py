import urllib.request

urls = [
    ("NIC Health Facilities", "https://raw.githubusercontent.com/planemad/india_health_facilities/master/map/public_health_facilities_nic.geojson"),
    ("Karnataka KGIS Facilities", "https://raw.githubusercontent.com/planemad/india_health_facilities/master/map/karnataka_health_facilities_kgis.geojson")
]

for name, u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"[{name}] SUCCESS: Length = {resp.headers.get('Content-Length')} bytes")
    except Exception as e:
        print(f"[{name}] FAIL: {e}")
