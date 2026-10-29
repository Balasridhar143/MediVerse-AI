import sqlite3
import json
import os
import re

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "mediverse.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Canonical mapping for Indian States and Union Territories (28 States + 8 UTs)
STATE_NORMALIZATION_MAP = {
    "mahārāshtra": "Maharashtra",
    "maharashtra": "Maharashtra",
    "tamil nādu": "Tamil Nadu",
    "tamilnadu": "Tamil Nadu",
    "tamil nadu": "Tamil Nadu",
    "gujarāt": "Gujarat",
    "gujarat": "Gujarat",
    "kerala": "Kerala",
    "andhra pradesh": "Andhra Pradesh",
    "uttar pradesh": "Uttar Pradesh",
    "uttarpradesh": "Uttar Pradesh",
    "karnātaka": "Karnataka",
    "karnataka": "Karnataka",
    "punjab": "Punjab",
    "telangāna": "Telangana",
    "telangana": "Telangana",
    "rājasthān": "Rajasthan",
    "rajasthan": "Rajasthan",
    "madhya pradesh": "Madhya Pradesh",
    "west bengal": "West Bengal",
    "haryāna": "Haryana",
    "haryana": "Haryana",
    "odisha": "Odisha",
    "orissa": "Odisha",
    "bihār": "Bihar",
    "bihar": "Bihar",
    "jhārkhand": "Jharkhand",
    "jharkhand": "Jharkhand",
    "chhattīsgarh": "Chhattisgarh",
    "chattisgarh": "Chhattisgarh",
    "chhattisgarh": "Chhattisgarh",
    "delhi": "Delhi",
    "assam": "Assam",
    "uttarākhand": "Uttarakhand",
    "uttarakhand": "Uttarakhand",
    "himāchal pradesh": "Himachal Pradesh",
    "himachal pradesh": "Himachal Pradesh",
    "goa": "Goa",
    "manipur": "Manipur",
    "nāgāland": "Nagaland",
    "nagaland": "Nagaland",
    "puducherry": "Puducherry",
    "pondicherry": "Puducherry",
    "meghālaya": "Meghalaya",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "tripura": "Tripura",
    "dādra and nagar haveli and damān and diu": "Dadra and Nagar Haveli and Daman and Diu",
    "dadar & nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
    "daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
    "chandīgarh": "Chandigarh",
    "chandigarh": "Chandigarh",
    "sikkim": "Sikkim",
    "andaman and nicobar islands": "Andaman and Nicobar Islands",
    "andaman & nicobar": "Andaman and Nicobar Islands",
    "arunāchal pradesh": "Arunachal Pradesh",
    "arunachal pradesh": "Arunachal Pradesh",
    "lakshadweep": "Lakshadweep",
    "ladakh": "Ladakh",
    "jammu and kashmir": "Jammu and Kashmir",
    "jammu & kashmir": "Jammu and Kashmir",
}

print("Normalizing state names across tables in mediverse.db...")

# 1. Update hospitals table
c.execute("SELECT DISTINCT state FROM hospitals")
distinct_states = [row[0] for row in c.fetchall() if row[0]]

hosp_updated = 0
for st in distinct_states:
    key = st.strip().lower()
    if key in STATE_NORMALIZATION_MAP:
        canonical = STATE_NORMALIZATION_MAP[key]
        if canonical != st:
            c.execute("UPDATE hospitals SET state = ? WHERE state = ?", (canonical, st))
            hosp_updated += c.rowcount

print(f"Hospitals updated with canonical states: {hosp_updated} rows")

# 2. Update healthcare_facilities table
c.execute("SELECT DISTINCT state FROM healthcare_facilities")
distinct_fac_states = [row[0] for row in c.fetchall() if row[0]]

fac_updated = 0
for st in distinct_fac_states:
    key = st.strip().lower()
    if key in STATE_NORMALIZATION_MAP:
        canonical = STATE_NORMALIZATION_MAP[key]
        if canonical != st:
            c.execute("UPDATE healthcare_facilities SET state = ? WHERE state = ?", (canonical, st))
            fac_updated += c.rowcount

print(f"Healthcare facilities updated with canonical states: {fac_updated} rows")

# 3. Update professionals table
c.execute("SELECT DISTINCT state FROM professionals")
distinct_prof_states = [row[0] for row in c.fetchall() if row[0]]

prof_updated = 0
for st in distinct_prof_states:
    key = st.strip().lower()
    if key in STATE_NORMALIZATION_MAP:
        canonical = STATE_NORMALIZATION_MAP[key]
        if canonical != st:
            c.execute("UPDATE professionals SET state = ? WHERE state = ?", (canonical, st))
            prof_updated += c.rowcount

print(f"Professionals updated with canonical states: {prof_updated} rows")

# 4. Clean up professionals where commercial clinics were placed as doctor names
NON_DOCTOR_KEYWORDS = [
    "clinic", "hospital", "pathology", "diagnostic", "scan", "centre", "center",
    "laser", "dental", "imaging", "care", "eye institute", "heart institute", "labs", "laboratory"
]

c.execute("SELECT id, name, qualification, specialization FROM professionals")
all_profs = c.fetchall()
profs_cleaned = 0
for p_id, p_name, p_qual, p_spec in all_profs:
    lower_name = p_name.lower().strip()
    # If the name starts with "dr." or "dr ", keep it
    if lower_name.startswith("dr.") or lower_name.startswith("dr "):
        continue
    # If it clearly looks like a facility rather than a person
    if any(kw in lower_name for kw in NON_DOCTOR_KEYWORDS):
        # Prefix Dr. only if it has personal name characteristics, otherwise tag registration_status as 'Clinical Center'
        c.execute("UPDATE professionals SET registration_status = 'Clinical Center' WHERE id = ?", (p_id,))
        profs_cleaned += 1
    else:
        # It's an individual practitioner without 'Dr.' prefix -> Add 'Dr.' for clinical clarity
        c.execute("UPDATE professionals SET name = ? WHERE id = ?", (f"Dr. {p_name.strip()}", p_id))
        profs_cleaned += 1

print(f"Professionals cleaned / categorized: {profs_cleaned} rows")

# 5. Extract state -> districts mapping from database
c.execute("""
    SELECT DISTINCT state, district
    FROM hospitals
    WHERE state IS NOT NULL AND district IS NOT NULL AND state != 'National / Unspecified'
    ORDER BY state, district
""")
pairs = c.fetchall()

location_hierarchy = {}
for state, district in pairs:
    clean_state = state.strip()
    clean_district = district.strip()
    if not clean_state or not clean_district:
        continue
    # Clean district name (remove trailing / state repetitions)
    clean_district = re.sub(r'\s*\([^)]*\)', '', clean_district).strip()
    if clean_district.lower() == clean_state.lower():
        continue
    if clean_state not in location_hierarchy:
        location_hierarchy[clean_state] = set()
    location_hierarchy[clean_state].add(clean_district)

# Convert sets to sorted lists
serialized_hierarchy = {k: sorted(list(v)) for k, v in sorted(location_hierarchy.items())}

# Save to src/data/indianLocationRegistry.json
registry_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "data", "indianLocationRegistry.json")
with open(registry_path, "w", encoding="utf-8") as f:
    json.dump({
        "all_states": sorted(list(serialized_hierarchy.keys())),
        "districts_by_state": serialized_hierarchy
    }, f, indent=2, ensure_ascii=False)

print(f"Saved location registry to {registry_path} with {len(serialized_hierarchy)} states!")

# 6. Update verifiedStatistics.json
stats_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "data", "verifiedStatistics.json")
if os.path.exists(stats_path):
    with open(stats_path, "r", encoding="utf-8") as f:
        stats_data = json.load(f)
    stats_data["spatial_coverage"]["states_and_uts_represented_count"] = len(serialized_hierarchy)
    stats_data["spatial_coverage"]["states_list"] = sorted(list(serialized_hierarchy.keys()))
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats_data, f, indent=2, ensure_ascii=False)
    print("Updated verifiedStatistics.json spatial coverage!")

conn.commit()
conn.close()
print("Location normalization complete!")

