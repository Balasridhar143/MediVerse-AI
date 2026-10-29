import sqlite3
import time
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "mediverse.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("Setting up FTS5 index on medicines...")
t0 = time.time()

# Check if FTS5 table already exists
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='medicines_fts';")
if c.fetchone():
    print("medicines_fts already exists.")
else:
    c.execute("""
        CREATE VIRTUAL TABLE medicines_fts USING fts5(
            brand_name,
            generic_name,
            composition,
            manufacturer,
            content='medicines',
            content_rowid='rowid'
        );
    """)
    print("Populating medicines_fts from medicines...")
    c.execute("""
        INSERT INTO medicines_fts(rowid, brand_name, generic_name, composition, manufacturer)
        SELECT rowid, brand_name, generic_name, composition, manufacturer FROM medicines;
    """)
    conn.commit()
    print(f"medicines_fts created and populated in {round(time.time() - t0, 2)}s!")

# Benchmark search speed
test_queries = ["Augmentin", "Telmisartan", "Paracetamol", "Azithromycin", "Sanofi"]
print("\n--- BENCHMARKING FTS5 SEARCH SPEED ---")
for q in test_queries:
    t_start = time.time()
    # FTS5 search with prefix matching
    c.execute("""
        SELECT m.id, m.brand_name, m.generic_name, m.manufacturer
        FROM medicines_fts f
        JOIN medicines m ON m.rowid = f.rowid
        WHERE medicines_fts MATCH ?
        LIMIT 5;
    """, (f'"{q}"*',))
    rows = c.fetchall()
    elapsed_ms = round((time.time() - t_start) * 1000, 2)
    print(f"Query '{q}': found {len(rows)} rows in {elapsed_ms} ms! Sample: {rows[0][1] if rows else 'None'}")

conn.close()

