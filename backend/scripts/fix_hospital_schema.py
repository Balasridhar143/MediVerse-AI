import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "mediverse.db")

def fix_schema():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Check if hospitals has NOT NULL on latitude
    c.execute("PRAGMA table_info(hospitals);")
    cols = c.fetchall()
    print("Current columns in hospitals:")
    for col in cols:
        print(f"  {col[1]}: {col[2]}, notnull={col[3]}, dflt={col[4]}")

    # Recreate table with nullable latitude & longitude
    c.execute("""
    CREATE TABLE IF NOT EXISTS hospitals_temp (
        id VARCHAR(64) PRIMARY KEY,
        hospital_name VARCHAR(256) NOT NULL,
        facility_type VARCHAR(64) DEFAULT 'Hospital',
        ownership_type VARCHAR(64) DEFAULT 'Public/Government',
        address VARCHAR(512) NOT NULL,
        city VARCHAR(128),
        district VARCHAR(128),
        state VARCHAR(128) NOT NULL,
        postal_code VARCHAR(32),
        phone VARCHAR(128),
        emergency_phone VARCHAR(128),
        website VARCHAR(256),
        latitude FLOAT,
        longitude FLOAT,
        departments TEXT,
        available_beds INTEGER,
        available_doctors INTEGER DEFAULT 12,
        emergency_availability VARCHAR(128) DEFAULT '24x7 Emergency Unit Active',
        source VARCHAR(128) DEFAULT 'Verified Healthcare Registry',
        source_record_id VARCHAR(128),
        source_url VARCHAR(512),
        last_verification_date VARCHAR(64),
        import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Copy existing records
    col_names = [col[1] for col in cols if col[1] in [
        'id', 'hospital_name', 'facility_type', 'ownership_type', 'address', 'city',
        'district', 'state', 'postal_code', 'phone', 'emergency_phone', 'website',
        'latitude', 'longitude', 'departments', 'available_beds', 'available_doctors',
        'emergency_availability', 'source', 'source_record_id', 'source_url',
        'last_verification_date', 'import_date', 'created_at'
    ]]
    col_str = ", ".join(col_names)
    c.execute(f"INSERT OR REPLACE INTO hospitals_temp ({col_str}) SELECT {col_str} FROM hospitals;")

    c.execute("DROP TABLE hospitals;")
    c.execute("ALTER TABLE hospitals_temp RENAME TO hospitals;")

    # Re-create indexes
    c.execute("CREATE INDEX IF NOT EXISTS idx_hospital_state_district ON hospitals (state, district);")
    c.execute("CREATE INDEX IF NOT EXISTS idx_hospital_name_city ON hospitals (hospital_name, city);")
    c.execute("CREATE INDEX IF NOT EXISTS ix_hospitals_id ON hospitals (id);")
    c.execute("CREATE INDEX IF NOT EXISTS ix_hospitals_hospital_name ON hospitals (hospital_name);")

    conn.commit()
    conn.close()
    print("Successfully updated hospitals table schema with nullable coordinates!")

if __name__ == "__main__":
    fix_schema()
