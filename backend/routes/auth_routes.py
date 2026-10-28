import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.TokenResponse)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check if email already registered
    existing_user = db.query(models.User).filter(models.User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address is already registered."
        )

    # 2. Determine hospital affiliation if hospital admin
    hospital_id = user_in.hospital_id
    if user_in.role in ["hospital_admin", "hospital"]:
        user_in.role = "hospital_admin"
        if not hospital_id and user_in.hospital_name:
            # Check or create hospital record
            hosp = db.query(models.Hospital).filter(
                models.Hospital.hospital_name.ilike(f"%{user_in.hospital_name}%")
            ).first()
            if not hosp:
                hosp = models.Hospital(
                    id=f"hosp_{uuid.uuid4().hex[:8]}",
                    hospital_name=user_in.hospital_name,
                    address="Medical Hub Campus",
                    city="City",
                    state="State",
                    latitude=28.6139,
                    longitude=77.2090,
                    source="Hospital Administrator Self-Registration"
                )
                db.add(hosp)
                db.flush()
            hospital_id = hosp.id

    # 3. Create User record
    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    hashed_pwd = auth.hash_password(user_in.password)
    
    new_user = models.User(
        id=user_id,
        full_name=user_in.full_name,
        email=user_in.email.lower().strip(),
        password_hash=hashed_pwd,
        role=user_in.role,
        hospital_id=hospital_id
    )
    db.add(new_user)
    db.flush()

    # 4. If registering as patient, create Patient profile
    if user_in.role == "patient":
        patient_id = f"pat_{uuid.uuid4().hex[:8]}"
        patient_rec = models.Patient(
            id=patient_id,
            user_id=new_user.id,
            full_name=user_in.full_name,
            age=user_in.age,
            gender=user_in.gender,
            blood_group=user_in.blood_group,
            phone=user_in.phone or "+91 0000000000",
            address=user_in.address or "Address on file"
        )
        db.add(patient_rec)

    db.commit()
    db.refresh(new_user)

    # 5. Generate secure JWT token
    token = auth.create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})

    return schemas.TokenResponse(
        access_token=token,
        token_type="Bearer",
        user=schemas.UserOut.model_validate(new_user)
    )

@router.post("/login", response_model=schemas.TokenResponse)
def login_user(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email.lower().strip()).first()
    if not user or not auth.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = auth.create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return schemas.TokenResponse(
        access_token=token,
        token_type="Bearer",
        user=schemas.UserOut.model_validate(user)
    )

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    return schemas.UserOut.model_validate(current_user)
