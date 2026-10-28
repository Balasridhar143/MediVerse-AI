import re
import uuid
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth

router = APIRouter(tags=["Patient Registration & Care"])

PHONE_REGEX = re.compile(r"^\+?[0-9\s\-]{7,20}$")

@router.post("/registrations", response_model=schemas.RegistrationOut, status_code=status.HTTP_201_CREATED)
def create_patient_registration(
    data: schemas.RegistrationCreate,
    db: Session = Depends(get_db)
):
    """
    Automatic Patient Registration Workflow:
    1. Validates phone number format
    2. Validates hospital existence
    3. Finds or creates permanent Patient demographic record
    4. Prevents duplicate pending submissions within the last 5 minutes
    5. Stores registration persistently in database
    6. Returns confirmed registration details
    """
    # 1. Validate Phone Number
    clean_phone = data.phone.strip()
    if not PHONE_REGEX.match(clean_phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format. Please provide a valid phone number with 7-20 digits."
        )

    # 2. Validate Hospital
    hospital = db.query(models.Hospital).filter(models.Hospital.id == data.hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target hospital with ID '{data.hospital_id}' does not exist in verified registry."
        )

    # 3. Find or Create Patient Record
    patient = db.query(models.Patient).filter(
        (models.Patient.phone == clean_phone) &
        (models.Patient.full_name.ilike(data.full_name.strip()))
    ).first()

    if not patient:
        patient_id = f"pat_{uuid.uuid4().hex[:8]}"
        patient = models.Patient(
            id=patient_id,
            full_name=data.full_name.strip(),
            age=data.age,
            gender=data.gender,
            blood_group=data.blood_group,
            phone=clean_phone,
            address=data.address or "Address on file"
        )
        db.add(patient)
        db.flush()
    else:
        # Update demographics if provided
        if data.age is not None:
            patient.age = data.age
        if data.gender:
            patient.gender = data.gender
        if data.blood_group:
            patient.blood_group = data.blood_group

    # 4. Duplicate Check (within past 5 minutes)
    five_min_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    existing_reg = db.query(models.PatientRegistration).filter(
        (models.PatientRegistration.patient_id == patient.id) &
        (models.PatientRegistration.hospital_id == data.hospital_id) &
        (models.PatientRegistration.created_at >= five_min_ago) &
        (models.PatientRegistration.status == "Pending")
    ).first()

    if existing_reg:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A recent pending registration already exists for {patient.full_name} at {hospital.hospital_name} (ID: {existing_reg.id})."
        )

    # 5. Create Persistent Patient Registration
    registration_id = f"REG-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    new_registration = models.PatientRegistration(
        id=registration_id,
        patient_id=patient.id,
        hospital_id=hospital.id,
        registration_date=datetime.datetime.utcnow(),
        reason_for_visit=data.reason_for_visit.strip(),
        department=data.department or "General Medicine",
        status="Pending"
    )
    db.add(new_registration)
    db.commit()
    db.refresh(new_registration)

    return new_registration

@router.get("/patients/me/registrations", response_model=List[schemas.RegistrationOut])
def get_my_registrations(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    if not patient:
        # If user email matches patient record
        patient = db.query(models.Patient).filter(models.Patient.full_name == current_user.full_name).first()
        if not patient:
            return []
    
    registrations = db.query(models.PatientRegistration).filter(
        models.PatientRegistration.patient_id == patient.id
    ).order_by(models.PatientRegistration.created_at.desc()).all()
    return registrations
