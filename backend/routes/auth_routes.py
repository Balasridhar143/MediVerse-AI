import uuid
import datetime
import secrets
import re
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from services.email_service import send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication & Security"])

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

@router.post("/register")
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    clean_email = user_in.email.lower().strip()
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid email address format."
        )

    # 1. Check if email already registered
    existing_user = db.query(models.User).filter(models.User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address is already registered."
        )

    # 2. Normalize role
    raw_role = user_in.role or "patient"
    assigned_role = "hospital_admin" if raw_role in ["hospital_admin", "hospital"] else raw_role
    hospital_id = user_in.hospital_id

    # If hospital admin registering with hospital name
    if assigned_role == "hospital_admin" and not hospital_id and user_in.hospital_name:
        hosp = db.query(models.Hospital).filter(
            models.Hospital.hospital_name.ilike(f"%{user_in.hospital_name.strip()}%")
        ).first()
        if not hosp:
            hosp = models.Hospital(
                id=f"hosp_{uuid.uuid4().hex[:8]}",
                hospital_name=user_in.hospital_name.strip(),
                address="Accredited Healthcare Hub Campus",
                city="Capital District",
                state="Delhi",
                latitude=28.6139,
                longitude=77.2090,
                departments="General Medicine, Emergency, Surgery",
                source="Hospital Administrator Self-Registration"
            )
            db.add(hosp)
            db.flush()
        hospital_id = hosp.id

    # 3. Create persistent User record
    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    hashed_pwd = auth.hash_password(user_in.password)
    
    new_user = models.User(
        id=user_id,
        full_name=user_in.full_name.strip(),
        email=clean_email,
        password_hash=hashed_pwd,
        role=assigned_role,
        hospital_id=hospital_id
    )
    db.add(new_user)
    db.flush()

    profile_data: Dict[str, Any] = {}

    # 4. Role-specific profile initialization
    if assigned_role == "patient":
        patient_id = f"pat_{uuid.uuid4().hex[:8]}"
        patient_rec = models.Patient(
            id=patient_id,
            user_id=new_user.id,
            full_name=user_in.full_name.strip(),
            age=user_in.age,
            gender=user_in.gender or "Male",
            blood_group=user_in.blood_group or "B+",
            phone=user_in.phone or "+91 98765 43210",
            address=user_in.address or "Address on record"
        )
        db.add(patient_rec)
        db.flush()
        profile_data = {
            "patient_id": patient_rec.id,
            "age": patient_rec.age,
            "gender": patient_rec.gender,
            "blood_group": patient_rec.blood_group,
            "phone": patient_rec.phone,
            "address": patient_rec.address
        }

    elif assigned_role == "doctor":
        doc_id = f"doc_{uuid.uuid4().hex[:8]}"
        doctor_rec = models.Doctor(
            id=doc_id,
            user_id=new_user.id,
            full_name=user_in.full_name.strip(),
            specialization=user_in.specialization or "General Medicine",
            license_number=user_in.facility_id or f"MCI-{uuid.uuid4().hex[:6].upper()}",
            hospital_id=hospital_id or "hosp_1",
            hospital_name=user_in.hospital_name or "City Care Multispeciality Hospital",
            department=user_in.specialization or "General Medicine",
            experience_years=5,
            rating=4.9,
            review_count=1,
            consultation_fee=500.0,
            is_available=True,
            is_verified=True
        )
        db.add(doctor_rec)
        db.flush()
        profile_data = {
            "doctor_id": doctor_rec.id,
            "specialization": doctor_rec.specialization,
            "license_number": doctor_rec.license_number,
            "hospital_name": doctor_rec.hospital_name,
            "department": doctor_rec.department,
            "consultation_fee": doctor_rec.consultation_fee
        }

    db.commit()
    db.refresh(new_user)

    # 5. Generate secure JWT token
    token = auth.create_access_token({
        "sub": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "full_name": new_user.full_name
    })

    return {
        "access_token": token,
        "token_type": "Bearer",
        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "hospital_id": new_user.hospital_id,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None,
            **profile_data
        }
    }

@router.post("/login")
def login_user(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    clean_email = login_data.email.lower().strip()
    user = db.query(models.User).filter(models.User.email == clean_email).first()
    if not user or not auth.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )

    profile_data: Dict[str, Any] = {}
    if user.role == "patient" and user.patient_profile:
        p = user.patient_profile
        profile_data = {
            "patient_id": p.id,
            "age": p.age,
            "gender": p.gender,
            "blood_group": p.blood_group,
            "phone": p.phone,
            "address": p.address
        }
    elif user.role == "doctor" and user.doctor_profile:
        d = user.doctor_profile
        profile_data = {
            "doctor_id": d.id,
            "specialization": d.specialization,
            "license_number": d.license_number,
            "hospital_name": d.hospital_name,
            "department": d.department,
            "consultation_fee": d.consultation_fee,
            "rating": d.rating
        }

    token = auth.create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name
    })

    return {
        "access_token": token,
        "token_type": "Bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "name": user.full_name,
            "email": user.email,
            "role": user.role,
            "hospital_id": user.hospital_id,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            **profile_data
        }
    }

@router.get("/me")
def get_current_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    profile_data: Dict[str, Any] = {}
    if current_user.role == "patient" and current_user.patient_profile:
        p = current_user.patient_profile
        profile_data = {
            "patient_id": p.id,
            "age": p.age,
            "gender": p.gender,
            "blood_group": p.blood_group,
            "phone": p.phone,
            "address": p.address
        }
    elif current_user.role == "doctor" and current_user.doctor_profile:
        d = current_user.doctor_profile
        profile_data = {
            "doctor_id": d.id,
            "specialization": d.specialization,
            "license_number": d.license_number,
            "hospital_name": d.hospital_name,
            "department": d.department,
            "consultation_fee": d.consultation_fee,
            "rating": d.rating
        }

    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "hospital_id": current_user.hospital_id,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        **profile_data
    }

@router.post("/forgot-password")
def forgot_password(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email address is required.")

    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid email format.")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # User enumeration protection: return uniform generic response
        return {
            "success": True,
            "message": "If an account exists with this email address, a 6-digit verification code has been dispatched.",
            "cooldown": 60
        }

    # Rate limiting: 60-second cooldown
    one_min_ago = datetime.datetime.utcnow() - datetime.timedelta(seconds=60)
    recent_otp = db.query(models.OTP).filter(
        models.OTP.email == email,
        models.OTP.purpose == "PASSWORD_RESET",
        models.OTP.created_at > one_min_ago
    ).first()
    if recent_otp:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait at least 60 seconds before requesting another verification code."
        )

    # Invalidate previous unused OTPs for password reset
    db.query(models.OTP).filter(
        models.OTP.email == email,
        models.OTP.purpose == "PASSWORD_RESET",
        models.OTP.is_used == False
    ).update({"is_used": True})

    # Generate cryptographically secure 6-digit code
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    otp_id = f"otp_{secrets.token_hex(8)}"
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)

    new_otp = models.OTP(
        id=otp_id,
        email=email,
        otp_code=otp_code,
        purpose="PASSWORD_RESET",
        attempts=0,
        is_used=False,
        expires_at=expires_at,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_otp)
    db.commit()

    success, msg, _ = send_otp_email(email, otp_code, purpose="PASSWORD_RESET")
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to dispatch verification code via email provider."
        )

    return {
        "success": True,
        "message": msg,
        "cooldown": 60
    }

@router.post("/request-otp")
def request_login_otp(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email address is required.")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Uniform response prevents user enumeration
        return {
            "success": True,
            "message": "If an account exists with this email address, a 6-digit verification code has been dispatched.",
            "cooldown": 60
        }

    # Cooldown check
    one_min_ago = datetime.datetime.utcnow() - datetime.timedelta(seconds=60)
    recent_otp = db.query(models.OTP).filter(
        models.OTP.email == email,
        models.OTP.purpose == "LOGIN",
        models.OTP.created_at > one_min_ago
    ).first()
    if recent_otp:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait 60 seconds before requesting a new code."
        )

    # Invalidate older unused OTPs
    db.query(models.OTP).filter(
        models.OTP.email == email,
        models.OTP.purpose == "LOGIN",
        models.OTP.is_used == False
    ).update({"is_used": True})

    otp_code = f"{secrets.randbelow(900000) + 100000}"
    new_otp = models.OTP(
        id=f"otp_{secrets.token_hex(8)}",
        email=email,
        otp_code=otp_code,
        purpose="LOGIN",
        attempts=0,
        is_used=False,
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    )
    db.add(new_otp)
    db.commit()

    success, msg, _ = send_otp_email(email, otp_code, purpose="LOGIN")
    return {
        "success": True,
        "message": msg,
        "cooldown": 60
    }

@router.post("/verify-otp")
def verify_otp(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    email = payload.get("email", "").strip().lower()
    code = (payload.get("otp_code") or payload.get("code") or payload.get("otp") or "").strip()
    purpose = payload.get("purpose", "PASSWORD_RESET").strip()

    if not email or not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email and verification code are required.")

    now = datetime.datetime.utcnow()
    otp_record = db.query(models.OTP).filter(
        models.OTP.email == email,
        models.OTP.purpose == purpose,
        models.OTP.is_used == False,
        models.OTP.expires_at > now
    ).order_by(models.OTP.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please request a new one."
        )

    if otp_record.attempts >= 5:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Maximum verification attempts exceeded. Please request a new code."
        )

    if otp_record.otp_code != code:
        otp_record.attempts += 1
        db.commit()
        remaining = max(0, 5 - otp_record.attempts)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect verification code. {remaining} attempt(s) remaining."
        )

    # Invalidate OTP on successful verification
    otp_record.is_used = True
    db.commit()

    if purpose == "PASSWORD_RESET":
        # Issue short-lived password reset session token (15 mins)
        reset_token = auth.create_access_token({
            "sub": email,
            "email": email,
            "scope": "password_reset",
            "exp_minutes": 15
        })
        return {
            "success": True,
            "message": "Verification code verified successfully.",
            "reset_token": reset_token
        }

    if purpose == "LOGIN":
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

        profile_data: Dict[str, Any] = {}
        if user.role == "patient" and user.patient_profile:
            p = user.patient_profile
            profile_data = {"patient_id": p.id, "phone": p.phone, "age": p.age}
        elif user.role == "doctor" and user.doctor_profile:
            d = user.doctor_profile
            profile_data = {"doctor_id": d.id, "specialization": d.specialization, "hospital_name": d.hospital_name}

        token = auth.create_access_token({
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        })

        return {
            "access_token": token,
            "token_type": "Bearer",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "name": user.full_name,
                "email": user.email,
                "role": user.role,
                "hospital_id": user.hospital_id,
                **profile_data
            }
        }

    return {"success": True, "message": "Code verified successfully."}

@router.post("/reset-password")
def reset_password(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    token = payload.get("reset_token") or payload.get("resetToken")
    new_password = payload.get("new_password") or payload.get("newPassword")

    if not token or not new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token and new password are required.")

    if len(new_password) < 6:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be at least 6 characters.")

    decoded = auth.decode_access_token(token)
    if not decoded or decoded.get("scope") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired password reset session. Please request a new verification code."
        )

    email = decoded.get("email") or decoded.get("sub")
    user = db.query(models.User).filter(models.User.email == email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    user.password_hash = auth.hash_password(new_password)
    db.commit()

    return {
        "success": True,
        "message": "Your password has been successfully reset. You may now log in with your new credentials."
    }
