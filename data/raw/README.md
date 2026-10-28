# MediVerse AI — Raw Datasets Directory

This directory stores raw, unmodified healthcare dataset downloads acquired from public and government sources.

## Download Pipeline
To fetch all accessible datasets, execute:
```bash
python backend/scripts/download_datasets.py
```

## Structure
- `hospitals/` — Raw NIC HealthGIS and OSM healthcare facilities (GeoJSON, ZIP)
- `healthcare_facilities/` — Primary Health Centres, Community Health Centres, Clinics, KGIS GeoJSON
- `professionals/` — OpenStreetMap medical doctors and healthcare practitioners
- `medicines/` — Junioralive 250k+ Indian pharmaceutical catalog (CSV)
- `laboratory/` — PhysioNet MIMIC-IV clinical laboratory events and items (`labevents.csv.gz`, `d_labitems.csv.gz`)
- `public_health/` — WHO & World Bank disease surveillance and national indicators (CSV)
- `medical_documents/` — HealthcareMagic clinical QA and ICD-10 clinical terminologies (Parquet)

All downloaded files are hashed and cataloged in `data/manifests/download_manifest.json`.
Large archive files (*.geojson, *.csv, *.parquet, *.zip) are git-ignored.
