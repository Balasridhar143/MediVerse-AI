import os
import sys
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, SessionLocal
import models
import auth
from routes import (
    auth_routes,
    patient_routes,
    hospital_routes,
    report_routes,
    rag_routes,
    medicine_routes,
    doctor_routes,
    appointment_routes,
    consultation_routes,
    notification_routes,
    search_routes,
)

# Create all database tables automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MediVerse AI — Clinical Telehealth & Diagnostic Intelligence API",
    description="Backend API powering longitudinal health records, patient registration, RAG intelligence, and hospital administration.",
    version="1.0.0"
)

# CORS configuration for frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://0.0.0.0:3000",
    "https://balasridhar143.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.github\.io",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
app.include_router(auth_routes.router, prefix="/api")
app.include_router(hospital_routes.router, prefix="/api")
app.include_router(patient_routes.router, prefix="/api")
app.include_router(report_routes.router, prefix="/api")
app.include_router(rag_routes.router, prefix="/api")
app.include_router(medicine_routes.router, prefix="/api")
app.include_router(doctor_routes.router, prefix="/api")
app.include_router(appointment_routes.router, prefix="/api")
app.include_router(consultation_routes.router, prefix="/api")
app.include_router(notification_routes.router, prefix="/api")
app.include_router(search_routes.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MediVerse AI Clinical API",
        "version": "1.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": "SQLite Persistent (mediverse.db)",
        "demonstration_accounts": [
            {"role": "patient", "email": "patient@example.com"},
            {"role": "doctor", "email": "doctor@example.com"},
            {"role": "hospital_admin", "email": "admin@example.com", "hospital": "City Care Multispeciality Hospital"},
            {"role": "hospital_admin", "email": "admin2@example.com", "hospital": "Metro General Healthcare"}
        ]
    }

def seed_initial_data():
    """Initializes verified hospitals and default demonstration credentials."""
    db: Session = SessionLocal()
    try:
        # 1. Seed Verified Hospitals with accurate coordinates
        hospitals_data = [
            {
                "id": "hosp_1",
                "hospital_name": "City Care Multispeciality Hospital",
                "address": "Sector 4, Central Avenue, Tech Zone",
                "city": "New Delhi",
                "state": "Delhi",
                "postal_code": "110001",
                "phone": "+91 11 2345 6789",
                "emergency_phone": "108 / +91 11 2345 9999",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "departments": "Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Emergency",
                "available_doctors": 24,
                "emergency_availability": "24x7 Emergency & Trauma Care Available",
                "source": "Verified Healthcare Registry (NABH-2026-09)"
            },
            {
                "id": "hosp_2",
                "hospital_name": "Metro General Healthcare",
                "address": "MG Road, Metro Pillar 128",
                "city": "Gurugram",
                "state": "Haryana",
                "postal_code": "122002",
                "phone": "+91 11 3456 7890",
                "emergency_phone": "108 / +91 11 3456 9999",
                "latitude": 28.4595,
                "longitude": 77.0266,
                "departments": "General Medicine, Pediatrics, ENT, Dermatology, Emergency",
                "available_doctors": 18,
                "emergency_availability": "24x7 Emergency Unit Active",
                "source": "Verified Healthcare Registry (NABH-2026-11)"
            },
            {
                "id": "hosp_3",
                "hospital_name": "Apollo Indraprastha Institute of Medical Sciences",
                "address": "Sarita Vihar, Delhi Mathura Road",
                "city": "New Delhi",
                "state": "Delhi",
                "postal_code": "110076",
                "phone": "+91 11 2692 5858",
                "emergency_phone": "1066",
                "latitude": 28.5355,
                "longitude": 77.2940,
                "departments": "Cardiology, Oncology, Nephrology, General Medicine, Trauma",
                "available_doctors": 35,
                "emergency_availability": "Level 1 Trauma & Emergency Care",
                "source": "Verified Healthcare Registry"
            },
            {
                "id": "hosp_4",
                "hospital_name": "Max Super Speciality Hospital",
                "address": "1, 2, Press Enclave Marg, Saket",
                "city": "New Delhi",
                "state": "Delhi",
                "postal_code": "110017",
                "phone": "+91 11 2651 5050",
                "emergency_phone": "108 / +91 11 4055 4055",
                "latitude": 28.5273,
                "longitude": 77.2140,
                "departments": "Neurology, Cardiac Sciences, Orthopedics, Pulmonology",
                "available_doctors": 28,
                "emergency_availability": "24x7 Critical Care & Emergency Unit",
                "source": "Verified Healthcare Registry"
            }
        ]

        for hosp in hospitals_data:
            existing = db.query(models.Hospital).filter(models.Hospital.id == hosp["id"]).first()
            if not existing:
                db.add(models.Hospital(**hosp))
        db.commit()

        # 2. Seed Demonstration Accounts (Securely Hashed)
        demo_users = [
            {
                "id": "usr_pat_001",
                "full_name": "Gokul Sankar",
                "email": "patient@example.com",
                "password": "password123",
                "role": "patient",
                "hospital_id": None,
                "patient_info": {
                    "id": "pat_001",
                    "full_name": "Gokul Sankar",
                    "age": 42,
                    "gender": "Male",
                    "phone": "+91 98765 43210",
                    "blood_group": "B+",
                    "address": "B-42 Tech Avenue, New Delhi"
                }
            },
            {
                "id": "usr_pat_002",
                "full_name": "Rahul Sharma",
                "email": "patient@test.com",
                "password": "password123",
                "role": "patient",
                "hospital_id": None,
                "patient_info": {
                    "id": "pat_002",
                    "full_name": "Rahul Sharma",
                    "age": 42,
                    "gender": "Male",
                    "phone": "+91 98765 43211",
                    "blood_group": "B+",
                    "address": "Sector 14, Gurugram"
                }
            },
            {
                "id": "usr_doc_001",
                "full_name": "Dr. Arun Kumar",
                "email": "doctor@example.com",
                "password": "password123",
                "role": "doctor",
                "hospital_id": "hosp_1"
            },
            {
                "id": "usr_adm_001",
                "full_name": "City Hospital Administrator",
                "email": "admin@example.com",
                "password": "password123",
                "role": "hospital_admin",
                "hospital_id": "hosp_1"
            },
            {
                "id": "usr_adm_002",
                "full_name": "Metro General Administrator",
                "email": "admin2@example.com",
                "password": "password123",
                "role": "hospital_admin",
                "hospital_id": "hosp_2"
            }
        ]

        for u in demo_users:
            existing = db.query(models.User).filter(models.User.email == u["email"]).first()
            if not existing:
                new_user = models.User(
                    id=u["id"],
                    full_name=u["full_name"],
                    email=u["email"],
                    password_hash=auth.hash_password(u["password"]),
                    role=u["role"],
                    hospital_id=u["hospital_id"]
                )
                db.add(new_user)
                db.flush()

                if "patient_info" in u:
                    p_info = u["patient_info"]
                    existing_p = db.query(models.Patient).filter(models.Patient.id == p_info["id"]).first()
                    if not existing_p:
                        db.add(models.Patient(
                            id=p_info["id"],
                            user_id=new_user.id,
                            full_name=p_info["full_name"],
                            age=p_info["age"],
                            gender=p_info["gender"],
                            phone=p_info["phone"],
                            blood_group=p_info["blood_group"],
                            address=p_info["address"]
                        ))
        db.commit()

        # 3. Seed an initial Patient Registration for demonstration
        existing_reg = db.query(models.PatientRegistration).first()
        if not existing_reg:
            sample_reg = models.PatientRegistration(
                id="REG-20261027-HOSP01",
                patient_id="pat_001",
                hospital_id="hosp_1",
                registration_date=datetime.datetime.utcnow(),
                reason_for_visit="Hypertension evaluation and routine lipid panel screening",
                department="Cardiology",
                status="Pending"
            )
            db.add(sample_reg)
            db.commit()

    except Exception as e:
        db.rollback()
        print(f"[Seed Error] {e}")
    finally:
        db.close()

seed_initial_data()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
