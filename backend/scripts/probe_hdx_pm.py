import urllib.request
import json

def test_url(u, name):
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            print(f'[{name}] SUCCESS ({len(data)} bytes)')
            return data
    except Exception as e:
        print(f'[{name}] FAIL: {e}')
        return None

# Test HDX
data = test_url('https://data.humdata.org/api/3/action/package_show?id=hotosm_ind_health_facilities', 'HDX Package Show')
if data:
    d = json.loads(data)
    resources = d.get('result', {}).get('resources', [])
    print(f'HDX resources found: {len(resources)}')
    for r in resources:
        print(f" - {r.get('name')}: {r.get('format')} -> {r.get('url')}")

# Test github planemad
data_pm = test_url('https://api.github.com/repos/planemad/india_health_facilities/contents', 'PlaneMad Contents')
if data_pm:
    pm = json.loads(data_pm)
    print('PlaneMad files:', [f.get('name') for f in pm if isinstance(f, dict)])
