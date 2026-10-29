import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "mediverse.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("Applying schema updates to:", db_path)

# 1. Doctors table
c.execute("""
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE,
    full_name VARCHAR(128) NOT NULL,
    specialization VARCHAR(128) DEFAULT 'General Medicine',
    license_number VARCHAR(128),
    hospital_id VARCHAR(64),
    hospital_name VARCHAR(256),
    experience_years INT DEFAULT 5,
    rating NUMERIC(3,1) DEFAULT 4.8,
    review_count INT DEFAULT 12,
    consultation_fee NUMERIC(8,2) DEFAULT 500.00,
    about TEXT,
    available_days TEXT DEFAULT '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
    available_slots TEXT DEFAULT '["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"]',
    consultation_types TEXT DEFAULT '["Video Consultation", "In-Person"]',
    department VARCHAR(128) DEFAULT 'General Medicine',
    location VARCHAR(256) DEFAULT 'Main Campus, Sector 4',
    qualifications VARCHAR(256) DEFAULT 'MBBS, MD',
    is_available BOOLEAN DEFAULT 1,
    is_verified BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
""")
c.execute("CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);")
c.execute("CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);")

# 2. Appointments table
c.execute("""
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    doctor_id VARCHAR(64) NOT NULL,
    doctor_profile_id VARCHAR(64),
    doctor_name VARCHAR(128) NOT NULL,
    patient_name VARCHAR(128) NOT NULL,
    patient_phone VARCHAR(32),
    patient_email VARCHAR(128),
    hospital_name VARCHAR(256),
    specialization VARCHAR(128),
    department VARCHAR(128) DEFAULT 'General Medicine',
    appointment_date VARCHAR(32) NOT NULL,
    time_slot VARCHAR(32) NOT NULL,
    type VARCHAR(64) NOT NULL DEFAULT 'Video Consultation',
    notes TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    room_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(doctor_id) REFERENCES users(id) ON DELETE CASCADE
);
""")
c.execute("CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);")
c.execute("CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);")
c.execute("CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);")

# 3. OTPs table
c.execute("""
CREATE TABLE IF NOT EXISTS otps (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(128) NOT NULL,
    otp_code VARCHAR(16) NOT NULL,
    purpose VARCHAR(32) NOT NULL DEFAULT 'PASSWORD_RESET',
    attempts INT NOT NULL DEFAULT 0,
    is_used BOOLEAN NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")
c.execute("CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON otps(email, purpose);")

# 4. Notifications table
c.execute("""
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(256) NOT NULL,
    message TEXT NOT NULL,
    entity_id VARCHAR(64),
    link_url VARCHAR(256),
    is_read BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
""")
c.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);")
c.execute("CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);")

# 5. WebRTC Consultation Signals table
c.execute("""
CREATE TABLE IF NOT EXISTS consultation_signals (
    id VARCHAR(64) PRIMARY KEY,
    room_id VARCHAR(64) NOT NULL,
    sender_id VARCHAR(64) NOT NULL,
    sender_role VARCHAR(32) NOT NULL,
    signal_type VARCHAR(32) NOT NULL,
    signal_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")
c.execute("CREATE INDEX IF NOT EXISTS idx_signals_room_id ON consultation_signals(room_id);")

# 6. Ensure default doctor user has a doctor profile
c.execute("SELECT id, full_name, email FROM users WHERE role = 'doctor';")
doc_users = c.fetchall()
for d_user in doc_users:
    u_id, u_name, u_email = d_user
    c.execute("SELECT id FROM doctors WHERE user_id = ?", (u_id,))
    if not c.fetchone():
        doc_prof_id = f"doc_{u_id}"
        c.execute("""
            INSERT INTO doctors (id, user_id, full_name, specialization, license_number, hospital_id, hospital_name, department, experience_years, consultation_fee, is_available, is_verified)
            VALUES (?, ?, ?, 'Cardiology & Internal Medicine', 'MCI-2026-8841', 'hosp_1', 'City Care Multispeciality Hospital', 'Cardiology', 12, 600.00, 1, 1)
        """, (doc_prof_id, u_id, u_name))
        print(f"Created Doctor profile for existing doctor user: {u_name} ({u_id})")

# 7. Check indexes on medicines
c.execute("CREATE INDEX IF NOT EXISTS idx_medicines_brand ON medicines(brand_name);")
c.execute("CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(generic_name);")
c.execute("CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);")
c.execute("CREATE INDEX IF NOT EXISTS idx_medicines_composition ON medicines(composition);")

# 8. Check indexes on hospitals
c.execute("CREATE INDEX IF NOT EXISTS idx_hospitals_state ON hospitals(state);")
c.execute("CREATE INDEX IF NOT EXISTS idx_hospitals_district ON hospitals(district);")
c.execute("CREATE INDEX IF NOT EXISTS idx_hospitals_city ON hospitals(city);")
c.execute("CREATE INDEX IF NOT EXISTS idx_hospitals_type ON hospitals(facility_type);")

conn.commit()
print("All SQLite schema migrations and indexes verified successfully!")
conn.close()

