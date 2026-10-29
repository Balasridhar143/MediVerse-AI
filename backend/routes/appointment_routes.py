import uuid
import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
import models
import auth

router = APIRouter(tags=["Appointments & Consultations Workflow"])

@router.post("/appointments", status_code=status.HTTP_201_CREATED)
def book_appointment(
    payload: Dict[str, Any] = Body(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient books a consultation appointment with a doctor.
    Stores record persistently and dispatches notification to doctor.
    """
    # 1. Resolve Doctor
    doctor_identifier = payload.get("doctor_id") or payload.get("doctor") or ""
    doctor_name = payload.get("doctor_name") or payload.get("doctor") or ""
    
    # Try finding doctor user directly from User table
    doctor_user = None
    if doctor_identifier:
        doctor_user = db.query(models.User).filter(
            models.User.role == "doctor",
            or_(
                models.User.id == doctor_identifier,
                models.User.full_name.ilike(f"%{doctor_identifier}%")
            )
        ).first()

    # If not found yet, check Doctor table (by id, user_id, or full_name)
    if not doctor_user and doctor_identifier:
        doc_record = db.query(models.Doctor).filter(
            or_(
                models.Doctor.id == doctor_identifier,
                models.Doctor.user_id == doctor_identifier,
                models.Doctor.full_name.ilike(f"%{doctor_identifier}%")
            )
        ).first()
        if doc_record:
            if not doctor_name:
                doctor_name = doc_record.full_name
            if doc_record.user_id:
                doctor_user = db.query(models.User).filter(
                    models.User.id == doc_record.user_id,
                    models.User.role == "doctor"
                ).first()

    # If still not found, check Professional table
    if not doctor_user and doctor_identifier:
        prof_record = db.query(models.Professional).filter(
            or_(
                models.Professional.id == doctor_identifier,
                models.Professional.name.ilike(f"%{doctor_identifier}%")
            )
        ).first()
        if prof_record and not doctor_name:
            doctor_name = prof_record.name if prof_record.name.startswith("Dr.") else f"Dr. {prof_record.name}"

    # If doctor_user is not yet resolved, match by specialization or department
    if not doctor_user:
        spec = payload.get("specialization") or payload.get("department") or ""
        if spec:
            doc_with_spec = db.query(models.Doctor).filter(
                or_(
                    models.Doctor.specialization.ilike(f"%{spec}%"),
                    models.Doctor.department.ilike(f"%{spec}%")
                )
            ).first()
            if doc_with_spec and doc_with_spec.user_id:
                doctor_user = db.query(models.User).filter(
                    models.User.id == doc_with_spec.user_id,
                    models.User.role == "doctor"
                ).first()
                if not doctor_name:
                    doctor_name = doc_with_spec.full_name

    # If still not found, fallback to the primary verified registered doctor
    if not doctor_user:
        doctor_user = db.query(models.User).filter(models.User.role == "doctor").first()

    if not doctor_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Designated doctor is not registered for telehealth appointments."
        )

    if not doctor_name and doctor_user:
        doctor_name = doctor_user.full_name
    elif not doctor_name:
        doctor_name = "Dr. Arun Kumar"

    appointment_date = payload.get("appointment_date") or payload.get("date") or datetime.date.today().isoformat()
    time_slot = payload.get("time_slot") or payload.get("time") or "10:00 AM"
    hospital_name = payload.get("hospital_name") or payload.get("hospital") or "City Care Multispeciality Hospital"
    specialization = payload.get("specialization") or payload.get("department") or "General Medicine"
    department = payload.get("department") or payload.get("specialization") or "General Medicine"

    # 2. Extract and ensure patient details & profile record
    patient_profile = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    if not patient_profile and current_user.role == "patient":
        patient_profile = models.Patient(
            id=f"pat_{uuid.uuid4().hex[:8]}",
            user_id=current_user.id,
            full_name=current_user.full_name,
            phone=payload.get("patient_phone") or "+91 98765 43210",
            address="Address on record"
        )
        db.add(patient_profile)
        db.flush()

    patient_phone = payload.get("patient_phone") or (patient_profile.phone if patient_profile else "+91 98765 43210")
    patient_email = current_user.email
    patient_name = current_user.full_name

    # Ensure doctor has doctor profile
    doctor_profile = db.query(models.Doctor).filter(models.Doctor.user_id == doctor_user.id).first()
    if not doctor_profile:
        doctor_profile = models.Doctor(
            id=f"doc_{uuid.uuid4().hex[:8]}",
            user_id=doctor_user.id,
            full_name=doctor_user.full_name,
            specialization=specialization,
            hospital_name=hospital_name,
            is_available=True,
            is_verified=True
        )
        db.add(doctor_profile)
        db.flush()

    # 3. Create appointment
    apt_id = f"apt_{uuid.uuid4().hex[:8]}"
    room_id = f"room_{apt_id}"

    new_apt = models.Appointment(
        id=apt_id,
        patient_id=current_user.id,
        doctor_id=doctor_user.id,
        doctor_profile_id=doctor_profile.id if doctor_profile else None,
        doctor_name=doctor_name,
        patient_name=patient_name,
        patient_phone=patient_phone,
        patient_email=patient_email,
        hospital_name=hospital_name,
        specialization=specialization,
        department=department,
        appointment_date=appointment_date,
        time_slot=time_slot,
        type=payload.get("type") or "Video Consultation",
        notes=payload.get("notes") or "",
        status="PENDING",
        room_id=room_id,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(new_apt)
    db.flush()

    # 4. Create persistent notification for Doctor
    notif = models.Notification(
        id=f"notif_{uuid.uuid4().hex[:8]}",
        user_id=doctor_user.id,
        type="APPOINTMENT_REQUEST",
        title="New Consultation Request",
        message=f"{patient_name} requested a {new_apt.type} on {new_apt.appointment_date} at {new_apt.time_slot}.",
        entity_id=new_apt.id,
        link_url="/doctor/dashboard",
        is_read=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(notif)
    db.commit()

    return {
        "id": new_apt.id,
        "patientId": new_apt.patient_id,
        "patient_id": new_apt.patient_id,
        "doctorId": new_apt.doctor_id,
        "doctor_id": new_apt.doctor_id,
        "doctorName": new_apt.doctor_name,
        "doctor_name": new_apt.doctor_name,
        "patientName": new_apt.patient_name,
        "patient_name": new_apt.patient_name,
        "hospital": new_apt.hospital_name,
        "hospital_name": new_apt.hospital_name,
        "specialization": new_apt.specialization,
        "department": new_apt.department,
        "date": new_apt.appointment_date,
        "appointment_date": new_apt.appointment_date,
        "time": new_apt.time_slot,
        "time_slot": new_apt.time_slot,
        "type": new_apt.type,
        "notes": new_apt.notes,
        "status": new_apt.status,
        "roomId": new_apt.room_id,
        "room_id": new_apt.room_id,
        "createdAt": new_apt.created_at.isoformat()
    }

@router.get("/appointments/my-appointments")
def get_my_appointments(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve logged-in patient's appointments.
    """
    apts = db.query(models.Appointment).filter(
        models.Appointment.patient_id == current_user.id
    ).order_by(models.Appointment.created_at.desc()).all()

    return [
        {
            "id": a.id,
            "patientId": a.patient_id,
            "patient_id": a.patient_id,
            "doctorId": a.doctor_id,
            "doctor_id": a.doctor_id,
            "doctorName": a.doctor_name,
            "doctor_name": a.doctor_name,
            "patientName": a.patient_name,
            "patient_name": a.patient_name,
            "hospital": a.hospital_name,
            "hospital_name": a.hospital_name,
            "specialization": a.specialization,
            "department": a.department,
            "date": a.appointment_date,
            "appointment_date": a.appointment_date,
            "time": a.time_slot,
            "time_slot": a.time_slot,
            "type": a.type,
            "notes": a.notes,
            "status": a.status,
            "roomId": a.room_id,
            "room_id": a.room_id,
            "rejection_reason": a.rejection_reason,
            "createdAt": a.created_at.isoformat() if a.created_at else None,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in apts
    ]

@router.get("/doctor/appointments")
def get_doctor_appointments(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve logged-in doctor's appointments.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can view clinical schedule.")

    apts = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == current_user.id
    ).order_by(models.Appointment.created_at.desc()).all()

    return [
        {
            "id": a.id,
            "patientId": a.patient_id,
            "patient_id": a.patient_id,
            "doctorId": a.doctor_id,
            "doctor_id": a.doctor_id,
            "doctorName": a.doctor_name,
            "doctor_name": a.doctor_name,
            "patientName": a.patient_name,
            "patient_name": a.patient_name,
            "patientPhone": a.patient_phone,
            "patient_phone": a.patient_phone,
            "patientEmail": a.patient_email,
            "patient_email": a.patient_email,
            "hospital": a.hospital_name,
            "hospital_name": a.hospital_name,
            "specialization": a.specialization,
            "department": a.department,
            "date": a.appointment_date,
            "appointment_date": a.appointment_date,
            "time": a.time_slot,
            "time_slot": a.time_slot,
            "type": a.type,
            "notes": a.notes,
            "chiefComplaint": a.notes or "General clinical checkup",
            "status": a.status,
            "roomId": a.room_id,
            "room_id": a.room_id,
            "createdAt": a.created_at.isoformat() if a.created_at else None,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in apts
    ]

@router.patch("/appointments/{appointment_id}/accept")
def accept_appointment(
    appointment_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Doctor approves an appointment request. Status updates to CONFIRMED.
    Dispatches real-time notification to patient with room access.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors may accept appointments.")

    apt = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id,
        models.Appointment.doctor_id == current_user.id
    ).first()

    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    apt.status = "CONFIRMED"
    if not apt.room_id:
        apt.room_id = f"room_{apt.id}"
    apt.updated_at = datetime.datetime.utcnow()

    # Notify patient
    notif = models.Notification(
        id=f"notif_{uuid.uuid4().hex[:8]}",
        user_id=apt.patient_id,
        type="APPOINTMENT_CONFIRMED",
        title="Appointment Confirmed",
        message=f"Dr. {current_user.full_name} has accepted your consultation for {apt.appointment_date} at {apt.time_slot}. Tele-Room is ready.",
        entity_id=apt.id,
        link_url=f"/patient/consultations?appointmentId={apt.id}",
        is_read=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(notif)
    db.commit()

    return {
        "success": True,
        "message": "Appointment approved successfully.",
        "appointment": {
            "id": apt.id,
            "status": apt.status,
            "roomId": apt.room_id
        }
    }

@router.patch("/appointments/{appointment_id}/reject")
def reject_appointment(
    appointment_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Doctor declines an appointment request with an optional reason.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors may decline appointments.")

    apt = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id,
        models.Appointment.doctor_id == current_user.id
    ).first()

    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    reason = payload.get("reason", "Clinician schedule conflict").strip()
    apt.status = "REJECTED"
    apt.rejection_reason = reason
    apt.updated_at = datetime.datetime.utcnow()

    # Notify patient
    notif = models.Notification(
        id=f"notif_{uuid.uuid4().hex[:8]}",
        user_id=apt.patient_id,
        type="APPOINTMENT_REJECTED",
        title="Appointment Declined",
        message=f"Dr. {current_user.full_name} was unable to accept your request. Reason: {reason}",
        entity_id=apt.id,
        link_url="/patient/appointments",
        is_read=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(notif)
    db.commit()

    return {"success": True, "message": "Appointment declined.", "status": "REJECTED"}

@router.patch("/appointments/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient cancels their appointment request.
    """
    apt = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id,
        or_(
            models.Appointment.patient_id == current_user.id,
            models.Appointment.doctor_id == current_user.id
        )
    ).first()

    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    apt.status = "CANCELLED"
    apt.updated_at = datetime.datetime.utcnow()

    # Notify counterpart
    target_user_id = apt.doctor_id if current_user.id == apt.patient_id else apt.patient_id
    notif = models.Notification(
        id=f"notif_{uuid.uuid4().hex[:8]}",
        user_id=target_user_id,
        type="APPOINTMENT_CANCELLED",
        title="Appointment Cancelled",
        message=f"Consultation on {apt.appointment_date} at {apt.time_slot} was cancelled by {current_user.full_name}.",
        entity_id=apt.id,
        link_url="/patient/appointments" if current_user.role == "doctor" else "/doctor/dashboard",
        is_read=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(notif)
    db.commit()

    return {"success": True, "message": "Appointment cancelled successfully."}

