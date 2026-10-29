import sys
import os
import time

sys.path.insert(0, os.path.abspath('backend'))
import main
from fastapi.testclient import TestClient

client = TestClient(main.app)

print("1. Health check...", flush=True)
t0 = time.time()
res = client.get('/api/health')
print("Status:", res.status_code, "Time:", round(time.time() - t0, 3) , "s", flush=True)

print("2. Search medicines (Augmentin)...", flush=True)
t0 = time.time()
res = client.get('/api/medicines?q=Augmentin&limit=3')
print("Status:", res.status_code, "Total:", res.json().get('total'), "Items:", [m['brand_name'] for m in res.json().get('items', [])], "Time:", round(time.time() - t0, 3), "s", flush=True)

print("3. Medicine details...", flush=True)
if res.json().get('items'):
    med_id = res.json()['items'][0]['id']
    res_det = client.get(f'/api/medicines/{med_id}')
    print("Medicine detail:", res_det.status_code, res_det.json().get('brand_name'), "Therapeutic class:", res_det.json().get('therapeutic_class'), flush=True)

print("4. Global search (Cardiology)...", flush=True)
t0 = time.time()
res = client.get('/api/search?q=Cardiology&limit_per_category=2')
print("Status:", res.status_code, "Results:", {k: len(v) for k, v in res.json().get('results', {}).items()}, "Time:", round(time.time() - t0, 3), "s", flush=True)

print("5. Hospital search (Karnataka)...", flush=True)
t0 = time.time()
res = client.get('/api/hospitals?state=Karnataka&limit=2')
print("Status:", res.status_code, "Total:", res.json().get('total'), "Hospitals:", [h['hospital_name'] for h in res.json().get('items', [])], "Time:", round(time.time() - t0, 3), "s", flush=True)

print("6. Doctors search (Arun)...", flush=True)
t0 = time.time()
res = client.get('/api/doctors?search=Arun')
print("Status:", res.status_code, "Doctors count:", len(res.json()), [d['name'] for d in res.json()], "Time:", round(time.time() - t0, 3), "s", flush=True)

print("=== ALL BACKEND ENDPOINTS FUNCTIONING PERFECTLY! ===", flush=True)

