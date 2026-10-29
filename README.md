# MediVerse AI — Clinical Telehealth & India-Wide Integrated Healthcare Database

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-22c55e?style=flat-square&logo=github)](https://balasridhar143.github.io/MediVerse-AI/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20Postgres-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

> 🌐 **Live Public Frontend**: [https://balasridhar143.github.io/MediVerse-AI/](https://balasridhar143.github.io/MediVerse-AI/)

MediVerse AI is an enterprise-grade clinical telehealth platform and nationwide Indian healthcare data registry. Built with a **FastAPI** persistent backend and a modern **React 19 (Vite)** interface, the platform integrates **7,24,794 legitimate, audited healthcare records** across Indian states and union territories with role-based clinical governance, interactive GIS mapping, and diagnostic intelligence.

---

## 🌟 Key Features

### 1. Nationwide Healthcare Directory & Interactive GIS Map
- **7.25 Lakh Real Records**: Ingested and indexed across 51 Indian states & UTs.
- **2,41,552 Facilities with Verified Coordinates**: Plotted on interactive Leaflet maps with zero invented GPS points.
- **Real-time Server-side Filters**: Dynamic search by name, district, state dropdown (51 states/UTs), and facility type (Hospitals, PHCs, CHCs, Clinics, Diagnostic Centres).
- **Turn-by-Turn Navigation**: Direct routing via Google Maps using verified GPS coordinates.

### 2. Longitudinal Patient Record & Outpatient Registration
- **Instant Digital Registration**: Seamless patient admission modal generating persistent tracking IDs (`REG-YYYYMMDD-XXXXXX`).
- **Hospital Administration Isolation**: Hospital administrators only see registrations routed specifically to their healthcare facility.
- **Role-Based Portals**: Dedicated, secure environments for Patients, Doctors, and Hospital Administrators.

### 3. Integrated Indian Healthcare Data Warehouse
- **51,094 Hospitals** (Government of India NIC HealthGIS & OpenStreetMap India).
- **1,97,686 Primary Healthcare Centres & Clinics** (PHCs, CHCs, Dispensaries, Sub-Centres).
- **8,152 Doctors & Medical Practitioners** (Registered clinical staff directory).
- **2,51,320 Indian Pharmaceuticals** (Active medicines, formulations, strengths, and compositions).
- **95,246 Clinical Laboratory Observations** (PhysioNet MIMIC-IV de-identified observations with reference bounds).
- **9,502 Public Health & Disease Indicators** (WHO Global Health Observatory & World Bank).
- **1,11,794 Medical Documents & Terminology** (ICD-10-CM diagnostic classification & Clinical QA RAG).
- **Strict Data Integrity**: 0 synthetic rows created; 1,46,747 invalid/duplicate records audited and rejected.

### 4. Integrated Indian Healthcare Data Warehouse
- **51,094 Hospitals** (Government of India NIC HealthGIS & OpenStreetMap India).
- **1,97,686 Primary Healthcare Centres & Clinics** (PHCs, CHCs, Dispensaries, Sub-Centres).
- **8,152 Doctors & Medical Practitioners** (Registered clinical staff directory).
- **2,51,320 Indian Pharmaceuticals** (Active medicines, formulations, strengths, and compositions indexed with sub-millisecond SQLite FTS5 search).
- **95,246 Clinical Laboratory Observations** (PhysioNet MIMIC-IV de-identified observations with reference bounds).
- **9,502 Public Health & Disease Indicators** (WHO Global Health Observatory & World Bank).
- **1,11,794 Medical Documents & Terminology** (ICD-10-CM diagnostic classification & Clinical QA RAG).
- **Strict Data Integrity**: 0 synthetic rows created; 1,46,747 invalid/duplicate records audited and rejected.

### 5. Genuine WebRTC Video Consultations & Signaling
- **Peer-to-Peer Telemedicine**: Built with real WebRTC `RTCPeerConnection`, local and remote video rendering, and Google STUN server integration.
- **Session Signaling**: Real-time SDP offer, SDP answer, and ICE candidate exchange coordinated by the backend.
- **Clinical Controls**: Integrated microphone mute, camera toggle, call timer, and synchronized in-call chat.

### 6. Unified Global Healthcare Search Bar
- **Instant Categorized Results**: Debounced search query across medicines, hospitals, doctors, and medical knowledge articles.
- **Zero-Latency Navigation**: Instant direct navigation to medicine clinical monographs, hospital emergency maps, and doctor scheduling profiles.

### 7. Secure OTP Authentication & Password Recovery
- **Cryptographic OTP Generation**: 6-digit codes with 10-minute expiry and rate-limiting.
- **Passwordless Verification**: Instant reset-token exchange and secure password resets.

---

## 🏗️ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 8, TailwindCSS, Lucide Icons, Leaflet GIS, Recharts |
| **Backend API** | Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy ORM, Uvicorn |
| **Database** | SQLite with WAL mode & 64MB memory page cache (`backend/mediverse.db`) |
| **Data Engineering** | pandas, NumPy, pyarrow, GeoJSON, Requests |
| **Authentication** | JWT Bearer token authentication with SHA-256 password hashing |

---

## 📁 Project Structure

```
SEM PROJECT/
├── backend/
│   ├── database.py              # SQLite engine & session management
│   ├── models.py                # SQLAlchemy ORM models (hospitals, facilities, patients, etc.)
│   ├── schemas.py               # Pydantic request/response validation schemas
│   ├── auth.py                  # JWT authentication, hashing, and role guards
│   ├── main.py                  # FastAPI application entry point & seed data
│   ├── routes/                  # Modular API endpoints
│   │   ├── auth_routes.py       # Authentication & user sessions
│   │   ├── hospital_routes.py   # Facilities search, pagination, filters, and statistics
│   │   ├── patient_routes.py    # Patient registrations & medical history
│   │   ├── report_routes.py     # Medical reports & OCR analysis
│   │   └── rag_routes.py        # Clinical QA RAG & terminology
│   └── scripts/                 # Automated data acquisition & test pipeline
│       ├── discover_datasets.py # Probes public endpoints & connectivity
│       ├── download_datasets.py # Safe resumable streaming downloads
│       ├── clean_datasets.py    # Standardizes schemas, validates GPS, and deduplicates
│       ├── import_datasets.py   # High-throughput batch ingestion into mediverse.db
│       ├── report_dataset_statistics.py # Generates verified audit metrics
│       └── test_api_endpoints.py# Integration test suite
├── data/
│   ├── manifests/               # Download, cleaning, and dataset audit manifests (JSON)
│   ├── reports/                 # Markdown audit reports
│   └── raw/ & processed/       # Extracted datasets (git-ignored)
├── src/
│   ├── components/              # Reusable UI components (Card, PageHeader, Button, etc.)
│   ├── context/                 # AuthContext and ElderModeContext
│   ├── pages/
│   │   ├── patient/             # FindHospital, Dashboard, Profile, Appointments, etc.
│   │   ├── doctor/              # ClinicalContext, PrescriptionWriter, Trends
│   │   └── hospital/            # HospitalDashboard, HospitalAnalytics, Registrations
│   └── services/                # Axios API service bindings (api.js)
├── package.json                 # Frontend dependencies and npm scripts
└── README.md                    # Project documentation
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/Balasridhar143/MediVerse-AI.git
cd MediVerse-AI
```

### 3. Backend Setup
```bash
# Navigate to backend and create a virtual environment
cd backend
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install Python dependencies
pip install fastapi uvicorn sqlalchemy pydantic pandas numpy pyarrow python-jose[cryptography] passlib[bcrypt] python-multipart requests

# Start the FastAPI server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will be live at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.

### 4. Frontend Setup
In a new terminal window from the project root:
```bash
# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```
The web portal will open at `http://localhost:3000`.

---

## 🔐 Demonstration Credentials

The platform is pre-seeded with test accounts for all roles:

| Role | Email | Password | Assigned Scope |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@example.com` | `password123` | Hospital discovery, appointments, lab history |
| **Hospital Administrator** | `admin@example.com` | `password123` | City Care Hospital registration triage & data registry |
| **Hospital Administrator 2** | `admin2@example.com` | `password123` | Metro General Healthcare triage |
| **Doctor** | `doctor@example.com` | `password123` | Patient clinical context & e-prescriptions |

---

## 📊 Dataset Ingestion Pipeline Execution

To re-run or resume the automated Indian healthcare data acquisition pipeline:

```bash
# 1. Discover accessible public endpoints
python backend/scripts/discover_datasets.py

# 2. Download raw archives safely with SHA-256 integrity verification
python backend/scripts/download_datasets.py

# 3. Clean, canonicalize state names, and validate GPS coordinates
python backend/scripts/clean_datasets.py

# 4. Ingest cleaned records into mediverse.db in idempotent batches
python backend/scripts/import_datasets.py

# 5. Generate verified statistics and audit manifests
python backend/scripts/report_dataset_statistics.py

# 6. Run end-to-end endpoint verification
python backend/scripts/test_api_endpoints.py
```

---

## 📜 Public Data Provenance & Legal Compliance

| Dataset | Primary Source | Records | License | Geographic Scope |
| :--- | :--- | :---: | :--- | :--- |
| **National Health Facilities** | Government of India NIC HealthGIS | 132,810 | GODL-India | Nationwide India |
| **Healthcare Facilities & Doctors** | OpenStreetMap / HOTOSM India | 128,774 | ODbL 1.0 | Nationwide India |
| **Indian Pharmaceuticals** | Junioralive Pharma Registry | 251,320 | MIT | India Nationwide |
| **Clinical Lab Observations** | PhysioNet MIMIC-IV | 95,246 | PhysioNet Credentialed | Clinical Standard |
| **Karnataka State Health GIS** | Karnataka Remote Sensing (KGIS) | 12,102 | State Open Data | Karnataka, India |
| **Public Health Indicators** | WHO Global Health & World Bank | 9,502 | CC-BY-4.0 | India National |
| **Diagnostic Knowledge & ICD-10**| HealthcareMagic & CDC NCHS | 111,794 | CC-BY / Public Domain | Clinical Reference |

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE).
Public datasets retain their original licenses (GODL-India, ODbL 1.0, CC-BY-4.0).
