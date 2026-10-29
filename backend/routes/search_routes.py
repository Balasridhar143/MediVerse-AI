from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from database import get_db
import models

router = APIRouter(prefix="/search", tags=["Global Healthcare Navigation Search"])

@router.get("")
def global_search(
    q: str = Query(..., min_length=1, description="Global query across medicines, hospitals, doctors, and medical knowledge"),
    limit_per_category: int = Query(5, ge=1, le=20, description="Maximum results per category"),
    category: Optional[str] = Query(None, description="Optional filter: medicines, hospitals, doctors, articles"),
    db: Session = Depends(get_db)
):
    """
    Unified, privacy-preserving search across all public Mediverse AI clinical registries.
    Never exposes private patient records, user credentials, or confidential appointments.
    """
    clean_q = q.strip().lower()
    search_pattern = f"%{clean_q}%"

    results: Dict[str, List[Dict[str, Any]]] = {
        "medicines": [],
        "hospitals": [],
        "doctors": [],
        "articles": []
    }

    # 1. Search Medicines (Fast FTS5)
    if not category or category in ["all", "medicines"]:
        import re
        from sqlalchemy import text
        clean_word = re.sub(r'[^\w\s]', '', clean_q).strip()
        med_matches = []
        if clean_word:
            try:
                med_rows = db.execute(
                    text("""
                        SELECT m.id, m.brand_name, m.generic_name, m.composition, m.formulation, m.price, m.manufacturer
                        FROM medicines_fts f
                        JOIN medicines m ON m.rowid = f.rowid
                        WHERE medicines_fts MATCH :q
                        LIMIT :limit
                    """),
                    {"q": f"{clean_word}*", "limit": limit_per_category}
                ).fetchall()
                med_matches = [
                    {
                        "id": r[0],
                        "title": r[1],
                        "subtitle": r[2] or r[3] or "Pharmaceutical Compound",
                        "category": "Medicine",
                        "badge": r[4] or "Pharmaceutical",
                        "price": f"₹{r[5]:.2f}" if r[5] else None,
                        "manufacturer": r[6],
                        "url": f"/patient/medicines?id={r[0]}"
                    }
                    for r in med_rows
                ]
            except Exception as e:
                print(f"[Search Med FTS Error] {e}")

        if not med_matches:
            fallback = db.query(models.Medicine).filter(
                models.Medicine.brand_name.like(f"{clean_q}%")
            ).limit(limit_per_category).all()
            med_matches = [
                {
                    "id": m.id,
                    "title": m.brand_name,
                    "subtitle": m.generic_name or m.composition or "Pharmaceutical Compound",
                    "category": "Medicine",
                    "badge": m.formulation or "Pharmaceutical",
                    "price": f"₹{m.price:.2f}" if m.price else None,
                    "manufacturer": m.manufacturer,
                    "url": f"/patient/medicines?id={m.id}"
                }
                for m in fallback
            ]

        results["medicines"] = med_matches

    # 2. Search Hospitals (Fast FTS5)
    if not category or category in ["all", "hospitals"]:
        import re
        from sqlalchemy import text
        clean_word = re.sub(r'[^\w\s]', '', clean_q).strip()
        hosp_matches = []
        if clean_word:
            try:
                h_rows = db.execute(
                    text("""
                        SELECT h.id, h.hospital_name, h.city, h.district, h.state, h.facility_type, h.emergency_phone, h.phone
                        FROM hospitals_fts f
                        JOIN hospitals h ON h.rowid = f.rowid
                        WHERE hospitals_fts MATCH :q
                        LIMIT :limit
                    """),
                    {"q": f"{clean_word}*", "limit": limit_per_category}
                ).fetchall()
                hosp_matches = [
                    {
                        "id": r[0],
                        "title": r[1],
                        "subtitle": f"{r[2] or r[3] or ''}, {r[4]}",
                        "category": "Hospital",
                        "badge": r[5] or "Hospital",
                        "phone": r[6] or r[7] or "108",
                        "url": f"/patient/find-hospital?search={r[1]}"
                    }
                    for r in h_rows
                ]
            except Exception as e:
                print(f"[Search Hosp FTS Error] {e}")

        if not hosp_matches:
            fallback_h = db.query(models.Hospital).filter(
                models.Hospital.hospital_name.like(f"{clean_q}%")
            ).limit(limit_per_category).all()
            hosp_matches = [
                {
                    "id": h.id,
                    "title": h.hospital_name,
                    "subtitle": f"{h.city or h.district or ''}, {h.state}",
                    "category": "Hospital",
                    "badge": h.facility_type or "Hospital",
                    "phone": h.emergency_phone or h.phone or "108",
                    "url": f"/patient/find-hospital?search={h.hospital_name}"
                }
                for h in fallback_h
            ]

        results["hospitals"] = hosp_matches

    # 3. Search Doctors
    if not category or category in ["all", "doctors"]:
        # Query registered doctors first
        doc_matches = db.query(models.Doctor).filter(
            or_(
                func.lower(models.Doctor.full_name).like(search_pattern),
                func.lower(models.Doctor.specialization).like(search_pattern),
                func.lower(models.Doctor.department).like(search_pattern),
                func.lower(models.Doctor.hospital_name).like(search_pattern)
            )
        ).limit(limit_per_category).all()

        doctor_items = [
            {
                "id": d.id,
                "title": f"Dr. {d.full_name.replace('Dr. ', '')}",
                "subtitle": f"{d.specialization} • {d.hospital_name or 'City Care Multispeciality Hospital'}",
                "category": "Doctor",
                "badge": "Telehealth Active",
                "rating": float(d.rating or 4.9),
                "url": f"/patient/find-doctor?search={d.full_name}"
            }
            for d in doc_matches
        ]

        # Supplement with professional directory if needed
        remaining_slots = limit_per_category - len(doctor_items)
        if remaining_slots > 0:
            prof_matches = db.query(models.Professional).filter(
                models.Professional.registration_status != "Clinical Center",
                or_(
                    func.lower(models.Professional.name).like(search_pattern),
                    func.lower(models.Professional.specialization).like(search_pattern),
                    func.lower(models.Professional.hospital_affiliation).like(search_pattern)
                )
            ).limit(remaining_slots).all()

            for p in prof_matches:
                p_name = p.name if p.name.startswith("Dr.") else f"Dr. {p.name}"
                doctor_items.append({
                    "id": p.id,
                    "title": p_name,
                    "subtitle": f"{p.specialization or 'General Practitioner'} • {p.hospital_affiliation or p.state or 'India'}",
                    "category": "Doctor",
                    "badge": "Registered Clinician",
                    "rating": 4.8,
                    "url": f"/patient/find-doctor?search={p.name}"
                })

        results["doctors"] = doctor_items

    # 4. Search Medical Knowledge Articles / Documents
    if not category or category in ["all", "articles"]:
        doc_matches = db.query(models.MedicalDocument).filter(
            or_(
                func.lower(models.MedicalDocument.title).like(search_pattern),
                func.lower(models.MedicalDocument.category).like(search_pattern),
                func.lower(models.MedicalDocument.excerpt).like(search_pattern)
            )
        ).limit(limit_per_category).all()

        results["articles"] = [
            {
                "id": doc.id,
                "title": doc.title,
                "subtitle": doc.excerpt[:120] + "..." if doc.excerpt else f"Category: {doc.category}",
                "category": "Medical Knowledge",
                "badge": doc.category or "Clinical Reference",
                "url": f"/patient/dashboard"
            }
            for doc in doc_matches
        ]

    total_count = sum(len(items) for items in results.values())

    return {
        "query": q,
        "total_results": total_count,
        "results": results
    }
