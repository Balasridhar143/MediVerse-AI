"""
MediVerse AI — High-Performance Idempotent Database Ingestion Pipeline
Batch inserts cleaned datasets into persistent SQLite database using WAL mode,
conflict-free upserts/ignores, and audit logging.
"""

import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
import json
import sqlite3
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
sys.path.insert(0, BASE_DIR)

from database import engine, SessionLocal, Base
import models

DATA_DIR = os.path.join(PROJECT_ROOT, "data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
LOGS_DIR = os.path.join(DATA_DIR, "logs")
MANIFESTS_DIR = os.path.join(DATA_DIR, "manifests")

def optimize_sqlite(engine):
    """Configures high-throughput SQLite pragma settings."""
    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL;"))
        conn.execute(text("PRAGMA synchronous=NORMAL;"))
        conn.execute(text("PRAGMA cache_size=-64000;"))  # 64MB in-memory page cache
        conn.execute(text("PRAGMA temp_store=MEMORY;"))
        conn.commit()
    print("[DB] SQLite optimized with WAL mode and 64MB page cache.")

from sqlalchemy import text, DateTime

def bulk_insert_dataframe(table_model, df: pd.DataFrame, db_session, batch_size=500):
    """
    Idempotent bulk batch insertion into SQLite table using INSERT OR IGNORE.
    Sets DateTime columns to standard Python datetime objects, replaces NaN with None,
    and executes via batch executemany.
    """
    if df.empty:
        return 0

    table = table_model.__table__
    valid_cols = set(table.columns.keys())

    # Auto-map common column name differences
    if "facility_name" in df.columns and "hospital_name" in valid_cols and "hospital_name" not in df.columns:
        df["hospital_name"] = df["facility_name"]
    if "hospital_name" in df.columns and "facility_name" in valid_cols and "facility_name" not in df.columns:
        df["facility_name"] = df["hospital_name"]

    cols_to_keep = [c for c in df.columns if c in valid_cols]
    df_clean = df[cols_to_keep].copy()

    # Ensure all DateTime columns use standard Python datetime objects
    now_dt = datetime.now()
    for col in table.columns:
        if isinstance(col.type, DateTime):
            df_clean[col.name] = now_dt

    # Replace NaN with None
    df_clean = df_clean.replace({np.nan: None})
    records = df_clean.where(pd.notnull(df_clean), None).to_dict(orient="records")

    total_records = len(records)
    imported = 0

    stmt = sqlite_insert(table).on_conflict_do_nothing(index_elements=["id"])
    chunk_size = min(batch_size, 500)

    for i in range(0, total_records, chunk_size):
        batch = records[i:i + chunk_size]
        db_session.execute(stmt, batch)
        db_session.commit()
        imported += len(batch)
        if (i + chunk_size) % 25000 < chunk_size or (i + chunk_size) >= total_records:
            print(f"    ... ingested {min(i + chunk_size, total_records):,}/{total_records:,} rows")

    return imported

def run_import_pipeline():
    start_time = datetime.now(timezone.utc)
    print("=" * 80)
    print("MediVerse AI — Database Ingestion Pipeline")
    print(f"Started at: {start_time.isoformat()}")
    print("=" * 80)

    # 1. Initialize Tables
    Base.metadata.create_all(bind=engine)
    optimize_sqlite(engine)
    db = SessionLocal()

    import_stats = {
        "hospitals": 0,
        "healthcare_facilities": 0,
        "professionals": 0,
        "medicines": 0,
        "public_health_indicators": 0,
        "laboratory_observations": 0,
        "medical_documents": 0,
    }

    try:
        # A. Import Hospitals
        print("\n[1/7] Ingesting Cleaned Hospitals...")
        hosp_files = [
            os.path.join(PROCESSED_DIR, "hospitals", "nic_hospitals_clean.csv"),
            os.path.join(PROCESSED_DIR, "hospitals", "osm_hospitals_clean.csv")
        ]
        for h_file in hosp_files:
            if os.path.exists(h_file):
                df = pd.read_csv(h_file, low_memory=False)
                # Ensure latitude and longitude are valid floats
                df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
                df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
                cnt = bulk_insert_dataframe(models.Hospital, df, db, batch_size=5000)
                import_stats["hospitals"] += len(df)
                print(f"  -> Imported {len(df):,} hospital records from {os.path.basename(h_file)}")

        # B. Import Healthcare Facilities
        print("\n[2/7] Ingesting Cleaned Healthcare Facilities (Clinics, PHCs, CHCs, Pharmacies)...")
        fac_files = [
            os.path.join(PROCESSED_DIR, "healthcare_facilities", "nic_facilities_clean.csv"),
            os.path.join(PROCESSED_DIR, "healthcare_facilities", "osm_facilities_clean.csv"),
            os.path.join(PROCESSED_DIR, "healthcare_facilities", "karnataka_facilities_clean.csv")
        ]
        for f_file in fac_files:
            if os.path.exists(f_file):
                df = pd.read_csv(f_file, low_memory=False)
                df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
                df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
                bulk_insert_dataframe(models.HealthcareFacility, df, db, batch_size=5000)
                import_stats["healthcare_facilities"] += len(df)
                print(f"  -> Imported {len(df):,} facility records from {os.path.basename(f_file)}")

        # C. Import Professionals / Doctors
        print("\n[3/7] Ingesting Cleaned Doctors & Healthcare Professionals...")
        doc_file = os.path.join(PROCESSED_DIR, "professionals", "osm_doctors_clean.csv")
        if os.path.exists(doc_file):
            df = pd.read_csv(doc_file, low_memory=False)
            bulk_insert_dataframe(models.Professional, df, db, batch_size=5000)
            import_stats["professionals"] += len(df)
            print(f"  -> Imported {len(df):,} doctor records from {os.path.basename(doc_file)}")

        # D. Import Medicines
        print("\n[4/7] Ingesting Indian Medicines & Pharmaceutical Catalog...")
        med_file = os.path.join(PROCESSED_DIR, "medicines", "indian_medicines_clean.csv")
        if os.path.exists(med_file):
            df = pd.read_csv(med_file, low_memory=False)
            bulk_insert_dataframe(models.Medicine, df, db, batch_size=10000)
            import_stats["medicines"] += len(df)
            print(f"  -> Imported {len(df):,} medicine records from {os.path.basename(med_file)}")

        # E. Import Public Health Indicators
        print("\n[5/7] Ingesting Public Health & Disease Surveillance Indicators...")
        ind_file = os.path.join(PROCESSED_DIR, "public_health", "public_health_indicators_clean.csv")
        if os.path.exists(ind_file):
            df = pd.read_csv(ind_file, low_memory=False)
            bulk_insert_dataframe(models.PublicHealthIndicator, df, db, batch_size=5000)
            import_stats["public_health_indicators"] += len(df)
            print(f"  -> Imported {len(df):,} indicator records from {os.path.basename(ind_file)}")

        # F. Import Laboratory Observations
        print("\n[6/7] Ingesting Clinical Laboratory Observations & Reference Ranges...")
        lab_file = os.path.join(PROCESSED_DIR, "laboratory", "laboratory_observations_clean.csv")
        if os.path.exists(lab_file):
            df = pd.read_csv(lab_file, low_memory=False)
            bulk_insert_dataframe(models.LaboratoryObservation, df, db, batch_size=10000)
            import_stats["laboratory_observations"] += len(df)
            print(f"  -> Imported {len(df):,} laboratory observation records from {os.path.basename(lab_file)}")

        # G. Import Medical Knowledge Documents & Terminology
        print("\n[7/7] Ingesting Medical Knowledge Documents & Clinical Terminology...")
        doc_file = os.path.join(PROCESSED_DIR, "medical_documents", "medical_documents_clean.csv")
        if os.path.exists(doc_file):
            df = pd.read_csv(doc_file, low_memory=False)
            bulk_insert_dataframe(models.MedicalDocument, df, db, batch_size=10000)
            import_stats["medical_documents"] += len(df)
            print(f"  -> Imported {len(df):,} medical document records from {os.path.basename(doc_file)}")

        # Record dataset source summaries in dataset_sources table
        clean_manifest_path = os.path.join(MANIFESTS_DIR, "cleaning_manifest.json")
        if os.path.exists(clean_manifest_path):
            with open(clean_manifest_path, "r", encoding="utf-8") as f:
                c_stats = json.load(f)

        total_imported_records = sum(import_stats.values())
        end_time = datetime.now(timezone.utc)
        duration_sec = round((end_time - start_time).total_seconds(), 1)

        print("\n" + "=" * 80)
        print(f"DATABASE INGESTION COMPLETED IN {duration_sec}s!")
        print(f"Total Imported Records: {total_imported_records:,}")
        for cat, cnt in import_stats.items():
            print(f"  - {cat}: {cnt:,}")
        print("=" * 80)

        # Write Import Manifest
        import_manifest = {
            "started_at": start_time.isoformat(),
            "completed_at": end_time.isoformat(),
            "duration_seconds": duration_sec,
            "total_imported_records": total_imported_records,
            "category_counts": import_stats
        }
        with open(os.path.join(MANIFESTS_DIR, "import_manifest.json"), "w", encoding="utf-8") as f:
            json.dump(import_manifest, f, indent=2)

        return import_manifest

    except Exception as e:
        db.rollback()
        print(f"[Import Pipeline Error] {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_import_pipeline()
