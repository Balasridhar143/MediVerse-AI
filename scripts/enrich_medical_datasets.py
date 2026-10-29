import sqlite3
import re
import os
import time
import json
import hashlib

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "mediverse.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("=== STARTING MEDICAL DATASET ENRICHMENT & SCHEMA REPAIR ===")

# ==========================================
# 1. ENRICH MEDICINES (251,320 rows)
# ==========================================
print("\n1. Enriching 251,320 Indian Medicines with accurate formulation, strength, and therapeutic category...")
t0 = time.time()

# Formulation keywords
FORMULATION_RULES = [
    (re.compile(r'\b(tablet|tabs?|dt|sr|er|cr|md|pr|tr|xr)\b', re.IGNORECASE), "Tablet"),
    (re.compile(r'\b(capsule|caps?)\b', re.IGNORECASE), "Capsule"),
    (re.compile(r'\b(syrup|syp|suspension|susp|liquid|elixir|oral solution)\b', re.IGNORECASE), "Syrup / Oral Liquid"),
    (re.compile(r'\b(injection|inj|infusion|vial|ampoule|prefilled)\b', re.IGNORECASE), "Injection"),
    (re.compile(r'\b(ointment|gel|cream|lotion|emulgel|liniment)\b', re.IGNORECASE), "Topical (Ointment/Gel/Cream)"),
    (re.compile(r'\b(drops?|eye drops?|ear drops?|nasal drops?|nasal spray)\b', re.IGNORECASE), "Drops / Spray"),
    (re.compile(r'\b(inhaler|rotacaps?|respules?|transhaler|autohaler)\b', re.IGNORECASE), "Inhaler / Respules"),
    (re.compile(r'\b(powder|sachet|granules)\b', re.IGNORECASE), "Powder / Sachet"),
    (re.compile(r'\b(mouthwash|gargle)\b', re.IGNORECASE), "Oral Rinse / Gargle"),
    (re.compile(r'\b(patch|transdermal)\b', re.IGNORECASE), "Transdermal Patch"),
]

# Therapeutic Category keywords
CATEGORY_RULES = [
    (re.compile(r'(amoxicillin|amoxycillin|clavulanic|azithromycin|cefixime|ofloxacin|ciprofloxacin|doxycycline|metronidazole|cefpodoxime|levofloxacin|ceftriaxone|ampicillin|meropenem|gentamicin|clindamycin|nitrofurantoin)', re.IGNORECASE), "Antibiotics & Anti-Infectives"),
    (re.compile(r'(telmisartan|amlodipine|losartan|atenolol|metoprolol|enalapril|ramipril|atorvastatin|rosuvastatin|clopidogrel|propranolol|olmesartan|nebivolol|hydrochlorothiazide|chlorthalidone|diltiazem)', re.IGNORECASE), "Cardiovascular & Antihypertensive"),
    (re.compile(r'(metformin|glimepiride|gliclazide|vildagliptin|sitagliptin|teneligliptin|dapagliflozin|empagliflozin|pioglitazone|insulin|glipizide)', re.IGNORECASE), "Endocrinology & Diabetes"),
    (re.compile(r'(pantoprazole|omeprazole|rabeprazole|esomeprazole|ranitidine|famotidine|domperidone|ondansetron|sucralfate|magaldrate|simethicone|lactulose)', re.IGNORECASE), "Gastroenterology & Acidity"),
    (re.compile(r'(paracetamol|acetaminophen|aceclofenac|diclofenac|ibuprofen|tramadol|etoricoxib|naproxen|mefenamic|aspirin|piroxicam|ketorolac|serratiopeptidase|trypsin)', re.IGNORECASE), "Analgesic & Pain Relief"),
    (re.compile(r'(cetirizine|levocetirizine|fexofenadine|montelukast|bilastine|chlorpheniramine|pheniramine|desloratadine|hydroxyzine)', re.IGNORECASE), "Allergy & Antihistamines"),
    (re.compile(r'(salbutamol|levosalbutamol|budesonide|formoterol|ambroxol|bromhexine|dextromethorphan|guaifenesin|terbutaline|theophylline|fluticasone)', re.IGNORECASE), "Respiratory & Pulmonology"),
    (re.compile(r'(alprazolam|clonazepam|escitalopram|sertraline|fluoxetine|pregabalin|gabapentin|levetiracetam|sodium valproate|carbamazepine|olanzapine|amitriptyline)', re.IGNORECASE), "Neurology & Psychiatry"),
    (re.compile(r'(vitamin|calcium|cholecalciferol|methylcobalamin|folic acid|ferrous|iron|zinc|b-complex|biotin|ascorbic acid)', re.IGNORECASE), "Vitamins & Nutritional Supplements"),
    (re.compile(r'(clotrimazole|terbinafine|mupirocin|betamethasone|clobetasol|permethrin|fusidic|ketoconazole|miconazole|fluconazole|itraconazole)', re.IGNORECASE), "Dermatology & Antifungals"),
    (re.compile(r'(carboxymethylcellulose|timolol|brimonidine|moxifloxacin|nepafenac|travoprost|cyclopentolate|tropicamide)', re.IGNORECASE), "Ophthalmology (Eye Care)"),
]

STRENGTH_REGEX = re.compile(r'\b(\d+(?:\.\d+)?\s*(?:mg|gm|g|ml|mcg|iu|%|w\/v|w\/w))\b', re.IGNORECASE)

# Fetch all medicines
c.execute("SELECT rowid, brand_name, generic_name, composition FROM medicines;")
med_rows = c.fetchall()
print(f"Loaded {len(med_rows)} medicine records. Parsing clinical properties...")

updates = []
for rowid, brand, generic, comp in med_rows:
    text_to_search = f"{brand or ''} {comp or ''} {generic or ''}"
    
    # 1. Determine Formulation
    formulation = "Tablet" # Default most common pharmaceutical form
    for pattern, form_name in FORMULATION_RULES:
        if pattern.search(brand or ''):
            formulation = form_name
            break

    # 2. Extract Strength
    strength = None
    m_strength = STRENGTH_REGEX.search(brand or '')
    if not m_strength and comp:
        m_strength = STRENGTH_REGEX.search(comp)
    if m_strength:
        strength = m_strength.group(1).strip()

    # 3. Determine Category
    category = "General Medicine & Therapeutics"
    for pattern, cat_name in CATEGORY_RULES:
        if pattern.search(text_to_search):
            category = cat_name
            break

    updates.append((formulation, strength, category, rowid))

# Batch update medicines
c.executemany("""
    UPDATE medicines
    SET formulation = ?, strength = ?, category = ?
    WHERE rowid = ?;
""", updates)
conn.commit()
print(f"Successfully enriched {len(updates)} medicines in {round(time.time() - t0, 2)}s!")

# Rebuild medicines_fts virtual table with formulation and category
print("\nRebuilding medicines_fts with formulation and category columns...")
c.execute("DROP TABLE IF EXISTS medicines_fts;")
c.execute("""
    CREATE VIRTUAL TABLE medicines_fts USING fts5(
        brand_name,
        generic_name,
        composition,
        formulation,
        category,
        manufacturer,
        content='medicines',
        content_rowid='rowid'
    );
""")
c.execute("""
    INSERT INTO medicines_fts(rowid, brand_name, generic_name, composition, formulation, category, manufacturer)
    SELECT rowid, brand_name, generic_name, composition, formulation, category, manufacturer FROM medicines;
""")
conn.commit()
print("medicines_fts rebuilt and indexed successfully!")


# ==========================================
# 2. FIX HOSPITALS DISTRICTS & METADATA
# ==========================================
print("\n2. Fixing seed hospitals and normalizing district metadata...")

# Fix known seed hospitals
c.execute("""
    UPDATE hospitals SET district = 'New Delhi' WHERE id = 'hosp_1' AND district IS NULL;
""")
c.execute("""
    UPDATE hospitals SET district = 'Gurugram' WHERE id = 'hosp_2' AND district IS NULL;
""")
c.execute("""
    UPDATE hospitals SET district = 'South East Delhi' WHERE id = 'hosp_3' AND district IS NULL;
""")
c.execute("""
    UPDATE hospitals SET district = 'South Delhi' WHERE id = 'hosp_4' AND district IS NULL;
""")
conn.commit()

# Rebuild hospitals_fts
print("Rebuilding hospitals_fts...")
c.execute("DROP TABLE IF EXISTS hospitals_fts;")
c.execute("""
    CREATE VIRTUAL TABLE hospitals_fts USING fts5(
        hospital_name,
        city,
        district,
        state,
        facility_type,
        address,
        departments,
        content='hospitals',
        content_rowid='rowid'
    );
""")
c.execute("""
    INSERT INTO hospitals_fts(rowid, hospital_name, city, district, state, facility_type, address, departments)
    SELECT rowid, hospital_name, city, district, state, facility_type, address, departments FROM hospitals;
""")
conn.commit()
print("hospitals_fts rebuilt successfully!")


# ==========================================
# 3. SEED COMPLETE DOCTOR ROSTER IN USERS & DOCTORS
# ==========================================
print("\n3. Seeding verified specialist doctors into users and doctors tables...")

import hashlib

def hash_pw(pw: str) -> str:
    # PBKDF2-HMAC-SHA256
    import os
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}${dk.hex()}"

DOCTORS_TO_SEED = [
    {
        "user_id": "usr_doc_001",
        "doc_id": "doc_usr_doc_001",
        "email": "doctor@example.com",
        "name": "Dr. Arun Kumar",
        "specialization": "Cardiology & Internal Medicine",
        "department": "Cardiology",
        "qualifications": "MBBS, MD (Cardiology), FACC",
        "hospital_id": "hosp_1",
        "hospital_name": "City Care Multispeciality Hospital",
        "experience_years": 14,
        "fee": 600.0,
        "rating": 4.9,
        "reviews": 42,
        "about": "Dr. Arun Kumar is a Senior Interventional Cardiologist specializing in hypertension management, ischemic heart disease, and preventative cardiovascular care.",
    },
    {
        "user_id": "usr_doc_002",
        "doc_id": "doc_usr_doc_002",
        "email": "ananya.sen@example.com",
        "name": "Dr. Ananya Sen",
        "specialization": "Cardiology & Preventive Medicine",
        "department": "Cardiology",
        "qualifications": "MBBS, MD, DM (Cardiology)",
        "hospital_id": "hosp_3",
        "hospital_name": "Apollo Indraprastha Institute of Medical Sciences",
        "experience_years": 11,
        "fee": 700.0,
        "rating": 4.95,
        "reviews": 38,
        "about": "Dr. Ananya Sen leads the preventive cardiovascular outpatient clinic, conducting remote telemedicine consultations and chronic disease management.",
    },
    {
        "user_id": "usr_doc_003",
        "doc_id": "doc_usr_doc_003",
        "email": "ramesh.sharma@example.com",
        "name": "Dr. Ramesh Sharma",
        "specialization": "Neurology & Stroke Management",
        "department": "Neurology",
        "qualifications": "MBBS, MD (Medicine), DM (Neurology)",
        "hospital_id": "hosp_4",
        "hospital_name": "Max Super Speciality Hospital",
        "experience_years": 16,
        "fee": 800.0,
        "rating": 4.88,
        "reviews": 56,
        "about": "Dr. Ramesh Sharma is an expert neurologist specializing in migraine management, neuropathy, Parkinson's disease, and stroke rehabilitation.",
    },
    {
        "user_id": "usr_doc_004",
        "doc_id": "doc_usr_doc_004",
        "email": "priya.nair@example.com",
        "name": "Dr. Priya Nair",
        "specialization": "Pediatrics & Adolescent Medicine",
        "department": "Pediatrics",
        "qualifications": "MBBS, DCH, DNB (Pediatrics)",
        "hospital_id": "hosp_1",
        "hospital_name": "City Care Multispeciality Hospital",
        "experience_years": 9,
        "fee": 500.0,
        "rating": 4.92,
        "reviews": 64,
        "about": "Dr. Priya Nair provides compassionate pediatric care, childhood immunizations, pediatric nutrition counseling, and acute illness treatment.",
    },
    {
        "user_id": "usr_doc_005",
        "doc_id": "doc_usr_doc_005",
        "email": "vikram.malhotra@example.com",
        "name": "Dr. Vikram Malhotra",
        "specialization": "Orthopedics & Joint Replacement",
        "department": "Orthopedics",
        "qualifications": "MBBS, MS (Ortho), MCh (Ortho)",
        "hospital_id": "hosp_2",
        "hospital_name": "Metro General Healthcare",
        "experience_years": 15,
        "fee": 750.0,
        "rating": 4.85,
        "reviews": 49,
        "about": "Dr. Vikram Malhotra specializes in joint preservation, arthroscopy, sports trauma, and osteoarthritis pain management.",
    },
    {
        "user_id": "usr_doc_006",
        "doc_id": "doc_usr_doc_006",
        "email": "sunita.rao@example.com",
        "name": "Dr. Sunita Rao",
        "specialization": "Pulmonology & Respiratory Medicine",
        "department": "Pulmonology",
        "qualifications": "MBBS, MD (Pulmonary Medicine)",
        "hospital_id": "hosp_1",
        "hospital_name": "City Care Multispeciality Hospital",
        "experience_years": 12,
        "fee": 650.0,
        "rating": 4.9,
        "reviews": 31,
        "about": "Dr. Sunita Rao manages asthma, COPD, chronic cough, respiratory allergies, and post-COVID pulmonary rehabilitation.",
    },
]

default_slots = json.dumps(["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"])
default_days = json.dumps(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])
default_types = json.dumps(["Video Consultation", "In-Person"])

for doc in DOCTORS_TO_SEED:
    # Check user
    c.execute("SELECT id FROM users WHERE email = ?;", (doc["email"],))
    u_row = c.fetchone()
    if not u_row:
        pw_hash = hash_pw("password123")
        c.execute("""
            INSERT INTO users (id, full_name, email, password_hash, role, hospital_id, created_at)
            VALUES (?, ?, ?, ?, 'doctor', ?, datetime('now'));
        """, (doc["user_id"], doc["name"], doc["email"], pw_hash, doc["hospital_id"]))
    
    # Check doctor profile
    c.execute("SELECT id FROM doctors WHERE user_id = ?;", (doc["user_id"],))
    d_row = c.fetchone()
    if not d_row:
        c.execute("""
            INSERT INTO doctors (
                id, user_id, full_name, specialization, hospital_id, hospital_name,
                department, qualifications, experience_years, consultation_fee,
                rating, review_count, about, available_slots, available_days, consultation_types,
                is_available, is_verified, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, datetime('now'));
        """, (
            doc["doc_id"], doc["user_id"], doc["name"], doc["specialization"], doc["hospital_id"], doc["hospital_name"],
            doc["department"], doc["qualifications"], doc["experience_years"], doc["fee"],
            doc["rating"], doc["reviews"], doc["about"], default_slots, default_days, default_types
        ))
conn.commit()
print(f"Seeded {len(DOCTORS_TO_SEED)} verified clinical doctors into users & doctors tables!")


# ==========================================
# 4. SEED SAMPLE APPOINTMENTS (APT-101 CONFIRMED & READY FOR VIDEO)
# ==========================================
print("\n4. Seeding appointments for patient@example.com (Gokul Sankar) and doctor@example.com (Dr. Arun Kumar)...")

c.execute("SELECT id FROM appointments WHERE id = 'apt_101';")
if not c.fetchone():
    c.execute("""
        INSERT INTO appointments (
            id, patient_id, doctor_id, doctor_profile_id, doctor_name,
            patient_name, patient_phone, patient_email, hospital_name,
            specialization, department, appointment_date, time_slot,
            type, notes, status, room_id, created_at, updated_at
        ) VALUES (
            'apt_101', 'usr_pat_001', 'usr_doc_001', 'doc_usr_doc_001', 'Dr. Arun Kumar',
            'Gokul Sankar', '+91 98765 43210', 'patient@example.com', 'City Care Multispeciality Hospital',
            'Cardiology', 'Cardiology', date('now'), '10:15 AM',
            'Video Consultation', 'Follow-up on 4-week Telmisartan 40mg response and lipid panel test',
            'CONFIRMED', 'room_apt_101', datetime('now'), datetime('now')
        );
    """)

c.execute("SELECT id FROM appointments WHERE id = 'apt_102';")
if not c.fetchone():
    c.execute("""
        INSERT INTO appointments (
            id, patient_id, doctor_id, doctor_profile_id, doctor_name,
            patient_name, patient_phone, patient_email, hospital_name,
            specialization, department, appointment_date, time_slot,
            type, notes, status, room_id, created_at, updated_at
        ) VALUES (
            'apt_102', 'usr_pat_001', 'usr_doc_001', 'doc_usr_doc_001', 'Dr. Arun Kumar',
            'Gokul Sankar', '+91 98765 43210', 'patient@example.com', 'City Care Multispeciality Hospital',
            'Cardiology', 'Cardiology', date('now', '+1 day'), '02:00 PM',
            'Video Consultation', 'Routine blood pressure review and ECG checkup',
            'PENDING', 'room_apt_102', datetime('now'), datetime('now')
        );
    """)

c.execute("SELECT id FROM appointments WHERE id = 'apt_103';")
if not c.fetchone():
    c.execute("""
        INSERT INTO appointments (
            id, patient_id, doctor_id, doctor_profile_id, doctor_name,
            patient_name, patient_phone, patient_email, hospital_name,
            specialization, department, appointment_date, time_slot,
            type, notes, status, room_id, created_at, updated_at
        ) VALUES (
            'apt_103', 'usr_pat_001', 'usr_doc_002', 'doc_usr_doc_002', 'Dr. Ananya Sen',
            'Gokul Sankar', '+91 98765 43210', 'patient@example.com', 'Apollo Indraprastha Institute of Medical Sciences',
            'Cardiology', 'Cardiology', date('now', '-7 day'), '11:00 AM',
            'Video Consultation', 'Initial cardiology consultation and prescription of Telmisartan 40mg',
            'COMPLETED', 'room_apt_103', datetime('now', '-7 day'), datetime('now', '-7 day')
        );
    """)
conn.commit()
print("Seeded apt_101 (CONFIRMED today), apt_102 (PENDING tomorrow), and apt_103 (COMPLETED) successfully!")

# Seed notifications
print("Seeding live notifications for Gokul Sankar...")
c.execute("DELETE FROM notifications WHERE user_id = 'usr_pat_001';")
c.execute("""
    INSERT INTO notifications (id, user_id, type, title, message, entity_id, link_url, is_read, created_at)
    VALUES 
    ('notif_1', 'usr_pat_001', 'APPOINTMENT_CONFIRMED', 'Appointment Confirmed', 'Your video consultation with Dr. Arun Kumar has been confirmed for today at 10:15 AM.', 'apt_101', '/patient/consultation?appointmentId=apt_101', 0, datetime('now')),
    ('notif_2', 'usr_pat_001', 'MEDICATION_REMINDER', 'Morning Medication Due', 'Reminder: Take Telmisartan 40mg (1 tablet) after breakfast with a full glass of water.', 'med_tel_40', '/patient/medicines', 0, datetime('now', '-1 hour')),
    ('notif_3', 'usr_pat_001', 'LAB_REPORT_READY', 'Diagnostic Report Ready', 'Your Complete Blood Count (CBC) and Lipid Profile report is ready for clinical review.', 'rep_001', '/patient/reports', 1, datetime('now', '-1 day'));
""")
conn.commit()
print("Seeded 3 live notifications!")

conn.close()
print("\n=== MEDICAL DATASETS & DATABASE REPAIR COMPLETE! ===")

