import sqlite3
import time
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "mediverse.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("Setting up FTS5 index on hospitals...")
t0 = time.time()

c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='hospitals_fts';")
if c.fetchone():
    print("hospitals_fts already exists.")
else:
    c.execute("""
        CREATE VIRTUAL TABLE hospitals_fts USING fts5(
            hospital_name,
            city,
            district,
            state,
            departments,
            content='hospitals',
            content_rowid='rowid'
        );
    """)
    print("Populating hospitals_fts...")
    c.execute("""
        INSERT INTO hospitals_fts(rowid, hospital_name, city, district, state, departments)
        SELECT rowid, hospital_name, city, district, state, departments FROM hospitals;
    """)
    conn.commit()
    print(f"hospitals_fts created and populated in {round(time.time() - t0, 2)}s!")

print("\n--- BENCHMARKING HOSPITALS FTS5 SEARCH SPEED ---")
for q in ["Apollo", "Max", "Cardiology", "Bangalore", "Delhi"]:
    t_start = time.time()
    c.execute("""
        SELECT h.id, h.hospital_name, h.city, h.state
        FROM hospitals_fts f
        JOIN hospitals h ON h.rowid = f.rowid
        WHERE hospitals_fts MATCH ?
        LIMIT 5;
    """, (f'"{q}"*',))
    rows = c.fetchall()
    elapsed_ms = round((time.time() - t_start) * 1000, 2)
    print(f"Hospital Query '{q}': found {len(rows)} rows in {elapsed_ms} ms! Sample: {rows[0][1] if rows else 'None'}")

conn.close()

