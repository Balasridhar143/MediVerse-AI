import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "mediverse.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Get existing columns in hospitals
    c.execute("PRAGMA table_info(hospitals);")
    existing_cols = {row[1] for row in c.fetchall()}
    print("Existing hospitals columns:", existing_cols)

    new_cols = [
        ("facility_type", "TEXT DEFAULT 'Hospital'"),
        ("ownership_type", "TEXT DEFAULT 'Public/Government'"),
        ("district", "TEXT"),
        ("website", "TEXT"),
        ("available_beds", "INTEGER"),
        ("source_record_id", "TEXT"),
        ("source_url", "TEXT"),
        ("last_verification_date", "TEXT"),
        ("import_date", "TIMESTAMP")
    ]

    for col_name, col_def in new_cols:
        if col_name not in existing_cols:
            print(f"Adding column '{col_name}' to hospitals table...")
            c.execute(f"ALTER TABLE hospitals ADD COLUMN {col_name} {col_def};")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
