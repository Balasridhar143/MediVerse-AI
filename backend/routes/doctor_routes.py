import json
import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, and_
from database import get_db
import models
import auth

router = APIRouter(tags=["Doctors & Clinical Specialists"])

@router.get("/doctors")
def list_doctors(
    search: Optional[str] = Query(None, description="Search by doctor name, specialization, or hospital"),
    specialization: Optional[str] = Query(None, description="Filter by clinical specialty"),
    department: Optional[str] = Query(None, description="Filter by department"),
    state: Optional[str] = Query(None, description="Filter by state"),
    district: Optional[str] = Query(None, description="Filter by district"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Search and filter registered telehealth doctors and verified healthcare professionals.
    """
    # 1. Fetch registered telehealth doctors from 'doctors' table
    doc_query = db.query(models.Doctor)
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        doc_query = doc_query.filter(
            or_(
                func.lower(models.Doctor.full_name).like(term),
                func.lower(models.Doctor.specialization).like(term),
                func.lower(models.Doctor.hospital_name).like(term),
                func.lower(models.Doctor.department).like(term)
            )
        )
    if specialization and specialization.lower() != "all":
        doc_query = doc_query.filter(func.lower(models.Doctor.specialization).like(f"%{specialization.strip().lower()}%"))
    if department and department.lower() != "all":
        doc_query = doc_query.filter(func.lower(models.Doctor.department).like(f"%{department.strip().lower()}%"))

    registered_doctors = doc_query.all()

    formatted_docs = []
    for d in registered_doctors:
        slots = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"]
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        if d.available_slots:
            try:
                slots = json.loads(d.available_slots) if isinstance(d.available_slots, str) else d.available_slots
            except Exception:
                pass
        if d.available_days:
            try:
                days = json.loads(d.available_days) if isinstance(d.available_days, str) else d.available_days
            except Exception:
                pass

        formatted_docs.append({
            "id": d.id,
            "user_id": d.user_id,
            "userId": d.user_id,
            "name": d.full_name,
            "doctor_name": d.full_name,
            "specialization": d.specialization,
            "qualifications": d.qualifications or "MBBS, MD",
            "hospital": d.hospital_name or "City Care Multispeciality Hospital",
            "hospital_name": d.hospital_name or "City Care Multispeciality Hospital",
            "hospital_id": d.hospital_id,
            "department": d.department or d.specialization,
            "experienceYears": d.experience_years or 8,
            "rating": float(d.rating or 4.9),
            "reviewCount": d.review_count or 14,
            "consultationFee": float(d.consultation_fee or 500.0),
            "about": d.about or f"Dr. {d.full_name} is a specialist in {d.specialization} offering comprehensive telehealth evaluations.",
            "availableSlots": slots,
            "availableDays": days,
            "isAvailable": bool(d.is_available),
            "isVerified": bool(d.is_verified),
            "isTelehealthActive": True,
            "type": "Registered Telehealth Clinician",
            "source": "Mediverse Telehealth Registry"
        })

    # 2. Also search verified clinical practitioners from 'professionals' table
    prof_query = db.query(models.Professional).filter(
        models.Professional.registration_status != "Clinical Center"
    )
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        prof_query = prof_query.filter(
            or_(
                func.lower(models.Professional.name).like(term),
                func.lower(models.Professional.specialization).like(term),
                func.lower(models.Professional.hospital_affiliation).like(term)
            )
        )
    if specialization and specialization.lower() != "all":
        prof_query = prof_query.filter(func.lower(models.Professional.specialization).like(f"%{specialization.strip().lower()}%"))
    if state and state.lower() != "all":
        prof_query = prof_query.filter(func.lower(models.Professional.state).like(f"%{state.strip().lower()}%"))
    if district and district.lower() != "all":
        prof_query = prof_query.filter(func.lower(models.Professional.district).like(f"%{district.strip().lower()}%"))

    # Limit professional records to supplement registered telehealth doctors
    prof_limit = max(0, limit - len(formatted_docs))
    profs = prof_query.limit(prof_limit).all()

    for p in profs:
        formatted_docs.append({
            "id": p.id,
            "user_id": None,
            "name": p.name if p.name.startswith("Dr.") else f"Dr. {p.name}",
            "specialization": p.specialization or "General Medicine & Clinical Practice",
            "qualifications": p.qualification or "MBBS / State Medical Council Registered",
            "hospital": p.hospital_affiliation or f"District Health Hospital, {p.district or p.state or 'India'}",
            "hospital_id": None,
            "department": p.specialization or "General Medicine",
            "experienceYears": 10,
            "rating": 4.8,
            "reviewCount": 9,
            "consultationFee": 400.0,
            "about": f"{p.name} is a verified clinical professional registered in {p.state or 'India'}.",
            "availableSlots": ["10:00 AM", "11:30 AM", "03:00 PM", "05:00 PM"],
            "availableDays": ["Monday", "Wednesday", "Friday"],
            "isAvailable": True,
            "isVerified": True,
            "isTelehealthActive": False,
            "type": "National Medical Council Verified Professional",
            "source": p.source or "State Medical Council Registry"
        })

    return formatted_docs

@router.get("/doctors/{doctor_id}")
def get_doctor_details(doctor_id: str, db: Session = Depends(get_db)):
    """
    Get full clinical profile for a specific doctor.
    """
    d = db.query(models.Doctor).filter(
        or_(models.Doctor.id == doctor_id, models.Doctor.user_id == doctor_id)
    ).first()

    if d:
        slots = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"]
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        if d.available_slots:
            try:
                slots = json.loads(d.available_slots) if isinstance(d.available_slots, str) else d.available_slots
            except Exception:
                pass
        if d.available_days:
            try:
                days = json.loads(d.available_days) if isinstance(d.available_days, str) else d.available_days
            except Exception:
                pass

        return {
            "id": d.id,
            "user_id": d.user_id,
            "userId": d.user_id,
            "name": d.full_name,
            "doctor_name": d.full_name,
            "specialization": d.specialization,
            "qualifications": d.qualifications or "MBBS, MD",
            "hospital": d.hospital_name or "City Care Multispeciality Hospital",
            "hospital_name": d.hospital_name or "City Care Multispeciality Hospital",
            "hospital_id": d.hospital_id,
            "department": d.department or d.specialization,
            "licenseNumber": d.license_number,
            "experienceYears": d.experience_years or 8,
            "rating": float(d.rating or 4.9),
            "reviewCount": d.review_count or 14,
            "consultationFee": float(d.consultation_fee or 500.0),
            "about": d.about or f"Dr. {d.full_name} is a specialist in {d.specialization}.",
            "availableSlots": slots,
            "availableDays": days,
            "isAvailable": bool(d.is_available),
            "isVerified": bool(d.is_verified),
            "isTelehealthActive": True
        }

    # Also check professionals
    p = db.query(models.Professional).filter(models.Professional.id == doctor_id).first()
    if p:
        return {
            "id": p.id,
            "user_id": None,
            "name": p.name if p.name.startswith("Dr.") else f"Dr. {p.name}",
            "specialization": p.specialization or "General Medicine",
            "qualifications": p.qualification or "MBBS",
            "hospital": p.hospital_affiliation or f"District Health Hospital, {p.district or p.state or 'India'}",
            "hospital_id": None,
            "department": p.specialization or "General Medicine",
            "licenseNumber": p.registration_number or "Verified In Registry",
            "experienceYears": 10,
            "rating": 4.8,
            "reviewCount": 8,
            "consultationFee": 400.0,
            "about": f"{p.name} is a registered healthcare practitioner.",
            "availableSlots": ["10:00 AM", "02:00 PM"],
            "availableDays": ["Monday", "Wednesday", "Friday"],
            "isAvailable": True,
            "isVerified": True,
            "isTelehealthActive": False
        }

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")

@router.put("/doctor/profile")
def update_doctor_profile(
    profile_data: Dict[str, Any] = Body(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update logged-in doctor's clinical profile.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors may update clinical profile.")

    doc = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doc:
        doc = models.Doctor(
            id=f"doc_{current_user.id}",
            user_id=current_user.id,
            full_name=current_user.full_name
        )
        db.add(doc)

    if "specialization" in profile_data:
        doc.specialization = profile_data["specialization"]
    if "department" in profile_data:
        doc.department = profile_data["department"]
    if "hospital_name" in profile_data:
        doc.hospital_name = profile_data["hospital_name"]
    if "qualifications" in profile_data:
        doc.qualifications = profile_data["qualifications"]
    if "consultation_fee" in profile_data:
        try:
            doc.consultation_fee = float(profile_data["consultation_fee"])
        except Exception:
            pass
    if "about" in profile_data:
        doc.about = profile_data["about"]
    if "available_slots" in profile_data:
        slots = profile_data["available_slots"]
        doc.available_slots = json.dumps(slots) if isinstance(slots, list) else slots
    if "available_days" in profile_data:
        days = profile_data["available_days"]
        doc.available_days = json.dumps(days) if isinstance(days, list) else days

    db.commit()
    return {"success": True, "message": "Doctor clinical profile updated successfully."}

@router.put("/doctor/availability")
def update_doctor_availability(
    data: Dict[str, Any] = Body(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update logged-in doctor's available days and time slots.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors may adjust consultation schedule.")

    doc = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found.")

    if "slots" in data:
        doc.available_slots = json.dumps(data["slots"]) if isinstance(data["slots"], list) else data["slots"]
    if "days" in data:
        doc.available_days = json.dumps(data["days"]) if isinstance(data["days"], list) else data["days"]
    if "is_available" in data:
        doc.is_available = bool(data["is_available"])

    db.commit()
    return {"success": True, "message": "Consultation schedule updated."}

@router.get("/doctor/stats")
def get_doctor_stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dynamic stats for doctor dashboard: pending requests, today's consultations, upcoming, active patients.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized role.")

    today_str = datetime.date.today().isoformat()

    pending_count = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == current_user.id,
        models.Appointment.status == "PENDING"
    ).count()

    today_count = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == current_user.id,
        models.Appointment.appointment_date == today_str,
        models.Appointment.status.in_(["CONFIRMED", "UPCOMING"])
    ).count()

    upcoming_count = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == current_user.id,
        models.Appointment.status.in_(["CONFIRMED", "UPCOMING"])
    ).count()

    active_patients = db.query(func.count(func.distinct(models.Appointment.patient_id))).filter(
        models.Appointment.doctor_id == current_user.id
    ).scalar() or 0

    return {
        "pending_requests": pending_count,
        "today_consultations": today_count,
        "upcoming_consultations": upcoming_count,
        "active_patients": active_patients
    }

@router.get("/doctor/patients")
def get_doctor_patient_roster(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Active patient roster for this doctor based on appointment history.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized role.")

    # Find distinct patients who have had appointments with this doctor
    apts = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == current_user.id
    ).order_by(models.Appointment.created_at.desc()).all()

    seen_patients = set()
    roster = []
    for a in apts:
        if a.patient_id not in seen_patients:
            seen_patients.add(a.patient_id)
            patient_rec = db.query(models.Patient).filter(models.Patient.user_id == a.patient_id).first()
            roster.append({
                "patient_id": a.patient_id,
                "name": a.patient_name,
                "phone": a.patient_phone or (patient_rec.phone if patient_rec else "On file"),
                "email": a.patient_email,
                "age": patient_rec.age if patient_rec else None,
                "gender": patient_rec.gender if patient_rec else None,
                "blood_group": patient_rec.blood_group if patient_rec else None,
                "last_appointment_date": a.appointment_date,
                "last_status": a.status,
                "chief_complaint": a.notes or "Routine clinical evaluation"
            })

    return roster

