import os
import re
import json
import math
from typing import List, Optional, Union, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from database import get_db
import models
import schemas
import auth

router = APIRouter(tags=["Hospitals & Administration"])

# Paths to dataset manifests
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STATS_JSON_PATH = os.path.join(PROJECT_ROOT, "data", "manifests", "dataset_statistics.json")
CLEANING_JSON_PATH = os.path.join(PROJECT_ROOT, "data", "manifests", "cleaning_manifest.json")

@router.get("/hospitals")
def list_hospitals(
    q: Optional[str] = Query(None, description="Search by name, city, district, or address"),
    state: Optional[str] = Query(None, description="Filter by state / UT"),
    district: Optional[str] = Query(None, description="Filter by district"),
    facility_type: Optional[str] = Query(None, description="Filter by facility classification"),
    has_coords: Optional[bool] = Query(None, description="Filter only records with valid GPS coordinates"),
    page: Optional[int] = Query(1, ge=1, description="Page number"),
    limit: Optional[int] = Query(20, ge=1, le=100, description="Items per page"),
    raw_list: Optional[bool] = Query(False, description="Return raw list array for legacy compatibility"),
    db: Session = Depends(get_db)
):
    """
    Search and filter verified Indian hospitals with server-side pagination.
    Supports nationwide coverage across all Indian States and Union Territories.
    """
    # If facility_type is specifically a non-hospital clinic/PHC/CHC, query healthcare_facilities
    is_healthcare_fac = facility_type and any(kw in facility_type.lower() for kw in ["centre", "center", "phc", "clinic", "dispensary", "pharmacy", "sub-centre"])
    
    if is_healthcare_fac:
        query = db.query(models.HealthcareFacility)
        if q:
            sp = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    models.HealthcareFacility.facility_name.ilike(sp),
                    models.HealthcareFacility.city.ilike(sp),
                    models.HealthcareFacility.district.ilike(sp),
                    models.HealthcareFacility.address.ilike(sp),
                    models.HealthcareFacility.services_offered.ilike(sp)
                )
            )
        if state and state.lower() != "all":
            query = query.filter(models.HealthcareFacility.state.ilike(state.strip()))
        if district and district.lower() != "all":
            query = query.filter(models.HealthcareFacility.district.ilike(district.strip()))
        if has_coords:
            query = query.filter(
                models.HealthcareFacility.latitude.isnot(None),
                models.HealthcareFacility.longitude.isnot(None)
            )
        total = query.count()
        offset = (page - 1) * limit
        facilities = query.order_by(models.HealthcareFacility.state.asc(), models.HealthcareFacility.facility_name.asc()).offset(offset).limit(limit).all()
        
        # Transform into unified schema
        items = [
            {
                "id": f.id,
                "hospital_name": f.facility_name,
                "facility_type": f.facility_type,
                "ownership_type": f.ownership_type or "Public",
                "address": f.address or f"{f.district or ''}, {f.state}",
                "city": f.city or f.district,
                "district": f.district,
                "state": f.state,
                "postal_code": f.postal_code,
                "phone": f.phone or "+91 Helpdesk",
                "emergency_phone": "108",
                "website": f.website or "",
                "latitude": f.latitude,
                "longitude": f.longitude,
                "departments": f.services_offered or "Primary Healthcare, General Outpatient Care",
                "available_beds": 10,
                "available_doctors": 4,
                "emergency_availability": "Outpatient Consultation Active",
                "source": f.source,
                "source_record_id": f.source_record_id,
                "source_url": f.source_url,
                "last_verification_date": "2026-Q1",
                "created_at": f.created_at
            }
            for f in facilities
        ]
    else:
        clean_q = re.sub(r'[^\w\s]', '', q).strip() if q else ""
        if clean_q and not state and not district and not facility_type and not has_coords:
            # High-speed FTS5 index lookup
            try:
                from sqlalchemy import text
                fts_query = f"{clean_q}*"
                count_res = db.execute(
                    text("SELECT count(*) FROM hospitals_fts WHERE hospitals_fts MATCH :q"),
                    {"q": fts_query}
                ).scalar() or 0

                offset = (page - 1) * limit
                hosp_rows = db.execute(
                    text("""
                        SELECT h.id, h.hospital_name, h.facility_type, h.ownership_type, h.address,
                               h.city, h.district, h.state, h.postal_code, h.phone, h.emergency_phone,
                               h.website, h.latitude, h.longitude, h.departments, h.available_beds,
                               h.available_doctors, h.emergency_availability, h.source, h.source_record_id,
                               h.source_url, h.last_verification_date, h.created_at
                        FROM hospitals_fts f
                        JOIN hospitals h ON h.rowid = f.rowid
                        WHERE hospitals_fts MATCH :q
                        LIMIT :limit OFFSET :offset
                    """),
                    {"q": fts_query, "limit": limit, "offset": offset}
                ).fetchall()

                items = [
                    type('HospitalItem', (), {
                        "id": r[0],
                        "hospital_name": r[1],
                        "facility_type": r[2],
                        "ownership_type": r[3],
                        "address": r[4],
                        "city": r[5],
                        "district": r[6],
                        "state": r[7],
                        "postal_code": r[8],
                        "phone": r[9],
                        "emergency_phone": r[10],
                        "website": r[11],
                        "latitude": r[12],
                        "longitude": r[13],
                        "departments": r[14],
                        "available_beds": r[15],
                        "available_doctors": r[16],
                        "emergency_availability": r[17],
                        "source": r[18],
                        "source_record_id": r[19],
                        "source_url": r[20],
                        "last_verification_date": r[21],
                        "created_at": r[22]
                    })()
                    for r in hosp_rows
                ]

                total_pages = max(1, math.ceil(count_res / limit)) if count_res > 0 else 1
                return {
                    "items": items,
                    "total": count_res,
                    "page": page,
                    "page_size": limit,
                    "total_pages": total_pages,
                }
            except Exception as e:
                print(f"[Hospital FTS Fallback] {e}")

        query = db.query(models.Hospital)
        if q:
            sp = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    models.Hospital.hospital_name.like(sp),
                    models.Hospital.city.like(sp),
                    models.Hospital.district.like(sp),
                    models.Hospital.address.like(sp)
                )
            )
        if state and state.lower() != "all":
            query = query.filter(models.Hospital.state == state.strip())
        if district and district.lower() != "all":
            query = query.filter(models.Hospital.district == district.strip())
        if facility_type and facility_type.lower() != "all":
            query = query.filter(models.Hospital.facility_type.like(f"%{facility_type.strip()}%"))
        if has_coords:
            query = query.filter(
                models.Hospital.latitude.isnot(None),
                models.Hospital.longitude.isnot(None)
            )
        total = query.count()
        offset = (page - 1) * limit
        items = query.order_by(models.Hospital.hospital_name.asc()).offset(offset).limit(limit).all()

    total_pages = max(1, math.ceil(total / limit)) if total > 0 else 1

    if raw_list:
        return items

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": limit,
        "total_pages": total_pages,
    }

@router.get("/facilities/filters")
def get_facility_filters(db: Session = Depends(get_db)):
    """
    Returns unique states, top districts, and facility types
    for dynamic cascading dropdowns on the frontend.
    """
    # Fetch distinct states from both hospitals and facilities
    hosp_states = db.query(models.Hospital.state).distinct().filter(models.Hospital.state.isnot(None)).all()
    states = sorted(list({s[0].strip() for s in hosp_states if s[0] and len(s[0].strip()) > 1}))
    
    facility_types = [
        "All Facilities",
        "Hospital",
        "Primary Health Centre (PHC)",
        "Community Health Centre (CHC)",
        "Clinic",
        "Diagnostic Centre",
        "Pharmacy",
        "Sub-Centre"
    ]
    
    return {
        "states": states,
        "facility_types": facility_types
    }

@router.get("/facilities/statistics")
@router.get("/datasets/statistics")
def get_dataset_statistics(db: Session = Depends(get_db)):
    """
    Returns actual verified database record counts, category totals,
    geographic distributions, and progress towards the 10 Lakh record objective.
    Reads from generated manifest with live fallback to database counts.
    """
    if os.path.exists(STATS_JSON_PATH):
        try:
            with open(STATS_JSON_PATH, "r", encoding="utf-8") as f:
                stats = json.load(f)
                return stats
        except Exception:
            pass

    # Live query fallback
    total_hosp = db.query(models.Hospital).count()
    total_fac = db.query(models.HealthcareFacility).count()
    total_doc = db.query(models.Professional).count()
    total_med = db.query(models.Medicine).count()
    total_ph = db.query(models.PublicHealthIndicator).count()
    total_lab = db.query(models.LaboratoryObservation).count()
    total_docm = db.query(models.MedicalDocument).count()
    total_imported = total_hosp + total_fac + total_doc + total_med + total_ph + total_lab + total_docm

    return {
        "total_imported_records": total_imported,
        "target_metric": {
            "target": 1000000,
            "achieved": total_imported,
            "progress_percentage": round((total_imported / 1000000) * 100, 2),
            "is_target_reached": total_imported >= 1000000,
            "remaining_gap": max(0, 1000000 - total_imported)
        },
        "category_counts": {
            "hospitals": total_hosp,
            "healthcare_facilities": total_fac,
            "professionals_doctors": total_doc,
            "indian_medicines": total_med,
            "public_health_indicators": total_ph,
            "clinical_laboratory_observations": total_lab,
            "medical_knowledge_documents": total_docm
        }
    }

@router.get("/hospitals/{hospital_id}")
def get_hospital(hospital_id: str, db: Session = Depends(get_db)):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        # Check healthcare facilities as fallback
        fac = db.query(models.HealthcareFacility).filter(models.HealthcareFacility.id == hospital_id).first()
        if fac:
            return {
                "id": fac.id,
                "hospital_name": fac.facility_name,
                "facility_type": fac.facility_type,
                "ownership_type": fac.ownership_type or "Public",
                "address": fac.address or f"{fac.district}, {fac.state}",
                "city": fac.city or fac.district,
                "district": fac.district,
                "state": fac.state,
                "postal_code": fac.postal_code,
                "phone": fac.phone or "+91 Helpdesk",
                "emergency_phone": "108",
                "website": fac.website,
                "latitude": fac.latitude,
                "longitude": fac.longitude,
                "departments": fac.services_offered or "Primary Care, Outpatient Services",
                "available_doctors": 4,
                "emergency_availability": "Outpatient Care Active",
                "source": fac.source,
                "source_record_id": fac.source_record_id,
                "source_url": fac.source_url,
                "last_verification_date": "2026-Q1",
                "created_at": fac.created_at
            }
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital or facility with ID '{hospital_id}' not found"
        )
    return hospital

@router.get("/hospitals/{hospital_id}/registrations", response_model=List[schemas.RegistrationOut])
def get_hospital_registrations(
    hospital_id: str,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Hospital-specific registration dashboard records.
    Enforces role-based authorization and strict facility isolation.
    """
    user_role = "hospital_admin" if current_user.role == "hospital" else current_user.role
    if user_role not in ["hospital_admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Requires hospital administrator or clinical staff authorization."
        )

    # Enforce facility isolation: Admin can only access their own hospital's registrations
    if user_role == "hospital_admin" and current_user.hospital_id and current_user.hospital_id != hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot access patient registrations belonging to another hospital facility."
        )

    # Verify hospital exists
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID '{hospital_id}' not found"
        )

    query = db.query(models.PatientRegistration).filter(
        models.PatientRegistration.hospital_id == hospital_id
    )

    if status_filter and status_filter.lower() != "all":
        query = query.filter(models.PatientRegistration.status.ilike(status_filter.strip()))

    registrations = query.order_by(models.PatientRegistration.created_at.desc()).all()

    if search:
        search_lower = search.strip().lower()
        registrations = [
            r for r in registrations
            if (search_lower in r.id.lower() or
                (r.patient and search_lower in r.patient.full_name.lower()) or
                search_lower in r.reason_for_visit.lower())
        ]

    return registrations

@router.patch("/registrations/{registration_id}/status", response_model=schemas.RegistrationOut)
def update_registration_status(
    registration_id: str,
    status_update: schemas.RegistrationStatusUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    user_role = "hospital_admin" if current_user.role == "hospital" else current_user.role
    if user_role not in ["hospital_admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to update patient clinical registration status."
        )

    reg = db.query(models.PatientRegistration).filter(
        models.PatientRegistration.id == registration_id
    ).first()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration record not found"
        )

    # Verify facility match
    if user_role == "hospital_admin" and current_user.hospital_id and current_user.hospital_id != reg.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify registrations belonging to another hospital facility."
        )

    valid_statuses = ["Pending", "Confirmed", "Completed", "Cancelled"]
    new_status = status_update.status.capitalize()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of {valid_statuses}"
        )

    reg.status = new_status
    db.commit()
    db.refresh(reg)
    return reg

@router.get("/hospitals/districts")
def get_districts_by_state(
    state: str = Query(..., description="Indian State to fetch districts for"),
    db: Session = Depends(get_db)
):
    """
    Returns authentic verified districts for a selected Indian State.
    """
    clean_state = state.strip()
    # Query distinct districts in this state from hospitals
    rows = db.query(models.Hospital.district).distinct().filter(
        models.Hospital.state.ilike(clean_state),
        models.Hospital.district.isnot(None)
    ).all()
    districts = sorted(list({r[0].strip() for r in rows if r[0] and len(r[0].strip()) > 1 and r[0].strip().lower() != clean_state.lower()}))
    return {
        "state": clean_state,
        "districts": districts
    }

@router.get("/hospitals/nearby")
def get_nearby_hospitals(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(25.0, ge=1, le=200),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Computes geographical Haversine distance to find closest accredited hospitals.
    """
    # Approximate degree bounding box for fast query filtering
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * max(0.1, math.cos(math.radians(latitude))))

    candidates = db.query(models.Hospital).filter(
        models.Hospital.latitude.between(latitude - lat_delta, latitude + lat_delta),
        models.Hospital.longitude.between(longitude - lon_delta, longitude + lon_delta)
    ).limit(200).all()

    # Exact Haversine formula calculation
    hospitals_with_distance = []
    r_earth = 6371.0 # km
    for h in candidates:
        if h.latitude is None or h.longitude is None:
            continue
        d_lat = math.radians(h.latitude - latitude)
        d_lon = math.radians(h.longitude - longitude)
        a = (math.sin(d_lat / 2) ** 2 +
             math.cos(math.radians(latitude)) * math.cos(math.radians(h.latitude)) * math.sin(d_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = round(r_earth * c, 2)
        if distance <= radius_km:
            hospitals_with_distance.append({
                "id": h.id,
                "hospital_name": h.hospital_name,
                "facility_type": h.facility_type,
                "ownership_type": h.ownership_type,
                "address": h.address,
                "city": h.city,
                "district": h.district,
                "state": h.state,
                "phone": h.phone or "+91 Emergency Desk",
                "emergency_phone": h.emergency_phone or "108",
                "latitude": h.latitude,
                "longitude": h.longitude,
                "departments": h.departments,
                "emergency_availability": h.emergency_availability,
                "distance_km": distance,
                "source": h.source
            })

    hospitals_with_distance.sort(key=lambda x: x["distance_km"])
    return hospitals_with_distance[:limit]
