# MediVerse AI — Processed & Cleaned Datasets Directory

This directory stores cleaned, standardized, and deduplicated datasets prepared for database ingestion.

## Cleaning Pipeline
To clean and normalize all downloaded datasets, execute:
```bash
python backend/scripts/clean_datasets.py
```

## Structure
- `hospitals/` — Standardized hospitals with verified Indian bounding coordinates (Lat: 6.0° - 37.5°N, Lon: 68.0° - 97.5°E)
- `healthcare_facilities/` — Standardized PHCs, CHCs, Clinics, Diagnostic Centers
- `professionals/` — Standardized doctor records with registration format and affiliations
- `medicines/` — Cleaned Indian medicines catalog with normalized brand and generic naming
- `laboratory/` — Standardized clinical laboratory observations with unit preservation and reference flags
- `public_health/` — Standardized health indicators with period and geographic level tracking
- `medical_documents/` — Cleaned medical QA documents and ICD-10 diagnostic terminology for RAG

All cleaning runs and rejection metrics are logged in `data/manifests/cleaning_manifest.json` and `data/logs/clean_datasets_audit.log`.
Large processed CSV files are git-ignored.
