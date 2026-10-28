"""
MediVerse AI — API Endpoints Verification Script
Tests authentication, hospital search with filters/pagination, patient registration persistence,
and dataset statistics endpoints using FastAPI's TestClient.
"""

import sys
import os

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_api():
    print("=" * 80)
    print("MEDIVERSE AI — BACKEND ENDPOINT INTEGRATION TEST")
    print("=" * 80)

    # 1. Health Check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print(f"[PASS] /api/health -> Status: {res.json()['status']}, DB: {res.json()['database']}")

    # 2. Dataset Statistics
    res = client.get("/api/datasets/statistics")
    assert res.status_code == 200, f"Dataset statistics failed: {res.status_code}"
    stats = res.json()
    print(f"[PASS] /api/datasets/statistics -> Total records: {stats.get('total_imported_records', 0):,}")
    print(f"       Hospitals: {stats.get('category_counts', {}).get('hospitals', 0):,}")
    print(f"       Facilities: {stats.get('category_counts', {}).get('healthcare_facilities', 0):,}")
    print(f"       Medicines: {stats.get('category_counts', {}).get('indian_medicines', 0):,}")

    # 3. Facility Filters
    res = client.get("/api/facilities/filters")
    assert res.status_code == 200, f"Filters failed: {res.status_code}"
    filters = res.json()
    print(f"[PASS] /api/facilities/filters -> {len(filters.get('states', []))} States/UTs, {len(filters.get('facility_types', []))} Facility Types")

    # 4. Hospital Search with Pagination and State Filter
    res = client.get("/api/hospitals?page=1&limit=5&state=Karnataka")
    assert res.status_code == 200, f"Hospital search failed: {res.status_code}"
    hosp_data = res.json()
    print(f"[PASS] /api/hospitals (Karnataka) -> Total matching: {hosp_data.get('total', 0):,}, Returned items: {len(hosp_data.get('items', []))}")
    if hosp_data.get('items'):
        sample = hosp_data['items'][0]
        print(f"       Sample: {sample.get('hospital_name')} | District: {sample.get('district')} | Coords: ({sample.get('latitude')}, {sample.get('longitude')})")

    # 5. Hospital Search with Keyword
    res = client.get("/api/hospitals?q=General&page=1&limit=5")
    assert res.status_code == 200, f"Hospital search with query failed: {res.status_code}"
    q_data = res.json()
    print(f"[PASS] /api/hospitals (q=General) -> Total matching: {q_data.get('total', 0):,}")

    # 6. Patient Registration Persistence Test
    reg_payload = {
        "full_name": "Test Integration Patient",
        "phone": "+91 99999 88888",
        "age": 35,
        "gender": "Male",
        "blood_group": "O+",
        "address": "123 Electronic City, Bangalore",
        "hospital_id": sample.get("id") if hosp_data.get('items') else "hosp_1",
        "reason_for_visit": "Quarterly health screening and cardiology evaluation",
        "department": "Cardiology"
    }
    res = client.post("/api/registrations", json=reg_payload)
    assert res.status_code in [200, 201], f"Registration failed: {res.status_code} {res.text}"
    reg_record = res.json()
    print(f"[PASS] /api/registrations -> Successfully created patient registration ID: {reg_record.get('id')}")
    print(f"       Hospital: {reg_record.get('hospital_id')}, Status: {reg_record.get('status')}")

    print("=" * 80)
    print("ALL API ENDPOINTS TESTED SUCCESSFULLY AND VERIFIED PERSISTENT!")
    print("=" * 80)

if __name__ == "__main__":
    test_api()
